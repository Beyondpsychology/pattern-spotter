"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ReviewPageInner() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating < 1) {
      setError("Please choose a star rating before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/review-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, rating, reviewText }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="px-6 py-10 md:px-16 md:py-16">
        <div className="max-w-[560px] mx-auto">
          <div className="bg-white rounded-card shadow-card p-8 md:p-14 text-center">
            <p className="eyebrow text-base mb-3">Thank you</p>
            <h1 className="text-3xl mb-4 leading-tight">Your review means a lot</h1>
            <div className="divider" />
            <p className="text-dark/80 leading-relaxed">
              Thank you for taking the time to share this — it genuinely helps
              other people decide if the Pattern Spotter is right for them.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 md:px-16 md:py-16">
      <div className="max-w-[560px] mx-auto">
        <div className="bg-white rounded-card shadow-card p-8 md:p-14">
          <div className="text-center">
            <p className="eyebrow text-base mb-3">Share your experience</p>
            <h1 className="text-3xl mb-4 leading-tight">
              How was your Pattern Spotter reading?
            </h1>
            <div className="divider" />
            <p className="text-dark/80 leading-relaxed mb-10 max-w-[480px] mx-auto">
              Your review might be featured on the Pattern Spotter page to help
              others decide if it&apos;s for them.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto text-left">
            <label className="field-label">Rating</label>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  className={`text-3xl leading-none transition ${
                    star <= rating ? "text-terracotta" : "text-dark/20"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <label className="field-label" htmlFor="review-name">
              Your name (optional)
            </label>
            <input
              id="review-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jamie"
              className="field-textarea mb-4"
            />

            <label className="field-label" htmlFor="review-email">
              Your email
            </label>
            <input
              id="review-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="field-textarea mb-4"
            />

            <label className="field-label" htmlFor="review-text">
              Your review
            </label>
            <textarea
              id="review-text"
              required
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did the reading help you see?"
              rows={5}
              className="field-textarea mb-6"
            />

            {error && <p className="text-terracotta text-sm mb-4">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Submitting..." : "Submit review"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <ReviewPageInner />
    </Suspense>
  );
}
