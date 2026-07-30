export const requestBodyTemplate = `export class RequestTooLargeError extends Error {}

export async function readJsonBody(
  req: Request,
  maxBytes: number,
): Promise<unknown> {
  const contentLength = req.headers.get("content-length");
  if (contentLength !== null && Number(contentLength) > maxBytes) {
    throw new RequestTooLargeError();
  }

  req.signal.throwIfAborted();
  if (!req.body) throw new SyntaxError("Missing body");

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const abortRead = () => {
    void reader.cancel(req.signal.reason).catch(() => {});
  };
  req.signal.addEventListener("abort", abortRead, { once: true });

  try {
    while (true) {
      req.signal.throwIfAborted();
      const { done, value } = await reader.read();
      req.signal.throwIfAborted();
      if (done) break;

      size += value.byteLength;
      if (size > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // The request may have been aborted while the oversized body arrived.
        }
        throw new RequestTooLargeError();
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return JSON.parse(text);
  } finally {
    req.signal.removeEventListener("abort", abortRead);
    reader.releaseLock();
  }
}
`;
