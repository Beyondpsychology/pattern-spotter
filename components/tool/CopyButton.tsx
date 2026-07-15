"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-semibold bg-mint text-dark px-3 py-1.5 rounded-full hover:brightness-95 transition"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}
