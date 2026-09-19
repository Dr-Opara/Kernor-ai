import { describe, expect, it, vi } from "vitest";

// Regression test for a real runtime bug found during local QA: the PDF
// branch of parseResume() used to embed the system instructions directly
// inside the `messages` array (`{ role: "system", ... }`), which the
// pinned `ai` SDK (v7) rejects outright with InvalidPromptError —
// "System messages are not allowed in the prompt or messages fields."
// PDF resume parsing was completely broken regardless of API key
// configuration. This asserts the call shape stays correct: system
// instructions passed via the top-level `system` parameter, never as a
// role:"system" entry inside `messages`/`prompt`.

const generateTextMock = vi.fn(async (_options: Record<string, unknown>) => ({
  output: { summary: "ok" },
}));

vi.mock("ai", () => ({
  generateText: (options: Record<string, unknown>) => generateTextMock(options),
  Output: {
    object: (config: unknown) => ({ __schemaConfig: config }),
  },
}));
vi.mock("@ai-sdk/openai", () => ({
  openai: (model: string) => ({ __model: model }),
}));

describe("parseResume (PDF branch)", () => {
  it("passes system instructions via the top-level `system` parameter, never inside messages/prompt", async () => {
    const { parseResume } = await import("@/lib/ai/resume");

    await parseResume({
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: "application/pdf",
      fileName: "resume.pdf",
    });

    expect(generateTextMock).toHaveBeenCalledTimes(1);
    const call = generateTextMock.mock.calls[0][0] as Record<string, unknown>;

    expect(typeof call.system).toBe("string");
    expect((call.system as string).length).toBeGreaterThan(0);

    // Neither `messages` nor `prompt` may contain a role:"system" entry —
    // that's exactly what the AI SDK's standardizePrompt() rejects.
    const candidateArrays = [call.messages, call.prompt].filter(Boolean) as Array<
      Array<{ role?: string }>
    >;
    for (const arr of candidateArrays) {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.some((message) => message.role === "system")).toBe(false);
    }

    // The file attachment itself must still be present somewhere in the
    // prompt/messages — this guards against a fix that accidentally drops
    // the resume content instead of just relocating the system prompt.
    const flattened = candidateArrays.flat();
    const hasFileContent = flattened.some((message) => {
      const content = (message as { content?: unknown }).content;
      return (
        Array.isArray(content) &&
        content.some((part: { type?: string }) => part?.type === "file")
      );
    });
    expect(hasFileContent).toBe(true);
  });
});
