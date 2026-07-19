"use client";

import { useEffect, useState } from "react";
import type { Answers } from "@/lib/toolTypes";
import VoiceInputButton, { isSpeechRecognitionSupported } from "./VoiceInputButton";

const DRAFT_KEY = "pattern-spotter:draft-answers";

function loadDraft(): Answers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraftAnswers() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore storage errors (private browsing, quota, etc.)
  }
}

const FIELDS: {
  key: keyof Answers;
  label: string;
  placeholder: string;
  rows: number;
}[] = [
  {
    key: "situation",
    label: "The situation you keep finding yourself in",
    placeholder:
      "Describe a recurring situation where you notice the pattern kick in, whatever shape it takes for you: holding back, shrinking, performing, procrastinating, overworking, shutting down, numbing out, or something else entirely. Be as specific as you can: what happens, who is there, what you do, and what you feel but do not say.",
    rows: 4,
  },
  {
    key: "story",
    label: "What you tell yourself about why you do it",
    placeholder:
      "What is the story you have told yourself about why you act this way? For example: I do it to keep the peace. I work better under pressure anyway. I am just not good at finishing things. I am not a confrontational person. Write whatever comes up, even if it feels obvious.",
    rows: 3,
  },
  {
    key: "origin",
    label: "Where you first learned this was the safest way to be",
    placeholder:
      "Can you remember a moment, or a period, where you first learned that being this way was the safest way to be? What was happening around you then?",
    rows: 3,
  },
  {
    key: "want",
    label: "What you actually want in that moment",
    placeholder:
      "What do you wish you could say, do, or feel instead? What does the version of you who is not running this pattern actually want in that situation?",
    rows: 3,
  },
];

export default function QuestionForm({
  initialAnswers,
  onSubmit,
}: {
  initialAnswers?: Answers;
  onSubmit: (answers: Answers) => Promise<void>;
}) {
  const [answers, setAnswers] = useState<Answers>(
    () =>
      initialAnswers ??
      loadDraft() ?? { situation: "", story: "", origin: "", want: "" }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    setVoiceSupported(isSpeechRecognitionSupported());
  }, []);

  // Persist as a draft so a reload or an error further down the flow
  // (e.g. a failed /api/generate call) never wipes out someone's answers,
  // voice-dictated ones especially since those take real effort to redo.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
    } catch {
      // ignore storage errors (private browsing, quota, etc.)
    }
  }, [answers]);

  const answeredCount = Object.values(answers).filter((v) => v.trim()).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(answers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-3">
        <span className="eyebrow-chip">{answeredCount} / 4 answered</span>
      </div>
      <p className="eyebrow text-base mb-2 text-center">
        What you write here is private. It is used only to generate your reading, never stored, and never seen by us.
      </p>
      {voiceSupported && (
        <p className="text-xs text-dark/45 text-center mb-8 max-w-md mx-auto">
          Prefer to talk? Voice input is transcribed by your browser&apos;s
          speech recognition (e.g. Google), which briefly processes your
          speech to turn it into text.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        {FIELDS.map((field) => (
          <div key={field.key} className="mb-8">
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="field-label mb-0" htmlFor={field.key}>
                {field.label}
              </label>
              <VoiceInputButton
                value={answers[field.key]}
                onChange={(next) =>
                  setAnswers((prev) => ({ ...prev, [field.key]: next }))
                }
              />
            </div>
            <textarea
              id={field.key}
              required
              rows={field.rows}
              placeholder={field.placeholder}
              value={answers[field.key]}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              className="field-textarea"
            />
          </div>
        ))}

        {error && <p className="text-terracotta text-sm mb-4">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Reading..." : "Show me the pattern"}
        </button>
      </form>
    </div>
  );
}
