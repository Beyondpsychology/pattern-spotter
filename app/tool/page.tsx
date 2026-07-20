"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Answers, ReadingResultData, Stage } from "@/lib/toolTypes";
import EmailGate from "@/components/tool/EmailGate";
import AlreadyUsed from "@/components/tool/AlreadyUsed";
import BuyAccess from "@/components/tool/BuyAccess";
import QuestionForm, { clearDraftAnswers } from "@/components/tool/QuestionForm";
import HypothesisSelection from "@/components/tool/HypothesisSelection";
import ReadingResult from "@/components/tool/ReadingResult";
import {
  SkeletonHypotheses,
  SpinnerVerifyingPurchase,
  SpinnerWritingReading,
} from "@/components/tool/Loading";

const VERIFY_PURCHASE_MAX_ATTEMPTS = 5;
const VERIFY_PURCHASE_DELAY_MS = 2000;

function ToolPageInner() {
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [hypotheses, setHypotheses] = useState<string[]>([]);
  const [reading, setReading] = useState<ReadingResultData | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [hypothesesError, setHypothesesError] = useState<string | null>(null);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  // Lets a link like /tool?email=%EMAIL% (e.g. from the reading-delivery
  // email, so someone with credits left doesn't have to retype their
  // email) prefill the gate. Not used for checkout=success/cancelled
  // returns - those are handled entirely by the effect below.
  const prefillEmail = searchParams.get("checkout") ? "" : searchParams.get("email") ?? "";
  const prefillName = searchParams.get("checkout") ? "" : searchParams.get("name") ?? "";

  // A trip to Stripe's hosted checkout is a full page navigation away and
  // back, which wipes all React state — so the return trip has to be
  // reconstructed entirely from the URL (see success_url/cancel_url in
  // /api/create-checkout-session), never from anything held in memory.
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const qpEmail = searchParams.get("email");
    const qpName = searchParams.get("name") ?? "";

    if (checkout === "success" && qpEmail) {
      setEmail(qpEmail);
      setName(qpName);
      setStage("verifying-purchase");
      verifyPurchase(qpEmail, qpName, 0);
    } else if (checkout === "cancelled" && qpEmail) {
      setEmail(qpEmail);
      setName(qpName);
      setPaymentsEnabled(true);
      setStage("buy-access");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The Stripe webhook usually lands within a second or two of the redirect
  // back, but isn't guaranteed to have run yet, so poll briefly rather than
  // assuming it's instant.
  async function verifyPurchase(targetEmail: string, targetName: string, attempt: number) {
    try {
      const res = await fetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName, email: targetEmail }),
      });
      const data = await res.json().catch(() => null);

      if (data?.paymentsEnabled) {
        setPaymentsEnabled(true);
        const creditsNow = data.credits ?? 0;
        if (creditsNow > 0) {
          setCredits(creditsNow);
          setStage("questions");
          return;
        }
      }
    } catch {
      // fall through to retry
    }

    if (attempt < VERIFY_PURCHASE_MAX_ATTEMPTS) {
      setTimeout(
        () => verifyPurchase(targetEmail, targetName, attempt + 1),
        VERIFY_PURCHASE_DELAY_MS
      );
    } else {
      // Payment likely went through but the webhook hasn't caught up yet -
      // send them to the buy screen rather than stall forever; credits will
      // be there the next time they re-enter their email regardless.
      setStage("buy-access");
    }
  }

  // Skips the separate "buy" screen/click entirely when someone has no
  // credits right after submitting the email gate — straight to Stripe.
  // BuyAccess itself is kept as a fallback for the cases where an automatic
  // redirect isn't appropriate: they just cancelled and came back, checkout
  // session creation failed, or the post-purchase credit check timed out.
  async function redirectToCheckout(targetName: string, targetEmail: string) {
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName, email: targetEmail }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data.url) throw new Error();
      window.location.href = data.url;
    } catch {
      setStage("buy-access");
    }
  }

  async function handleEmailSubmit(submittedName: string, submittedEmail: string, code: string) {
    const res = await fetch("/api/email-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: submittedName, email: submittedEmail, code }),
    });

    if (!res.ok) {
      throw new Error("Something went wrong. Please try again.");
    }

    const data = await res.json();
    setName(submittedName);
    setEmail(submittedEmail);

    if (data.paymentsEnabled) {
      setPaymentsEnabled(true);
      const creditsNow = data.credits ?? 0;
      setCredits(creditsNow);
      if (creditsNow > 0) {
        setStage("questions");
      } else {
        await redirectToCheckout(submittedName, submittedEmail);
      }
      return;
    }

    setPaymentsEnabled(false);
    if (data.status === "already_completed") {
      if (data.reading) {
        clearDraftAnswers();
        setReading(data.reading);
        setStage("reading");
      } else {
        setStage("already-used");
      }
    } else {
      setStage("questions");
    }
  }

  async function handleQuestionsSubmit(submittedAnswers: Answers) {
    setAnswers(submittedAnswers);
    setQuestionsError(null);
    setStage("loading-hypotheses");

    try {
      const res = await fetch("/api/hypotheses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...submittedAnswers, email }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setHypotheses(data.hypotheses);
      setStage("hypotheses");
    } catch {
      setQuestionsError("Something went wrong. Please try again.");
      setStage("questions");
    }
  }

  async function handleHypothesisSelect(belief: string) {
    if (!answers) return;
    setHypothesesError(null);
    setStage("loading-reading");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, email, belief }),
      });

      if (res.status === 403 || res.status === 402) {
        const data = await res.json().catch(() => null);
        if (data?.reading) {
          clearDraftAnswers();
          if (typeof data.creditsRemaining === "number") setCredits(data.creditsRemaining);
          setReading(data.reading);
          setStage("reading");
        } else if (res.status === 402) {
          setStage("buy-access");
        } else {
          setStage("already-used");
        }
        return;
      }

      if (!res.ok) throw new Error();

      const data = await res.json();
      clearDraftAnswers();
      if (typeof data.creditsRemaining === "number") setCredits(data.creditsRemaining);
      setReading(data);
      setStage("reading");
    } catch {
      setHypothesesError("Something went wrong. Please try again.");
      setStage("hypotheses");
    }
  }

  if (stage === "reading" && reading) {
    return (
      <main className="px-6 py-10 md:px-16 md:py-16">
        <div className="max-w-[680px] mx-auto">
          <ReadingResult reading={reading} creditsRemaining={paymentsEnabled ? credits : null} />
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 md:px-16 md:py-16">
      <div className="max-w-[680px] mx-auto">
        <div className="bg-white rounded-card shadow-card p-8 md:p-14">
          {stage === "email" && (
            <EmailGate
              onSubmit={handleEmailSubmit}
              initialName={prefillName}
              initialEmail={prefillEmail}
            />
          )}

          {stage === "already-used" && <AlreadyUsed />}

          {stage === "buy-access" && <BuyAccess name={name} email={email} />}

          {stage === "verifying-purchase" && <SpinnerVerifyingPurchase />}

          {stage === "questions" && (
            <>
              {questionsError && (
                <p className="text-terracotta text-sm mb-4 text-center">{questionsError}</p>
              )}
              <QuestionForm
                initialAnswers={answers ?? undefined}
                onSubmit={handleQuestionsSubmit}
                creditsRemaining={paymentsEnabled ? credits : null}
              />
            </>
          )}

          {stage === "loading-hypotheses" && <SkeletonHypotheses />}

          {stage === "hypotheses" && (
            <>
              {hypothesesError && (
                <p className="text-terracotta text-sm mb-4 text-center">{hypothesesError}</p>
              )}
              <HypothesisSelection hypotheses={hypotheses} onSelect={handleHypothesisSelect} />
            </>
          )}

          {stage === "loading-reading" && <SpinnerWritingReading />}
        </div>
      </div>
    </main>
  );
}

export default function ToolPage() {
  return (
    <Suspense fallback={null}>
      <ToolPageInner />
    </Suspense>
  );
}
