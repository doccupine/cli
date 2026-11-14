import { stripTypeScriptTypes } from "node:module";
import { AIMessageChunk } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";
import { ragRoutesTemplate } from "../../app/api/rag/route.js";
import { llmStreamTemplate } from "./stream.js";

type StreamModule = {
  chunkText: (chunk: AIMessageChunk | undefined) => string;
};

// The generated module only imports types, so it runs once they are stripped.
async function loadStream(): Promise<StreamModule> {
  const js = stripTypeScriptTypes(llmStreamTemplate);
  return import(
    `data:text/javascript,${encodeURIComponent(js)}`
  ) as Promise<StreamModule>;
}

const chunk = (content: AIMessageChunk["content"]) =>
  new AIMessageChunk({ content });

// Content shapes taken from what @langchain/anthropic emits for each stream
// event, plus OpenAI-style reasoning blocks.
const thinkingStart = chunk([{ index: 0, type: "thinking", thinking: "" }]);
const thinkingDelta = chunk([
  { index: 0, type: "thinking", thinking: "Check the docs first." },
]);
const signatureOnly = chunk([
  { index: 0, type: "thinking", signature: "EqQBCkYIBxgCKkA" },
]);
const redactedThinking = chunk([
  { index: 0, type: "redacted_thinking", data: "EmwKAhgBEgy3va3" },
]);
const reasoning = chunk([{ type: "reasoning", reasoning: "Weighing options" }]);

describe("generated chat stream text", () => {
  it("passes plain string content through", async () => {
    const { chunkText } = await loadStream();
    expect(chunkText(chunk("Hello"))).toBe("Hello");
  });

  it("returns the text of text blocks", async () => {
    const { chunkText } = await loadStream();
    expect(chunkText(chunk([{ index: 1, type: "text", text: "Hello" }]))).toBe(
      "Hello",
    );
    expect(
      chunkText(
        chunk([
          { type: "text", text: "Hello, " },
          { type: "text", text: "world" },
        ]),
      ),
    ).toBe("Hello, world");
  });

  it.each([
    ["an empty thinking start", thinkingStart],
    ["a thinking delta", thinkingDelta],
    ["a signature-only delta", signatureOnly],
    ["redacted thinking", redactedThinking],
    ["a reasoning block", reasoning],
    ["empty string content", chunk("")],
    ["empty block content", chunk([])],
  ])("returns no text for %s", async (_label, value) => {
    const { chunkText } = await loadStream();
    expect(chunkText(value)).toBe("");
  });

  it("keeps only the text when a chunk mixes thinking and text", async () => {
    const { chunkText } = await loadStream();
    const mixed = chunk([
      { index: 0, type: "thinking", thinking: "Hidden reasoning" },
      { index: 1, type: "text", text: "Visible answer" },
    ]);
    expect(chunkText(mixed)).toBe("Visible answer");
  });

  it("returns no text for a missing chunk", async () => {
    const { chunkText } = await loadStream();
    expect(chunkText(undefined)).toBe("");
  });

  it("streams only answer text across a thinking-then-answer stream", async () => {
    const { chunkText } = await loadStream();
    const stream = [
      thinkingStart,
      thinkingDelta,
      signatureOnly,
      chunk([{ index: 1, type: "text", text: "" }]),
      chunk([{ index: 1, type: "text", text: "Install with " }]),
      chunk("npm"),
      chunk([{ index: 1, type: "text", text: "." }]),
    ];
    // Mirrors the route: empty strings are skipped, the rest is sent as-is.
    const sent = stream.map(chunkText).filter(Boolean);
    expect(sent).toEqual(["Install with ", "npm", "."]);
    expect(sent.every((value) => typeof value === "string")).toBe(true);
  });
});

describe("generated RAG route streaming", () => {
  it("sends each chunk's answer text, never its raw content", () => {
    expect(ragRoutesTemplate).toContain("const content = chunkText(chunk);");
    expect(ragRoutesTemplate).not.toMatch(/chunk\??\.content/);
    expect(ragRoutesTemplate).toContain(
      'JSON.stringify({ type: "content", data: content })',
    );
  });
});
