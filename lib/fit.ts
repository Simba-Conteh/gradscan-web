import { GRADE_RANK, CV_KEYWORDS } from "./constants";
import type { Profile, Role } from "./types";

/** 1-5 fit score for a role against a profile. Mirrors the scoring in the
 *  original gradscan dashboard so both surfaces agree. */
export function fitScore(role: Role, profile: Profile): number {
  let s = 1;

  if (profile.sectors.length === 0) s += 1;
  else if (profile.sectors.includes(role.sector)) s += 2;

  const need = role.min_grade ? GRADE_RANK[role.min_grade] ?? 0 : 0;
  const have = GRADE_RANK[profile.grade] ?? 0;
  const gradeFail = need > 0 && have < need;
  if (!gradeFail) s += 1;

  const hay = [role.title, role.eligibility, role.notes, (role.tags ?? []).join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const hits = profile.skills.filter((k) => hay.includes(k.toLowerCase())).length;
  if (hits >= 4) s += 2;
  else if (hits >= 1) s += 1;

  if (gradeFail) s = Math.min(s, 2);
  return Math.max(1, Math.min(5, s));
}

/** Extract known skills from free text (CV paste + projects). */
export function extractSkills(text: string, existing: string[] = []): string[] {
  const found = new Set(existing);
  for (const k of CV_KEYWORDS) {
    const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^A-Za-z])${esc}([^A-Za-z]|$)`, "i").test(text)) found.add(k);
  }
  return [...found];
}

export function daysUntil(dateStr: string | null, from: Date): number | null {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr + "T00:00:00").getTime() - from.getTime()) / 86_400_000);
}
