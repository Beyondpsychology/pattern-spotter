"use client";

import { useState } from "react";
import { READING_PACK_CREDITS } from "@/lib/stripe";

export default function BuyAccess({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      if (!data.url) throw new Error();

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="text-center">
      <p className="eyebrow text-base mb-3">Get the Pattern Spotter</p>
      <h1 className="text-3xl mb-4 leading-tight">
        {READING_PACK_CREDITS} readings for €27
      </h1>
      <div className="divider" />
      <p className="text-dark/80 leading-relaxed mb-10 max-w-[480px] mx-auto">
        One payment, {READING_PACK_CREDITS} readings to use whenever you want:
        different situations, different layers, the same pattern seen from a
        new angle each time.
      </p>

      {error && <p className="text-terracotta text-sm mb-4">{error}</p>}
      <button
        onClick={handleBuy}
        disabled={loading}
        className="btn-primary max-w-md mx-auto"
      >
        {loading ? "Redirecting to checkout..." : "Buy now — €27"}
      </button>
    </div>
  );
}
