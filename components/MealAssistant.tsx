"use client";

import { useEffect, useState, type FormEvent } from "react";
import { VoiceRecorder, type VoiceRecorderStatus } from "@/components/VoiceRecorder";

export type ParsedMealItem = {
  ingredientKey?: string | null;
  customName?: string | null;
  customCalories?: number | null;
  amount?: number | null;
  unit?: string | null;
};

export type ParsedMealResult = {
  status: "filled" | "question";
  question?: string | null;
  mealType?: string | null;
  date?: string | null;
  completionPercent?: number | null;
  items?: ParsedMealItem[] | null;
  summary?: string | null;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

type MealAssistantProps = {
  mealType: string;
  currentItems: Array<{ ingredientKey: string; name: string; amount: number; unit: string }>;
  disabled?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onApply: (parsed: ParsedMealResult) => void;
  onFallback: (text: string) => boolean;
};

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MealAssistant({ mealType, currentItems, disabled = false, value, onChangeText, onApply, onFallback }: MealAssistantProps) {
  const [voiceStatus, setVoiceStatus] = useState<VoiceRecorderStatus>({ state: "idle", message: "" });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"complete" | "error" | "">("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => {
      setNotice("");
      setNoticeTone("");
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function resetConversation() {
    setMessages([]);
    setQuestion("");
  }

  function applyKeywordFallback(text: string, message: string) {
    const applied = onFallback(text);
    resetConversation();
    if (applied) {
      onChangeText("");
      setNotice("Added to planner without AI.");
      setNoticeTone("complete");
    } else {
      setNotice(message);
      setNoticeTone("error");
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy || disabled) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setBusy(true);
    setNotice("");
    setNoticeTone("");

    try {
      const response = await fetch("/api/parse-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          today: localDateString(),
          mealType,
          currentItems,
          messages: nextMessages,
        }),
      });
      const responseText = await response.text();
      let data = {} as Partial<ParsedMealResult> & { message?: string };
      try {
        data = responseText ? (JSON.parse(responseText) as Partial<ParsedMealResult> & { message?: string }) : data;
      } catch {
        data = {};
      }

      if (!response.ok) {
        applyKeywordFallback(trimmed, data.message || "The AI helper is unavailable right now. Try rice, egg, yoghurt, or banana.");
        return;
      }

      if (data.status === "question" && data.question) {
        setMessages([...nextMessages, { role: "assistant", content: data.question }]);
        setQuestion(data.question);
        onChangeText("");
        return;
      }

      onApply({ ...data, status: "filled" });
      resetConversation();
      onChangeText("");
      setNotice(data.summary || "Meal filled in.");
      setNoticeTone("complete");
    } catch {
      applyKeywordFallback(trimmed, "Could not reach the AI helper. Try rice, egg, yoghurt, or banana.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(value);
  }

  function handleTranscript(transcript: string) {
    const combined = [value, transcript].filter(Boolean).join(" ").trim();
    onChangeText(combined);
    void send(combined);
  }

  const listening = voiceStatus.state === "listening";
  const statusMessage = busy ? "" : voiceStatus.message || notice;

  return (
    <form onSubmit={submit} className="chat-prompt-shell" aria-label="Describe the meal with text or voice">
      {question ? (
        <div className="mb-2 flex items-start justify-between gap-2 rounded-[8px] border border-[#f0cddd] bg-[#fff8fb] px-4 py-3 shadow-sm">
          <p className="text-sm font-bold leading-6 text-[#7d3157]">
            <span aria-hidden="true" className="mr-1">
              💬
            </span>
            {question}
          </p>
          <button
            type="button"
            onClick={resetConversation}
            aria-label="Dismiss question"
            className="pressable grid h-7 w-7 flex-none place-items-center rounded-full bg-white/80 text-xs font-black text-[#9c456c]"
          >
            x
          </button>
        </div>
      ) : null}
      <div className={`chat-prompt-box ${listening ? "chat-prompt-box-listening" : noticeTone === "complete" ? "chat-prompt-box-complete" : ""}`}>
        <input
          type="text"
          value={value}
          onChange={(event) => {
            onChangeText(event.currentTarget.value);
            setNotice("");
          }}
          placeholder={question ? "Answer here, or tap the mic to reply" : "Describe the meal: she had an egg and rice for breakfast, ate 80%"}
          aria-label="Meal description"
          disabled={busy}
          className="chat-prompt-input"
        />
        <div className="chat-prompt-actions">
          <VoiceRecorder onTranscript={handleTranscript} onStatusChange={setVoiceStatus} disabled={disabled || busy} variant="prompt" />
          <button
            type="submit"
            aria-label="Send meal description"
            title="Send meal description"
            disabled={!value.trim() || busy}
            className="chat-send-button pressable"
          >
            <SendIcon />
          </button>
        </div>
      </div>
      {busy ? (
        <div className="chat-prompt-status chat-prompt-status-listening">
          <span className="voice-status-dot" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          Filling in the meal...
        </div>
      ) : statusMessage ? (
        <div
          className={`chat-prompt-status ${
            listening
              ? "chat-prompt-status-listening"
              : voiceStatus.state === "error" || voiceStatus.state === "unavailable" || noticeTone === "error"
                ? "chat-prompt-status-error"
                : voiceStatus.state === "completed" || noticeTone === "complete"
                  ? "chat-prompt-status-complete"
                  : ""
          }`}
        >
          {listening ? (
            <span className="voice-status-dot" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          ) : null}
          {statusMessage}
        </div>
      ) : null}
    </form>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M12 19V5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="m6.5 10.5 5.5-5.5 5.5 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
