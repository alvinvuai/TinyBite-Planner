"use client";

import { useEffect, useRef, useState } from "react";
import { CuteButton } from "@/components/CuteButton";

type VoiceRecorderProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  floating?: boolean;
};

export function VoiceRecorder({ onTranscript, disabled = false, floating = false }: VoiceRecorderProps) {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setSupported("MediaRecorder" in window && Boolean(navigator.mediaDevices));
    });
  }, []);

  async function start() {
    setMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        await transcribe(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setMessage("Microphone access was not available. Typing works perfectly.");
    }
  }

  async function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribe(blob: Blob) {
    setMessage("Listening back...");
    const form = new FormData();
    form.append("audio", blob, "tinybite-voice.webm");
    try {
      const response = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!response.ok) throw new Error("Transcription failed");
      const data = (await response.json()) as { text: string };
      onTranscript(data.text);
      setMessage("Voice added.");
    } catch {
      setMessage("Voice could not be transcribed. You can type it instead.");
    }
  }

  if (!supported) {
    return floating ? null : <p className="text-xs font-medium text-[#8a6679]">Voice input is unavailable in this browser.</p>;
  }

  return (
    <div className={floating ? "fixed left-4 top-4 z-40 flex items-center gap-2 sm:left-6 sm:top-5" : "flex flex-wrap items-center gap-2"}>
      {floating ? (
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={disabled}
          aria-label={recording ? "Stop voice recording" : "Use voice input"}
          title={recording ? "Stop recording" : "Use voice"}
          className={`pressable grid h-12 w-12 place-items-center rounded-full border shadow-[0_10px_24px_rgba(126,70,101,0.12)] ${
            recording ? "border-[#efd09a] bg-[#fff0d0]" : "border-[#e7ccd9] bg-[#fffafd]"
          } disabled:cursor-not-allowed disabled:border-[#d9c2cf] disabled:bg-[#eadce5]`}
        >
          <MicrophoneIcon active={recording} />
        </button>
      ) : (
        <CuteButton
          type="button"
          variant={recording ? "danger" : "secondary"}
          onClick={recording ? stop : start}
          disabled={disabled}
          aria-label={recording ? "Stop voice recording" : "Use voice input"}
          title={recording ? "Stop recording" : "Use voice"}
          className="flex h-12 w-12 items-center justify-center p-0"
        >
          <MicrophoneIcon active={recording} />
        </CuteButton>
      )}
      {message ? (
        <p className={floating ? "rounded-full bg-white/90 px-3 py-2 text-xs font-black text-[#5e3752] shadow-sm" : "text-xs font-semibold text-[#8a6679]"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

function MicrophoneIcon({ active }: { active: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="block h-7 w-7" fill="none">
      <path
        d="M12 14.5a3.25 3.25 0 0 0 3.25-3.25v-4.5a3.25 3.25 0 0 0-6.5 0v4.5A3.25 3.25 0 0 0 12 14.5Z"
        stroke={active ? "#7a4a20" : "#734761"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.5 10.5a5.5 5.5 0 0 0 11 0M12 16v3.25M9 19.25h6" stroke={active ? "#7a4a20" : "#734761"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
