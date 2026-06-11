/* core/caesar — transporte contraseña (langlab). */
(function () {
  "use strict";
  const PREFIX = "abc123";
  const SUFFIX = "xyz987";
  function shiftChar(c: string, delta: number): string {
    const code = c.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + delta + 26) % 26) + 65);
    if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + delta + 26) % 26) + 97);
    return c;
  }
  function caesarEncode(plain: string, shift: number): string {
    return [...plain].map((c) => shiftChar(c, shift)).join("");
  }
  function wrapPassword(plain: string): string {
    return caesarEncode(PREFIX + plain + SUFFIX, new Date().getUTCDate());
  }
  const w = window as any;
  w.ISAJ = w.ISAJ || {};
  w.ISAJ.Caesar = { wrapPassword };
})();
