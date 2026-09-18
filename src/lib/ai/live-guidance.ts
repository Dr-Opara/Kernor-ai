import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { liveGuidanceSchema } from "./schemas";

const MODEL = process.env.KERNOR_LIVE_GUIDANCE_MODEL || process.env.KERNOR_MATCH_MODEL || "gpt-5.6-luna";

export async function generateLiveGuidance(input: {
  transcript: string;
  mode: "default" | "star" | "shorter" | "technical" | "follow_up" | "manual";
  context: unknown;
}) {
  const result = await generateText({
    model: openai(MODEL),
    output: Output.object({
      name: "KernorLiveGuidance",
      description: "Grounded, concise interview answer guidance.",
      schema: liveGuidanceSchema,
    }),
    system: `
You are a real-time interview support assistant for the candidate.

The candidate remains the speaker. You provide concise on-screen guidance only.

Rules:
- Use ONLY verified facts from the supplied context.
- Never invent experience, tools, dates, certifications, achievements, metrics, employers, education, or outcomes.
- If the transcript is not an interviewer question or a clear request for the candidate to respond, set isQuestion=false.
- If the question asks about something not supported by verified context, say so in caution and suggest an honest bridging answer.
- Do not pretend the candidate did something they did not do.
- Keep guidance natural enough to speak aloud, not essay-like.
- Respect the configured response style and length in context.
- mode=star: organize around Situation, Task, Action, Result only where verified evidence supports it.
- mode=shorter: shorten the answer substantially.
- mode=technical: emphasize technical detail that is actually supported.
- mode=follow_up: answer as a follow-up to the same question.
- Return verifiedEvidence as short reminders of the exact facts used.
`,
    prompt: `
LIVE TRANSCRIPT:
${input.transcript}

REQUESTED MODE:
${input.mode}

VERIFIED INTERVIEW CONTEXT:
${JSON.stringify(input.context)}
`,
    providerOptions: {
      openai: { store: false },
    },
  });

  return result.output;
}
