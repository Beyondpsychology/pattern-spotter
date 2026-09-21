"use client";

import { useState } from "react";
import { CREDIT_PACKS } from "@/lib/stripe";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import { loadTrafficSource } from "@/lib/trafficSource";

const PACK = CREDIT_PACKS[0];

function formatEuros(cents: number) {
  const euros = cents / 100;
  return Number.isInteger(euros) ? `€${euros}` : `€${euros.toFixed(2)}`;
}

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
        body: JSON.stringify({ name, email, packId: PACK.id, trafficSource: loadTrafficSource() }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      if (!data.url) throw new Error();

      trackInitiateCheckout(PACK);
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="text-center">
      <p className="eyebrow text-base mb-3">Your reading is ready</p>
      <h1 className="text-3xl mb-4 leading-tight">Unlock it now</h1>
      <div className="divider" />
      <p className="text-dark/80 leading-relaxed mb-10 max-w-[480px] mx-auto">
        One pack, five readings to come back to for different situations,
        different layers, the same pattern seen from a new angle each time.
      </p>

      {error && <p className="text-terracotta text-sm mb-4">{error}</p>}

      <button
        type="button"
        onClick={handleBuy}
        disabled={loading}
        className="card text-center disabled:opacity-50 disabled:cursor-not-allowed max-w-xs mx-auto block w-full"
      >
        <p className="eyebrow text-lg mb-1">{PACK.label}</p>
        <p className="font-display text-4xl mb-4 text-dark">{formatEuros(PACK.priceCents)}</p>
        <p className="text-sm font-semibold text-brown">
          {loading ? "Redirecting..." : "Unlock now"}
        </p>
      </button>
    </div>
  );
}
