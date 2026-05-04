"use client";

import { useEffect, useRef, useState } from "react";
import { CuteButton } from "@/components/CuteButton";

type VoiceRecorderProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

export function VoiceRecorder({ onTranscript, disabled = false }: VoiceRecorderProps) {
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
    return <p className="text-xs font-medium text-[#8a6679]">Voice input is unavailable in this browser.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CuteButton type="button" variant={recording ? "danger" : "secondary"} onClick={recording ? stop : start} disabled={disabled}>
        {recording ? "Stop recording" : "Use voice"}
      </CuteButton>
      {message ? <p className="text-xs font-semibold text-[#8a6679]">{message}</p> : null}
    </div>
  );
}
