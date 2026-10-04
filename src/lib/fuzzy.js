/**
 * Subsequence match of `q` in `s`. Consecutive hits and hits at word starts
 * score higher; shorter strings win ties. Returns null when `q` is not a
 * subsequence of `s`.
 */
export function fuzzy(q, s) {
  const ql = q.toLowerCase();
  const sl = s.toLowerCase();
  let qi = 0;
  let score = 0;
  let last = -2;
  const hits = [];
  for (let i = 0; i < sl.length && qi < ql.length; i++) {
    if (sl[i] === ql[qi]) {
      hits.push(i);
      score += 1;
      if (last === i - 1) score += 3;
      if (i === 0 || /[\s:/·._-]/.test(sl[i - 1])) score += 2;
      last = i;
      qi++;
    }
  }
  if (qi < ql.length) return null;
  return { score: score - sl.length * 0.02, hits };
}

export function commonPrefix(list) {
  if (!list.length) return '';
  let p = list[0];
  for (const s of list) {
    let i = 0;
    while (i < p.length && i < s.length && p[i] === s[i]) i++;
    p = p.slice(0, i);
  }
  return p;
}
