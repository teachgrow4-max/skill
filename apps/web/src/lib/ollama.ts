import { publicEnv } from "@/lib/env.public";

const MODEL = "qwen3:4b";

export class OllamaUnavailableError extends Error {
  constructor() {
    super(
      "Couldn't reach Ollama. Install it from https://ollama.com, run `ollama pull qwen3:4b`, and make sure it's running.",
    );
    this.name = "OllamaUnavailableError";
  }
}

/**
 * Calls a locally-running Ollama instance directly from the browser. This
 * runs client-side (not as a server action) because Ollama lives on the
 * user's own machine — a hosted server (e.g. Vercel) has no route to it.
 * For a deployed site, the user's local Ollama needs
 * `OLLAMA_ORIGINS=<your-domain>` set so it accepts cross-origin requests.
 */
export async function generateWithOllama(prompt: string, system?: string): Promise<string> {
  const baseUrl = publicEnv.NEXT_PUBLIC_OLLAMA_URL ?? "http://localhost:11434";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        system,
        stream: false,
      }),
    });
  } catch {
    throw new OllamaUnavailableError();
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Model "${MODEL}" isn't installed. Run: ollama pull ${MODEL}`);
    }
    throw new Error(`Ollama request failed (${response.status}).`);
  }

  const data = await response.json();
  return (data.response as string)?.trim() ?? "";
}
