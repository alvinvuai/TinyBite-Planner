import { NextResponse } from "next/server";
import { toFile } from "openai";
import { getOpenAiClient, getTranscribeModel, hasOpenAiKey } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasOpenAiKey()) {
    return NextResponse.json({ error: "OPENAI_NOT_CONFIGURED", message: "Voice transcription needs OPENAI_API_KEY." }, { status: 503 });
  }

  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "NO_AUDIO", message: "Please attach an audio recording." }, { status: 400 });
  }

  const bytes = Buffer.from(await audio.arrayBuffer());
  const file = await toFile(bytes, "tinybite-voice.webm", { type: audio.type || "audio/webm" });
  const transcription = await getOpenAiClient().audio.transcriptions.create({
    file,
    model: getTranscribeModel(),
  });

  return NextResponse.json({ text: transcription.text || "" });
}
