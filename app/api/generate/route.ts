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
import { waitUntil } from "@vercel/functions";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, formatAnswers } from "@/lib/prompts";
import { parseGenerateResponse } from "@/lib/parseReading";
import { matchProduct } from "@/lib/products";
import { getSupabaseAdmin, normalizeEmail } from "@/lib/supabaseAdmin";
import { checkIpRateLimit, getClientIp } from "@/lib/rateLimit";
import { generateReadingPdf } from "@/lib/pdf";
import { uploadReadingPdf } from "@/lib/pdfStorage";
import { sendReadingPdfLink } from "@/lib/activeCampaign";

// Give the background PDF/email work (kicked off via waitUntil below) enough
// runway to finish after the response is sent. Vercel caps this at whatever
// the plan allows, so this is a ceiling, not a guarantee.
export const maxDuration = 60;

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
      .select("has_completed, reading")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (selectError) {
      console.error("generate select error", selectError);
      return NextResponse.json({ error: "database_error" }, { status: 500 });
    }

    if (existing?.has_completed) {
      return NextResponse.json(
        { error: "already_used", reading: existing.reading ?? null },
        { status: 403 }
      );
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

    // Everything below (marking has_completed, generating the PDF, uploading
    // it, and pushing the link to ActiveCampaign) runs in the background via
    // waitUntil rather than being awaited here. Anthropic's own reading call
    // above already eats several seconds of the request; if the response also
    // waited on PDF rendering + a Supabase Storage upload + an ActiveCampaign
    // API call, the combined time can exceed Vercel's function duration limit
    // and the whole request would fail with the reading never reaching the
    // browser. The user sees their reading immediately; the PDF/email side
    // effects land a few seconds later.
    waitUntil(
      (async () => {
        // Upsert rather than update: the email-capture step should already
        // have inserted this row, but upsert covers the case where it didn't.
        const { error: updateError } = await supabase.from("email_captures").upsert(
          {
            email: normalizedEmail,
            has_completed: true,
            reading: readingData,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
        if (updateError) console.error("Failed to persist reading", updateError);

        try {
          const pdfBuffer = await generateReadingPdf(readingData);
          const pdfUrl = await uploadReadingPdf(supabase, normalizedEmail, pdfBuffer);
          if (pdfUrl) await sendReadingPdfLink(normalizedEmail, pdfUrl);
        } catch (err) {
          console.error("PDF generation/email pipeline failed", err);
        }
      })()
    );

    return NextResponse.json({ sections, sessions, toolkitFit });
  } catch (err) {
    console.error("generate unhandled error", err);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
