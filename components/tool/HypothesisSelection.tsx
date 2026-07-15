"use client";

import { useState } from "react";

export default function HypothesisSelection({
  hypotheses,
  onSelect,
}: {
  hypotheses: string[];
  onSelect: (belief: string) => Promise<void>;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSelect(belief: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSelect(belief);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-3xl mb-3 text-center">Which of these feels most true?</h2>
      <p className="text-dark/70 text-center mb-10">
        These are not facts, they are possibilities. Pick the one that lands,
        even if it stings a little.
      </p>

      <div className="flex flex-col gap-4">
        {hypotheses.map((h, i) => (
          <button
            key={i}
            onClick={() => handleSelect(h)}
            disabled={submitting}
            className="card w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p className="leading-relaxed">{h}</p>
          </button>
        ))}
      </div>

      {!showCustom ? (
        <button
          onClick={() => setShowCustom(true)}
          className="mt-8 text-brown underline text-sm block mx-auto"
        >
          None of these feel right, let me write my own
        </button>
      ) : (
        <div className="mt-8">
          <textarea
            rows={3}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Write the belief that feels true to you."
            className="field-textarea mb-4"
          />
          <button
            onClick={() => customText.trim() && handleSelect(customText.trim())}
            disabled={submitting || !customText.trim()}
            className="btn-primary"
          >
            Use this instead
          </button>
        </div>
      )}
    </div>
  );
}
