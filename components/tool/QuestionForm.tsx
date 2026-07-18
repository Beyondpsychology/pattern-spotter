"use client";

import { useState } from "react";
import type { Answers } from "@/lib/toolTypes";

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
    initialAnswers ?? { situation: "", story: "", origin: "", want: "" }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <p className="text-xs uppercase tracking-wider text-brown font-semibold mb-3 text-center">
        {answeredCount} / 4 answered
      </p>
      <p className="eyebrow text-base mb-8 text-center">
        What you write here is private. It is used only to generate your reading, never stored, and never seen by us.
      </p>

      <form onSubmit={handleSubmit}>
        {FIELDS.map((field) => (
          <div key={field.key} className="mb-8">
            <label className="field-label" htmlFor={field.key}>
              {field.label}
            </label>
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
