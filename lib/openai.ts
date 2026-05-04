import OpenAI from "openai";

let client: OpenAI | null = null;

export function hasOpenAiKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAiClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return client;
}

export function getMealModel() {
  return process.env.OPENAI_MEAL_MODEL || "gpt-5.4-mini";
}

export function getTranscribeModel() {
  return process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe";
}
