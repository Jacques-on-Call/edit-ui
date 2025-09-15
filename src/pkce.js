// Generates a high-entropy random string for the code verifier.
export function generateCodeVerifier() {
  const randomBytes = new Uint8Array(32); // 32 bytes = 256 bits
  window.crypto.getRandomValues(randomBytes);
  return base64urlEncode(randomBytes);
}

// Hashes the verifier using SHA-256 and returns the Base64URL-encoded challenge.
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(new Uint8Array(hashBuffer));
}

// Helper to Base64URL-encode a Uint8Array, making it safe for URLs.
function base64urlEncode(bytes) {
  return btoa(String.fromCharCode.apply(null, bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
