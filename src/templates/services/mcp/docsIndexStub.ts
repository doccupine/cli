// Placeholder embeddings index. Populated at build time by
// scripts/build-docs-index.mts; the stub keeps the path present for dev and
// for outputFileTracingIncludes. Empty chunks -> the app embeds at runtime.
export const docsIndexStubTemplate = `{
  "provider": null,
  "embeddingModel": null,
  "dims": 0,
  "quantization": "none",
  "chunks": []
}
`;
