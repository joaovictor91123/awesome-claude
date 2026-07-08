// Pure encoding/compare helpers for HMAC webhook signature verification, split
// out of the github webhook route so hex encoding and the constant-time string
// compare can be unit-tested.

/** Lowercase hex encoding of a byte buffer. */
export function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Length-checked, constant-time string equality. Returns false immediately for
 * differing lengths; otherwise compares every character with no early exit so
 * timing does not leak how many leading characters matched.
 */
export function timingSafeStringEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}
