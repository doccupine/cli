export const llmStreamTemplate = `import type { AIMessageChunk } from "@langchain/core/messages";

/**
 * The answer text in a streamed chat chunk. A chunk's content can also hold
 * reasoning, thinking signature, or tool blocks, which must never reach the
 * reader, so only text blocks are kept.
 */
export function chunkText(chunk: AIMessageChunk | undefined): string {
  return chunk?.text ?? "";
}
`;
