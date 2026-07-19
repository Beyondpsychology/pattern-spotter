"use client";

import { useEffect, useRef, useState } from "react";

export function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export default function VoiceInputButton({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef("");
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    const existing = valueRef.current.trim();
    baseTextRef.current = existing ? existing + " " : "";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        baseTextRef.current = baseTextRef.current + final.trim() + " ";
      }
      onChange(baseTextRef.current + interim);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (listening ? stopListening() : startListening())}
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1 transition flex-shrink-0 ${
        listening ? "bg-terracotta text-white" : "bg-mint/50 text-brown hover:bg-mint/80"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${listening ? "bg-white animate-pulse" : "bg-brown"}`}
      />
      {listening ? "Listening..." : "Speak instead"}
    </button>
  );
}
