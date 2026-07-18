/*
Migration SQL — run this once in the Supabase SQL editor before using the app.

CREATE TABLE IF NOT EXISTS email_captures (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  has_completed boolean not null default false,
  reading jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS email_captures_email_idx ON email_captures (lower(email));
*/

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, formatAnswers } from "@/lib/prompts";
import { parseGenerateResponse } from "@/lib/parseReading";
import { matchProduct } from "@/lib/products";
import { getSupabaseAdmin, normalizeEmail } from "@/lib/supabaseAdmin";
import { checkIpRateLimit, getClientIp } from "@/lib/rateLimit";
import { buildReadingHtml } from "@/lib/pdf-template";
import { renderHtmlToPdf } from "@/lib/renderPdf";
import { uploadReadingPdf } from "@/lib/pdfStorage";
import { sendReadingPdfLink } from "@/lib/activeCampaign";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    if (!checkIpRateLimit(ip)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const { situation, story, origin, want, email, belief } = body ?? {};

    if (
      typeof situation !== "string" ||
      typeof story !== "string" ||
      typeof origin !== "string" ||
      typeof want !== "string" ||
      typeof email !== "string" ||
      typeof belief !== "string" ||
      !situation.trim() ||
      !story.trim() ||
      !origin.trim() ||
      !want.trim() ||
      !email.trim() ||
      !belief.trim()
    ) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const supabase = getSupabaseAdmin();

    const { data: existing, error: selectError } = await supabase
      .from("email_captures")
      .select("has_completed")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (selectError) {
      console.error("generate select error", selectError);
      return NextResponse.json({ error: "database_error" }, { status: 500 });
    }

    if (existing?.has_completed) {
      return NextResponse.json({ error: "already_used" }, { status: 403 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const userMessage =
      formatAnswers({ situation, story, origin, want }) +
      `\n\nCONFIRMED BELIEF (the user selected this as the one that feels most true):\n${belief}`;

    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2400,
        temperature: 0.7,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userMessage }],
      });
    } catch (err) {
      console.error("Anthropic generate call failed", err);
      return NextResponse.json({ error: "generation_failed" }, { status: 502 });
    }

    const raw = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const { sections, sessionNames, toolkitFit } = parseGenerateResponse(raw);

    const sessions = sessionNames
      .map((name) => matchProduct(name))
      .filter((entry): entry is { name: string; url: string } => entry !== null);

    const readingData = { sections, sessions, toolkitFit };

    // Upsert rather than update: the email-capture step should already have
    // inserted this row, but upsert covers the case where it didn't. Runs
    // alongside the PDF generation/upload/email-link steps below, none of
    // which can fail the response — they're best-effort side effects.
    const [{ error: updateError }] = await Promise.all([
      supabase.from("email_captures").upsert(
        {
          email: normalizedEmail,
          has_completed: true,
          reading: readingData,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      ),
      buildReadingHtml(readingData)
        .then((html) => renderHtmlToPdf(html))
        .then((pdfBuffer) => uploadReadingPdf(supabase, normalizedEmail, pdfBuffer))
        .then((pdfUrl) => {
          if (pdfUrl) return sendReadingPdfLink(normalizedEmail, pdfUrl);
        })
        .catch((err) => console.error("PDF generation/email pipeline failed", err)),
    ]);

    if (updateError) {
      console.error("Failed to persist reading", updateError);
      // The user already has their reading generated — don't fail the
      // response over a persistence error, but this should be monitored.
    }

    return NextResponse.json({ sections, sessions, toolkitFit });
  } catch (err) {
    console.error("generate unhandled error", err);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
