// Lightweight Buffer polyfill for browsers / Cloudflare Workers (minimal functions used by this app).
// Import this first in your app entry (main.jsx) to ensure Buffer is available everywhere.

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = {
    from(input, enc) {
      // Buffer.from(base64, 'base64') -> return Uint8Array
      if (enc === 'base64') {
        const b64 = input.replace(/\s/g, '');
        const str = typeof atob === 'function' ? atob(b64) : BufferFallback_atob(b64);
        const u8 = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) u8[i] = str.charCodeAt(i);
        return u8;
      }
      // Buffer.from(string) -> Uint8Array UTF-8
      if (typeof input === 'string') {
        return new TextEncoder().encode(input);
      }
      // If already array-like, return as-is
      if (input instanceof Uint8Array) return input;
      return new Uint8Array(input || []);
    },
    // helper to convert Uint8Array -> string (Buffer(...).toString('utf8') pattern)
    toString(u8, enc) {
      if (!u8) return '';
      if (enc === 'base64') {
        let s = '';
        for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
        return typeof btoa === 'function' ? btoa(s) : BufferFallback_btoa(s);
      }
      return new TextDecoder('utf-8').decode(u8);
    }
  };
}
