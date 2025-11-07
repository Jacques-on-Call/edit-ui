// Browser & Worker compatible minimal Buffer polyfill.
// Place at the very top of client entry (src/main.jsx) and at the top of worker entry (router.js) if worker code requires Buffer.

(function () {
  if (typeof globalThis.Buffer !== 'undefined') return;

  class BufferPoly {
    constructor(u8) {
      if (u8 instanceof Uint8Array) {
        this._u8 = u8;
      } else if (Array.isArray(u8)) {
        this._u8 = new Uint8Array(u8);
      } else {
        this._u8 = new Uint8Array(0);
      }
    }

    // length property
    get length() {
      return this._u8.length;
    }

    // slice returns a BufferPoly
    slice(start, end) {
      return new BufferPoly(this._u8.slice(start, end));
    }

    // toString supports 'utf8' (default) and 'base64'
    toString(enc = 'utf8') {
      if (enc === 'base64') {
        let s = '';
        for (let i = 0; i < this._u8.length; i++) s += String.fromCharCode(this._u8[i]);
        return typeof btoa === 'function' ? btoa(s) : '';
      }
      // utf8
      return new TextDecoder('utf-8').decode(this._u8);
    }

    // returns underlying Uint8Array (usable for byte-level ops)
    toUint8Array() {
      return this._u8;
    }

    // index access
    [Symbol.iterator]() {
      return this._u8[Symbol.iterator]();
    }
  }

  // static methods
  BufferPoly.from = function (input, enc) {
    if (enc === 'base64') {
      const b64 = String(input).replace(/\s/g, '');
      const bin = typeof atob === 'function' ? atob(b64) : '';
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return new BufferPoly(u8);
    }
    if (typeof input === 'string') {
      return new BufferPoly(new TextEncoder().encode(input));
    }
    if (input instanceof Uint8Array) return new BufferPoly(input);
    if (Array.isArray(input)) return new BufferPoly(new Uint8Array(input));
    return new BufferPoly(new Uint8Array(0));
  };

  BufferPoly.alloc = function (size, fill = 0) {
    const u8 = new Uint8Array(size);
    if (fill) u8.fill(fill);
    return new BufferPoly(u8);
  };

  BufferPoly.concat = function (list) {
    const total = list.reduce((sum, b) => sum + (b.length || 0), 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const b of list) {
      const u = (b instanceof BufferPoly) ? b._u8 : (b instanceof Uint8Array ? b : new Uint8Array(b));
      out.set(u, offset);
      offset += u.length;
    }
    return new BufferPoly(out);
  };

  BufferPoly.isBuffer = function (obj) {
    return obj instanceof BufferPoly;
  };

  // expose globally
  globalThis.Buffer = BufferPoly;
})();
