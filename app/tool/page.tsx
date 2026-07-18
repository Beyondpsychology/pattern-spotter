"use client";

import { useState } from "react";
import type { Answers, ReadingResultData, Stage } from "@/lib/toolTypes";
import EmailGate from "@/components/tool/EmailGate";
import AlreadyUsed from "@/components/tool/AlreadyUsed";
import QuestionForm from "@/components/tool/QuestionForm";
import HypothesisSelection from "@/components/tool/HypothesisSelection";
import ReadingResult from "@/components/tool/ReadingResult";
import { SkeletonHypotheses, SpinnerWritingReading } from "@/components/tool/Loading";

export default function ToolPage() {
  const [stage, setStage] = useState<Stage>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [hypotheses, setHypotheses] = useState<string[]>([]);
  const [reading, setReading] = useState<ReadingResultData | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [hypothesesError, setHypothesesError] = useState<string | null>(null);

  async function handleEmailSubmit(submittedName: string, submittedEmail: string) {
    const res = await fetch("/api/email-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: submittedName, email: submittedEmail }),
    });

    if (!res.ok) {
      throw new Error("Something went wrong. Please try again.");
    }

    const data = await res.json();
    setName(submittedName);
    setEmail(submittedEmail);

    if (data.status === "already_completed") {
      setStage("already-used");
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

      if (res.status === 403) {
        setStage("already-used");
        return;
      }

      if (!res.ok) throw new Error();

      const data = await res.json();
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
          <ReadingResult reading={reading} />
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 md:px-16 md:py-16">
      <div className="max-w-[680px] mx-auto">
        <div className="bg-white rounded-card shadow-card p-8 md:p-14">
          {stage === "email" && <EmailGate onSubmit={handleEmailSubmit} />}

          {stage === "already-used" && <AlreadyUsed />}

          {stage === "questions" && (
            <>
              {questionsError && (
                <p className="text-terracotta text-sm mb-4 text-center">{questionsError}</p>
              )}
              <QuestionForm initialAnswers={answers ?? undefined} onSubmit={handleQuestionsSubmit} />
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
