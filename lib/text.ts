function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

/**
 * Non-authoritative hint for a human reviewer — never used to auto-accept/reject a claim.
 * 'close' is a token-overlap heuristic, not a guarantee of correctness.
 */
export function answerMatchLevel(reference: string, candidate: string): "exact" | "close" | "different" {
  const a = normalize(reference);
  const b = normalize(candidate);
  if (!a || !b) return "different";
  if (a === b) return "exact";

  const aTokens = new Set(a.split(" ").filter((t) => t.length > 2));
  const bTokens = new Set(b.split(" ").filter((t) => t.length > 2));
  if (aTokens.size === 0 || bTokens.size === 0) {
    return a.includes(b) || b.includes(a) ? "close" : "different";
  }

  const overlap = [...aTokens].filter((t) => bTokens.has(t)).length;
  const ratio = overlap / Math.max(aTokens.size, bTokens.size);
  return ratio >= 0.6 ? "close" : "different";
}
