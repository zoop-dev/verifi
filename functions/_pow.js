export async function verifyPow(challenge, nonce, difficulty) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${challenge}:${nonce}`));
    return new DataView(buf).getUint32(0, false) < Math.pow(2, 32 - difficulty);
  } catch { return false; }
}
