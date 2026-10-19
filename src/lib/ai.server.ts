import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import type { z } from "zod";

// All prompts live here so they are easy to tune.
export const PROMPTS = {
  tutor:
    "You are a lesson tutor. Use ONLY the provided transcript excerpts. Never use outside knowledge. Cite timestamps as [mm:ss] using the excerpt start times. If the excerpts do not contain the answer, say so and set grounded=false. Keep answers short (2-5 sentences).",
};

const MODEL = "openai/gpt-6-astra";

function provider() {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");
  let runId: string | undefined;
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      return res;
    },
  });
}

/** Structured call validated by zod; retries once on invalid output. */
export async function structured<T>(schema: z.ZodType<T>, instructions: string, prompt: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = streamText({
        model: provider().responses(MODEL),
        instructions,
        prompt,
        output: Output.object({ schema }),
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const out = await result.output;
      return schema.parse(out);
    } catch (e) {
      lastErr = e;
      const status = (e as { statusCode?: number })?.statusCode;
      if (status && status !== 429 && status < 500) break;
    }
  }
  console.error("AI call failed", lastErr);
  throw new Error("The tutor is unavailable right now. Please try again in a moment.");
}
