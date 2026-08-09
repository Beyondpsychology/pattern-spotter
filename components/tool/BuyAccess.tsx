"use client";

import { useState } from "react";
import { CREDIT_PACKS, type CreditPack } from "@/lib/stripe";
import { trackInitiateCheckout } from "@/lib/metaPixel";

const BEST_VALUE_ID = "pack-5";

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
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(pack: CreditPack) {
    setError(null);
    setLoadingId(pack.id);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, packId: pack.id }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      if (!data.url) throw new Error();

      trackInitiateCheckout(pack);
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoadingId(null);
    }
  }

  return (
    <div className="text-center">
      <p className="eyebrow text-base mb-3">Your reading is ready</p>
      <h1 className="text-3xl mb-4 leading-tight">Unlock it now</h1>
      <div className="divider" />
      <p className="text-dark/80 leading-relaxed mb-10 max-w-[480px] mx-auto">
        Choose one reading now, or a pack to come back to for different
        situations, different layers, the same pattern seen from a new angle
        each time.
      </p>

      {error && <p className="text-terracotta text-sm mb-4">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto">
        {CREDIT_PACKS.map((pack) => {
          const isBestValue = pack.id === BEST_VALUE_ID;
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => handleBuy(pack)}
              disabled={loadingId !== null}
              className={`card text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                isBestValue ? "border-2 border-terracotta" : ""
              }`}
            >
              {isBestValue && <p className="eyebrow-chip mb-3">Best value</p>}
              <p className="text-xl mb-1">{pack.label}</p>
              <p className="text-3xl mb-4">{formatEuros(pack.priceCents)}</p>
              <p className="text-sm font-semibold text-brown">
                {loadingId === pack.id ? "Redirecting..." : "Get this pack"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
