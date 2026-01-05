export function md5(str: string) {
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }
  function md5blk(s: string) {
    const blocks: number[] = [];
    for (let i = 0; i < 64; i += 4) {
      blocks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return blocks;
  }
  function md51(s: string) {
    const n = s.length;
    let state = [1732584193, -271733879, -1732584194, 271733878];
    let i: number;
    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    const tail = new Array(16).fill(0) as number[];
    for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[s.length >> 2] |= 0x80 << ((s.length % 4) << 3);
    if (s.length > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  function rhex(n: number) {
    const s = "0123456789abcdef";
    let j = 0;
    let out = "";
    for (; j < 4; j++) out += s[(n >> (j * 8 + 4)) & 0x0f] + s[(n >> (j * 8)) & 0x0f];
    return out;
  }
  function hex(x: number[]) {
    for (let i = 0; i < x.length; i++) x[i] = (x[i] + 0x100000000) % 0x100000000;
    return x.map(rhex).join("");
  }
  function add32(a: number, b: number) { return (a + b) & 0xffffffff; }
  return hex(md51(str));
}

export function cacheKey(prefix: string, payload: unknown) {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
  const hash = md5(raw);
  return `${prefix}-${hash}`;
}

export async function fetchPublic<T>(prefix: string, payload: unknown): Promise<T | null> {
  try {
    const name = cacheKey(prefix, payload);
    const res = await fetch(`/data/${name}.json`, { cache: "no-cache" });
    if (res.ok) return await res.json();
    return null;
  } catch {
    return null;
  }
}

export async function fetchPublicOrApi<T>(prefix: string, payload: unknown, apiUrl: string): Promise<T> {
  const hit = await fetchPublic<T>(prefix, payload);
  if (hit != null) return hit as T;
  try {
    const g = (globalThis as any);
    if (!g.__ALL_BUNDLE__) {
      const r0 = await fetch("/api/bundle/all", { cache: "no-cache" });
      if (!r0.ok) throw new Error("bundle_fetch_failed")
      g.__ALL_BUNDLE__ = await r0.json();
    }
    const all = g.__ALL_BUNDLE__;
    if (all) {
      const num = (v: unknown) => typeof v === "number" ? v : Number(v);
      if (prefix === "public-ekidens") return (all?.ekidens || []) as T;
      if (prefix === "public-editions") {
        const ekidenId = num(payload);
        return ((all?.editions || []).filter((x: any) => Number(x?.ekidenId) === ekidenId)) as T;
      }
      if (prefix === "public-intervals") {
        const ekidenId = num(payload);
        return ((all?.intervals || []).filter((x: any) => Number(x?.ekidenId) === ekidenId)) as T;
      }
      if (prefix === "public-th-intervals") {
        const thId = num(payload);
        return ((all?.thIntervals || []).filter((x: any) => Number(x?.Ekiden_thId) === thId)) as T;
      }
      if (prefix === "public-schools") return (all?.schools || []) as T;
      if (prefix === "public-teams") {
        const thId = num(payload);
        return ((all?.teams || []).filter((x: any) => Number(x?.Ekiden_thId) === thId)) as T;
      }
      if (prefix === "public-team-members") {
        const teamId = num(payload);
        return ((all?.members || []).filter((x: any) => Number(x?.ekiden_no_teamId) === teamId)) as T;
      }
      if (prefix === "public-students") {
        if (payload === "all") return (all?.students || []) as T;
        const schoolId = num(payload);
        if (Number.isFinite(schoolId)) {
          return ((all?.students || []).filter((x: any) => Number(x?.schoolId) === schoolId)) as T;
        }
        return (all?.students || []) as T;
      }
      if (prefix === "public-student-entries") {
        const ids = Array.isArray(payload) ? payload.map(num).filter((n) => Number.isFinite(n)) : [];
        return ((all?.results || []).filter((x: any) => ids.includes(Number(x?.studentId)))) as T;
      }
    }
  } catch { }
  const res = await fetch(apiUrl, { cache: "no-cache" });
  if (res.ok) return await res.json();
  return ([] as unknown) as T;
}

