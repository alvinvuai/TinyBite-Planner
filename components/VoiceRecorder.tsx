"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CuteButton } from "@/components/CuteButton";

export type VoiceRecorderStatusState = "idle" | "listening" | "processing" | "completed" | "error" | "unavailable";

export type VoiceRecorderStatus = {
  state: VoiceRecorderStatusState;
  message: string;
};

type VoiceRecorderProps = {
  onTranscript: (text: string) => void;
  onStatusChange?: (status: VoiceRecorderStatus) => void;
  disabled?: boolean;
  floating?: boolean;
  variant?: "default" | "prompt";
};

type VoiceSupportMode = "checking" | "speech" | "recorder" | "none";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: {
      transcript: string;
    };
  }>;
};

function getSpeechRecognitionConstructor() {
  const browserWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
}

function describeMicrophoneError(error: unknown) {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Voice needs the secure https version of the app. Please open it from its https link.";
  }
  const name = (error as { name?: string } | null)?.name || "";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
    return "No microphone was found on this device. Typing works perfectly.";
  }
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
    return "Microphone is blocked for this site. Please allow the microphone in your browser's site settings, then try again.";
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return "The microphone is busy in another app. Please close it and try again.";
  }
  return "Microphone access was not available. Typing works perfectly.";
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function getPreferredAudioMimeType() {
  if (typeof MediaRecorder === "undefined" || !("isTypeSupported" in MediaRecorder)) return "";
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function extensionForMimeType(type: string) {
  if (type.includes("mp4")) return "m4a";
  if (type.includes("mpeg")) return "mp3";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  return "webm";
}

export function VoiceRecorder({ onTranscript, onStatusChange, disabled = false, floating = false, variant = "default" }: VoiceRecorderProps) {
  const [supportMode, setSupportMode] = useState<VoiceSupportMode>("checking");
  const [statusState, setStatusState] = useState<VoiceRecorderStatusState>("idle");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);

  const publishStatus = useCallback(
    (state: VoiceRecorderStatusState, nextMessage: string) => {
      setStatusState(state);
      setMessage(nextMessage);
      onStatusChange?.({ state, message: nextMessage });
    },
    [onStatusChange],
  );

  useEffect(() => {
    queueMicrotask(() => {
      const hasSpeechRecognition = Boolean(getSpeechRecognitionConstructor());
      const hasRecorder = "MediaRecorder" in window && Boolean(navigator.mediaDevices?.getUserMedia);
      // iOS browsers advertise SpeechRecognition but it is unreliable outside Safari; server transcription is dependable.
      const preferRecorder = isIosDevice() && hasRecorder;
      setSupportMode(preferRecorder ? "recorder" : hasSpeechRecognition ? "speech" : hasRecorder ? "recorder" : "none");
      if (!hasSpeechRecognition && !hasRecorder) {
        publishStatus(
          "unavailable",
          window.isSecureContext
            ? "Voice input is unavailable in this browser."
            : "Voice needs the secure https version of the app. Please open it from its https link.",
        );
      }
    });

    return () => {
      speechRef.current?.abort();
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [publishStatus]);

  useEffect(() => {
    if (statusState !== "completed") return;
    const timer = window.setTimeout(() => publishStatus("idle", ""), 2400);
    return () => window.clearTimeout(timer);
  }, [publishStatus, statusState]);

  async function start() {
    publishStatus("idle", "");
    if (supportMode === "speech") {
      startBrowserSpeechRecognition();
      return;
    }

    if (supportMode === "recorder") {
      await startMediaRecorder();
      return;
    }

    publishStatus("unavailable", "Voice input is unavailable in this browser.");
  }

  function startBrowserSpeechRecognition() {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setSupportMode("none");
      publishStatus("unavailable", "Voice input is unavailable in this browser.");
      return;
    }

    let transcript = "";
    let hadError = false;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-AU";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) transcript += ` ${result[0].transcript}`;
      }
    };
    recognition.onerror = (event) => {
      hadError = true;
      setRecording(false);
      setBusy(false);
      const blocked = event.error === "not-allowed" || event.error === "service-not-allowed";
      const canFallBackToRecorder = !blocked && "MediaRecorder" in window && Boolean(navigator.mediaDevices?.getUserMedia);
      if (canFallBackToRecorder) setSupportMode("recorder");
      publishStatus(
        "error",
        blocked
          ? "Microphone is blocked for this site. Please allow the microphone in your browser's site settings, then try again."
          : canFallBackToRecorder
            ? "Voice was not heard clearly. Tap the mic to try again."
            : "Voice was not heard clearly. Please try again.",
      );
    };
    recognition.onend = () => {
      speechRef.current = null;
      setRecording(false);
      setBusy(false);
      const text = transcript.trim();
      if (text) {
        onTranscript(text);
        publishStatus("completed", "Voice added.");
      } else if (!hadError) {
        publishStatus("error", "No speech was heard. Please try again or type it instead.");
      }
    };

    try {
      speechRef.current = recognition;
      recognition.start();
      setRecording(true);
      publishStatus("listening", "Listening...");
    } catch {
      speechRef.current = null;
      setRecording(false);
      publishStatus("error", "Voice could not start. Typing works perfectly.");
    }
  }

  async function startMediaRecorder() {
    try {
      const mimeType = getPreferredAudioMimeType();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      streamRef.current = stream;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setBusy(true);
        publishStatus("processing", "Listening back...");
        await transcribe(blob);
        setBusy(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      publishStatus("listening", "Listening...");
    } catch (error) {
      setRecording(false);
      setBusy(false);
      publishStatus("error", describeMicrophoneError(error));
    }
  }

  async function stop() {
    if (supportMode === "speech") {
      speechRef.current?.stop();
      setBusy(true);
      publishStatus("processing", "Finishing...");
      return;
    }

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setBusy(true);
      publishStatus("processing", "Listening back...");
    }
    setRecording(false);
  }

  async function transcribe(blob: Blob) {
    if (blob.size <= 0) {
      publishStatus("error", "No audio was captured. Please try again or type it instead.");
      return;
    }

    const form = new FormData();
    form.append("audio", blob, `tinybite-voice.${extensionForMimeType(blob.type)}`);
    try {
      const response = await fetch("/api/transcribe", { method: "POST", body: form });
      const responseText = await response.text();
      let data = {} as { text?: string; message?: string };
      try {
        data = responseText ? (JSON.parse(responseText) as { text?: string; message?: string }) : data;
      } catch {
        data = {};
      }
      if (!response.ok) throw new Error(data.message || "Transcription failed.");
      const text = data.text?.trim();
      if (!text) throw new Error("No words were detected. Please try again or type it instead.");
      onTranscript(text);
      publishStatus("completed", "Voice added.");
    } catch (error) {
      publishStatus("error", error instanceof Error ? error.message : "Voice could not be transcribed. You can type it instead.");
    }
  }

  const unavailable = supportMode === "none";
  const buttonDisabled = disabled || busy || supportMode === "checking" || unavailable;
  const buttonLabel = unavailable ? "Voice input unavailable" : recording ? "Stop voice recording" : "Use voice input";
  const active = statusState === "listening" || recording;
  const processing = statusState === "processing" || busy;
  const completed = statusState === "completed";
  const error = statusState === "error" || statusState === "unavailable";

  if (variant === "prompt") {
    return (
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={buttonDisabled}
        aria-label={buttonLabel}
        title={buttonLabel}
        className={`voice-prompt-button pressable ${active ? "voice-prompt-button-listening" : ""} ${processing ? "voice-prompt-button-processing" : ""} ${
          completed ? "voice-prompt-button-complete" : ""
        } ${error ? "voice-prompt-button-error" : ""}`}
      >
        <MicrophoneIcon active={active || processing} />
        <span aria-hidden="true" className="voice-prompt-bars">
          <span />
          <span />
          <span />
        </span>
      </button>
    );
  }

  return (
    <div className={floating ? "fixed left-4 top-4 z-40 flex items-center gap-2 sm:left-6 sm:top-5" : "flex flex-wrap items-center gap-2"}>
      {floating ? (
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={buttonDisabled}
          aria-label={buttonLabel}
          title={buttonLabel}
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
          disabled={buttonDisabled}
          aria-label={buttonLabel}
          title={buttonLabel}
          className="flex h-12 w-12 items-center justify-center p-0"
        >
          <MicrophoneIcon active={recording} />
        </CuteButton>
      )}
      {message || unavailable ? (
        <p className={floating ? "rounded-full bg-white/90 px-3 py-2 text-xs font-black text-[#5e3752] shadow-sm" : "text-xs font-semibold text-[#8a6679]"}>
          {message || "Voice input is unavailable in this browser."}
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
