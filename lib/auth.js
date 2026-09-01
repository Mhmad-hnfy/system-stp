const SECRET = process.env.AUTH_SECRET || "center_super_secret_2026";

export async function signCookieValue(value) {
  const encoder = new TextEncoder();
  const keyBuf = encoder.encode(SECRET);
  const dataBuf = encoder.encode(value);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBuf, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${value}.${hex}`;
}

export async function verifyCookieValue(cookieValue) {
  try {
    if (!cookieValue || typeof cookieValue !== "string" || !cookieValue.includes(".")) return null;
    const dotIndex = cookieValue.indexOf(".");
    const value = cookieValue.substring(0, dotIndex);
    const expected = await signCookieValue(value);
    return cookieValue === expected ? value : null;
  } catch (e) {
    return null;
  }
}
