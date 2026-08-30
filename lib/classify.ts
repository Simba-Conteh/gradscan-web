import type { Role } from "./types";

/** Role families - what graduates actually filter by, independent of sector.
 *  Heuristic keyword classification over title + tags, ordered most-specific
 *  first, so newly scanned roles categorise themselves. */
export const FAMILIES = [
  "Software Engineering",
  "Data & AI",
  "Cyber & Security",
  "Testing & QA",
  "Tech Consulting",
  "Product & Digital",
  "Technology (multi-track)",
] as const;

export type Family = (typeof FAMILIES)[number];

export function classifyRole(role: Role): Family {
  const hay = (role.title + " " + (role.tags ?? []).join(" ")).toLowerCase();
  if (/cyber|security/.test(hay)) return "Cyber & Security";
  if (/\bdata\b|analytics|\bai\b|machine learning|\bml\b/.test(hay)) return "Data & AI";
  if (/\btest|sdet|\bqa\b/.test(hay)) return "Testing & QA";
  if (/software|developer|\.net|full.?stack|frontend|backend|\bswe\b|web dev/.test(hay))
    return "Software Engineering";
  if (/consult/.test(hay)) return "Tech Consulting";
  if (/digital|product|fast stream/.test(hay)) return "Product & Digital";
  if (/engineer/.test(hay)) return "Software Engineering";
  return "Technology (multi-track)";
}
