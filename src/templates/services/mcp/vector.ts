export const vectorHelpersTemplate = `/**
 * Shared vector helpers for the docs embedding index.
 *
 * Both the build-time indexer (scripts/build-docs-index.mts) and the runtime
 * search path (services/mcp/server.ts) import these so query vectors and stored
 * vectors get the EXACT same transform - any mismatch would silently corrupt
 * ranking. Vectors are Matryoshka-truncated to a smaller dimension and stored
 * as int8, which shrinks each vector ~40x (and the overall index ~20x once
 * chunk text is counted) versus raw JSON floats. Large doc sets used to produce
 * 100MB+ indexes that OOM'd or timed out serverless cold starts (the chat would
 * connect, then idle forever).
 */

/** L2-normalize a vector in place and return it. */
export function l2normalize(vector: number[]): number[] {
  let norm = 0;
  for (let i = 0; i < vector.length; i++) norm += vector[i] * vector[i];
  norm = Math.sqrt(norm);
  if (norm === 0) return vector;
  for (let i = 0; i < vector.length; i++) vector[i] = vector[i] / norm;
  return vector;
}

/**
 * Matryoshka dimension reduction: keep the first \`dims\` components and
 * renormalize. text-embedding-3-* and gemini-embedding-001 are MRL-trained, so
 * a renormalized prefix is a valid lower-dimension embedding. When \`dims\` is
 * <= 0 or >= the vector length, the vector is returned normalized at full
 * length. Operates on a copy so the caller's vector is left untouched.
 */
export function reduceDims(vector: number[], dims: number): number[] {
  const target = dims > 0 && dims < vector.length ? dims : vector.length;
  return l2normalize(vector.slice(0, target));
}

/**
 * Quantize a float vector to int8 using a per-vector max-abs scale. Cosine
 * similarity is scale-invariant, so the scale factor never has to be stored:
 * cosine(query, scale * q) === cosine(query, q). Callers score directly against
 * the int8 array via cosineFloatInt8, so there is no dequantization step.
 */
export function quantizeInt8(vector: number[]): Int8Array {
  let maxAbs = 0;
  for (let i = 0; i < vector.length; i++) {
    const a = Math.abs(vector[i]);
    if (a > maxAbs) maxAbs = a;
  }
  const scale = maxAbs > 0 ? 127 / maxAbs : 0;
  const q = new Int8Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    // Clamp before assignment: Int8Array wraps out-of-range values (200 -> -56)
    // instead of clamping, which would flip a component's sign.
    let s = Math.round(vector[i] * scale);
    if (s > 127) s = 127;
    else if (s < -127) s = -127;
    q[i] = s;
  }
  return q;
}

/** Encode an int8 vector as base64 for compact JSON storage. */
export function encodeInt8(q: Int8Array): string {
  return Buffer.from(q.buffer, q.byteOffset, q.byteLength).toString("base64");
}

/** Decode a base64 int8 vector produced by encodeInt8. */
export function decodeInt8(b64: string): Int8Array {
  const buf = Buffer.from(b64, "base64");
  return new Int8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

/**
 * Cosine similarity between a float query vector and an int8 stored vector.
 * Both must share the same length. The int8 scale cancels out in the
 * normalization, so scoring against the raw int8 array is exact up to the
 * quantization rounding error (negligible for top-K retrieval).
 */
export function cosineFloatInt8(query: number[], stored: Int8Array): number {
  const len = Math.min(query.length, stored.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    const x = query[i];
    const y = stored[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
`;
