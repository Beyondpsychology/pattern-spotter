"use client";

import { useState } from "react";

export default function EmailGate({
  onSubmit,
}: {
  onSubmit: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-center">
      <p className="eyebrow text-lg mb-3">for the exhausted and the easy to be around</p>
      <h1 className="text-4xl md:text-5xl mb-6 leading-tight">The Pattern Spotter</h1>
      <p className="text-dark/80 leading-relaxed mb-10 max-w-[560px] mx-auto">
        You say yes when you mean no. You shrink to keep the peace. You perform
        to avoid disappointing someone. Answer four questions and find out
        which people pleasing pattern is actually running underneath it, where
        it started, and where it is still running today.
      </p>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto text-left">
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
      </form>
    </div>
  );
}
