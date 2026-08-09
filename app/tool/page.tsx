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
import { trackPurchase } from "@/lib/metaPixel";

const VERIFY_PURCHASE_MAX_ATTEMPTS = 5;
const VERIFY_PURCHASE_DELAY_MS = 2000;

// Holds the answers + chosen hypothesis right before a /api/generate call
// that turned out to need payment, so that after a round trip through
// Stripe's hosted checkout (a full page navigation that wipes all React
// state) the reading can be generated straight away instead of sending
// someone all the way back to the 4 questions.
const PENDING_GENERATION_KEY = "pattern-spotter:pending-generation";

type PendingGeneration = { email: string; answers: Answers; belief: string };

function savePendingGeneration(email: string, answers: Answers, belief: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PENDING_GENERATION_KEY,
      JSON.stringify({ email, answers, belief })
    );
  } catch {
    // ignore storage errors (private browsing, quota, etc.)
  }
}

function loadPendingGeneration(): PendingGeneration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_GENERATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearPendingGeneration() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_GENERATION_KEY);
  } catch {
    // ignore storage errors (private browsing, quota, etc.)
  }
}

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
    const qpSessionId = searchParams.get("session_id") ?? "";
    const qpCredits = Number(searchParams.get("credits"));
    const qpAmount = Number(searchParams.get("amount"));

    if (checkout === "success" && qpEmail) {
      setEmail(qpEmail);
      setName(qpName);
      setStage("verifying-purchase");
      verifyPurchase(qpEmail, qpName, qpSessionId, qpCredits || 0, qpAmount || 0, 0);
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
  async function verifyPurchase(
    targetEmail: string,
    targetName: string,
    sessionId: string,
    packCredits: number,
    packAmountCents: number,
    attempt: number
  ) {
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
          if (sessionId && packCredits > 0) {
            trackPurchase(sessionId, { credits: packCredits, priceCents: packAmountCents });
          }

          // If they'd already answered the questions and picked a
          // hypothesis before hitting the paywall, finish generating the
          // reading right away instead of sending them all the way back.
          const pending = loadPendingGeneration();
          if (pending && pending.email === targetEmail) {
            setName(targetName);
            setAnswers(pending.answers);
            await generateReading(pending.answers, pending.belief, targetEmail, "questions");
          } else {
            setStage("questions");
          }
          return;
        }
      }
    } catch {
      // fall through to retry
    }

    if (attempt < VERIFY_PURCHASE_MAX_ATTEMPTS) {
      setTimeout(
        () =>
          verifyPurchase(targetEmail, targetName, sessionId, packCredits, packAmountCents, attempt + 1),
        VERIFY_PURCHASE_DELAY_MS
      );
    } else {
      // Payment likely went through but the webhook hasn't caught up yet -
      // send them to the buy screen rather than stall forever; credits will
      // be there the next time they re-enter their email regardless.
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
      setCredits(data.credits ?? 0);
      // No paywall here even at 0 credits - questions and hypothesis
      // selection are free; payment is only asked for right before the
      // reading itself is generated (see generateReading below).
      setStage("questions");
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

  // Shared by the normal hypothesis-select flow and by the post-payment
  // resume in verifyPurchase. onErrorStage controls where a failed attempt
  // lands: "hypotheses" (the list is already in state, normal flow) or
  // "questions" (post-payment resume, where the hypotheses list was lost to
  // the Stripe round trip and starting over is the only recoverable path).
  async function generateReading(
    targetAnswers: Answers,
    belief: string,
    targetEmail: string,
    onErrorStage: "hypotheses" | "questions" = "hypotheses"
  ) {
    setHypothesesError(null);
    setQuestionsError(null);
    setStage("loading-reading");

    if (paymentsEnabled) {
      savePendingGeneration(targetEmail, targetAnswers, belief);
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...targetAnswers, email: targetEmail, belief }),
      });

      if (res.status === 403 || res.status === 402) {
        const data = await res.json().catch(() => null);
        if (data?.reading) {
          clearDraftAnswers();
          clearPendingGeneration();
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
      clearPendingGeneration();
      if (typeof data.creditsRemaining === "number") setCredits(data.creditsRemaining);
      setReading(data);
      setStage("reading");
    } catch {
      if (onErrorStage === "questions") {
        setAnswers(targetAnswers);
        setQuestionsError("Something went wrong finishing your reading. Please try again.");
        setStage("questions");
      } else {
        setHypothesesError("Something went wrong. Please try again.");
        setStage("hypotheses");
      }
    }
  }

  async function handleHypothesisSelect(belief: string) {
    if (!answers) return;
    await generateReading(answers, belief, email);
  }

  if (stage === "reading" && reading) {
    return (
      <main className="px-6 py-10 md:px-16 md:py-16">
        <div className="max-w-[680px] mx-auto">
          <ReadingResult
            reading={reading}
            creditsRemaining={paymentsEnabled ? credits : null}
            email={email}
          />
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
