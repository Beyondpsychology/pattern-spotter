import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { HYPOTHESIS_PROMPT, formatAnswers } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { situation, story, origin, want, email } = body ?? {};

  if (
    typeof situation !== "string" ||
    typeof story !== "string" ||
    typeof origin !== "string" ||
    typeof want !== "string" ||
    typeof email !== "string" ||
    !situation.trim() ||
    !story.trim() ||
    !origin.trim() ||
    !want.trim() ||
    !email.trim()
  ) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = formatAnswers({ situation, story, origin, want });

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      temperature: 0.7,
      system: [
        {
          type: "text",
          text: HYPOTHESIS_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    console.error("Anthropic hypotheses call failed", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const raw = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const hypotheses = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("H:"))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);

  return NextResponse.json({ hypotheses });
}
