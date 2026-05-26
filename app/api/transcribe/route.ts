import { NextResponse } from "next/server";
import { toFile } from "openai";
import { getOpenAiClient, getTranscribeModel, hasOpenAiKey } from "@/lib/openai";

export const runtime = "nodejs";

const maxAudioBytes = 15 * 1024 * 1024;

export async function POST(request: Request) {
  if (!hasOpenAiKey()) {
    return NextResponse.json({ error: "OPENAI_NOT_CONFIGURED", message: "Voice transcription needs OPENAI_API_KEY." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Voice recording data was missing. Please try again." }, { status: 400 });
  }

  const audio = form.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "NO_AUDIO", message: "Please attach an audio recording." }, { status: 400 });
  }

  if (audio.size <= 0) {
    return NextResponse.json({ error: "EMPTY_AUDIO", message: "No audio was captured. Please try again." }, { status: 400 });
  }

  if (audio.size > maxAudioBytes) {
    return NextResponse.json({ error: "AUDIO_TOO_LARGE", message: "Voice recording is too long. Please keep it short and try again." }, { status: 413 });
  }

  const bytes = Buffer.from(await audio.arrayBuffer());
  const type = audio.type || "audio/webm";
  const file = await toFile(bytes, `tinybite-voice.${extensionForMimeType(type)}`, { type });

  try {
    const transcription = await getOpenAiClient().audio.transcriptions.create({
      file,
      model: getTranscribeModel(),
    });

    return NextResponse.json({ text: transcription.text || "" });
  } catch (error) {
    console.warn("Voice transcription failed.", error);
    const openAiError = getOpenAiErrorDetails(error);
    return NextResponse.json(
      {
        error: openAiError.code || "TRANSCRIPTION_FAILED",
        message: openAiError.message,
      },
      { status: openAiError.status },
    );
  }
}

function extensionForMimeType(type: string) {
  if (type.includes("mp4")) return "m4a";
  if (type.includes("mpeg")) return "mp3";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  return "webm";
}

function getOpenAiErrorDetails(error: unknown) {
  const details = error as { status?: number; code?: string; type?: string; message?: string } | null;
  const status = details?.status && details.status >= 400 ? details.status : 502;
  const code = details?.code || details?.type || "";

  if (status === 401) {
    return {
      status,
      code: code || "OPENAI_AUTH_FAILED",
      message: "OpenAI could not authenticate this API key. Please check the key in local and Vercel settings.",
    };
  }

  if (status === 429 && code === "insufficient_quota") {
    return {
      status,
      code,
      message: "OpenAI says this project has exceeded its quota. Please check OpenAI billing, credits, and project limits.",
    };
  }

  if (status === 429) {
    return {
      status,
      code: code || "OPENAI_RATE_LIMITED",
      message: "OpenAI is rate-limiting voice transcription. Please wait a little and try again.",
    };
  }

  if (status === 400 && code === "model_not_found") {
    return {
      status,
      code,
      message: "The configured transcription model is not available for this OpenAI project. Please check OPENAI_TRANSCRIBE_MODEL.",
    };
  }

  return {
    status,
    code: code || "TRANSCRIPTION_FAILED",
    message: "Voice could not be transcribed. Please try again or type it instead.",
  };
}
