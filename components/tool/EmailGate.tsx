"use client";

import { useState } from "react";

export default function EmailGate({
  onSubmit,
  initialName,
  initialEmail,
}: {
  onSubmit: (name: string, email: string, code: string) => Promise<void>;
  initialName?: string;
  initialEmail?: string;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(name, email, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-center">
      <p className="eyebrow text-base mb-3">Introducing</p>
      <h1 className="text-4xl md:text-5xl mb-4 leading-tight">The Pattern Spotter</h1>
      <div className="divider" />
      <p className="text-dark/80 leading-relaxed mb-10 max-w-[560px] mx-auto">
        You were never too much. You were just never safe enough to be
        yourself. Whatever it looks like for you, performing, pleasing,
        shrinking, carrying someone else's story as your own, there is a
        pattern underneath it. Answer four questions and find out what it is,
        where it started, and where it is still running today.
      </p>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto text-left">
        <label className="field-label" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jamie"
          className="field-textarea mb-4"
        />

        <label className="field-label" htmlFor="email">
          Your email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="field-textarea mb-4"
        />
        {error && <p className="text-terracotta text-sm mb-4">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Checking..." : "Start"}
        </button>
        <p className="text-xs text-dark/45 text-center mt-4">
          We use your email to send you a copy of your reading, and to add
          you to our newsletter. Unsubscribe anytime.
        </p>

        {!showCode ? (
          <button
            type="button"
            onClick={() => setShowCode(true)}
            className="mt-4 text-brown underline text-xs block mx-auto"
          >
            Have a code?
          </button>
        ) : (
          <div className="mt-4">
            <label className="field-label" htmlFor="code">
              Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Optional"
              className="field-textarea"
            />
          </div>
        )}
      </form>
    </div>
  );
}
