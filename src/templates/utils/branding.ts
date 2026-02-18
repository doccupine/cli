export const brandingTemplate = `import { verify, createPublicKey } from "crypto";

const PUBLIC_KEY = \`-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAfRfGHxhXRFCOXxaC5IUcmi7KpsT/aFW869UJAm+xcso=
-----END PUBLIC KEY-----\`;

export function verifyBrandingKey(): boolean {
  const key = process.env.DOCCUPINE_KEY;
  if (!key) return false;
  try {
    const publicKey = createPublicKey(PUBLIC_KEY);
    return verify(
      null,
      Buffer.from("doccupine-premium"),
      publicKey,
      Buffer.from(key, "hex"),
    );
  } catch {
    return false;
  }
}
`;
