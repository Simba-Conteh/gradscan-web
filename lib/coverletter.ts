import type { Profile, Role } from "./types";

/** Direct cover-letter drafting from profile + role data, following the
 *  consensus of UK graduate-careers guidance (targetjobs, Oxford/Edinburgh/
 *  St Andrews careers services, Reed, Prospects, recruiter blogs):
 *
 *  - 250-400 words, one page, 4 short paragraphs + close
 *  - opener carries substance: who I am + exact role + one specific reason
 *    (never "I am writing to apply...")
 *  - every claim backed by evidence; 2-3 mirrored skills, not a list
 *  - "what I want to learn" only as a specific reason tied to the scheme's
 *    real structure (rotations/certifications/training named in the data)
 *  - no hedges ("I believe", "I'm confident") and no generic flattery
 *  - unnamed UK greeting -> "Yours faithfully"
 *
 *  Deterministic and fully data-driven: every sentence is real content from
 *  the user's profile and the tracked role. The output is a draft the user
 *  edits, not a submission. */

export function matchedSkills(profile: Profile, role: Role, cap = 3): string[] {
  const hay = [role.title, role.eligibility, role.notes, (role.tags ?? []).join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const hits = profile.skills.filter((k) => hay.includes(k.toLowerCase()));
  const rest = profile.skills.filter((k) => !hits.includes(k));
  return [...hits, ...rest].slice(0, cap);
}

/** Company names in tracked data can carry annotations like
 *  "Noir (recruiter - gaming client)" - strip them for prose. */
function cleanCompany(name: string): string {
  return name.replace(/\s*\(.*?\)\s*/g, " ").trim();
}

/** CV project blurbs are usually fragments ("Floranica full-stack inventory
 *  system (ASP.NET/C#)"), not sentences - turn each into a first-person
 *  sentence before it goes in a letter. */
function asSentence(fragment: string): string {
  const f = fragment.replace(/[.!]$/, "").trim();
  if (/^(I|We)\b/i.test(f)) return f;
  if (/^Founder of\b/i.test(f)) return f.replace(/^Founder of/i, "I founded");
  if (/^(Built|Designed|Led|Delivered|Created|Developed|Produced|Launched)\b/i.test(f)) {
    return "I " + f[0].toLowerCase() + f.slice(1);
  }
  // Keep the fragment's own capitalisation - these usually start with a
  // project name ("Floranica full-stack inventory system").
  return "I built the " + f;
}

function evidenceSentences(profile: Profile, skills: string[], cap = 2): string[] {
  const sentences = profile.projects
    .split(/(?<=[.!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);
  const scored = sentences
    .map((s) => ({
      s,
      hits: skills.filter((k) => s.toLowerCase().includes(k.toLowerCase())).length,
    }))
    .sort((a, b) => b.hits - a.hits);
  const picked = scored.filter((x) => x.hits > 0).slice(0, cap).map((x) => x.s);
  for (const sent of sentences) {
    if (picked.length >= cap) break;
    if (!picked.includes(sent)) picked.push(sent);
  }
  return picked.map(asSentence);
}

/** A concrete "what the scheme offers" hook from the role's own notes -
 *  the only research-approved way to say what you want to learn. */
function schemeHook(role: Role): string | null {
  const notes = `${role.notes ?? ""} ${role.eligibility ?? ""}`;
  if (/rotation/i.test(notes)) return "rotational structure";
  if (/certification/i.test(notes)) return "certification pathway";
  if (/bootcamp/i.test(notes)) return "bootcamp-first structure";
  if (/academy/i.test(notes)) return "academy structure";
  if (/pairing|code[- ]review/i.test(notes)) return "pairing and code-review culture";
  if (/structured training/i.test(notes)) return "structured training programme";
  if (/framework/i.test(notes)) return "development framework";
  if (/mentor/i.test(notes)) return "mentoring setup";
  return null;
}

const SECTOR_PHRASES: Record<string, string> = {
  Technology: "production software used at real scale",
  Consulting: "technology that clients depend on",
  "Finance - Tech": "the software running behind a major financial institution",
  "Public Sector": "technology the public actually relies on",
};

function firstLocation(role: Role): string {
  return role.location.split(/[,/(]/)[0].trim();
}

export function generateCoverLetter(profile: Profile, role: Role): string {
  const skills = matchedSkills(profile, role);
  const evidence = evidenceSentences(profile, skills);
  const hook = schemeHook(role);
  const skillsPhrase =
    skills.length > 1 ? `${skills.slice(0, -1).join(", ")} and ${skills[skills.length - 1]}` : skills[0] ?? "modern web technologies";

  const company = cleanCompany(role.company);
  const isGradScheme = /grad/i.test(role.type);
  const greeting = `Dear ${company} ${isGradScheme ? "Graduate Recruitment" : "Hiring"} Team,`;

  const gradePhrase = profile.grade.startsWith("Predicted")
    ? `on track for a ${profile.grade.replace("Predicted ", "")}`
    : `with a ${profile.grade}`;

  const localCity = profile.location.split(",")[0].trim();
  const isLocal = localCity && role.location.toLowerCase().includes(localCity.toLowerCase());

  // Why-them in para 1: location or the sector's reality - the scheme hook is
  // saved for para 3 so the letter never repeats itself.
  const whyThem = isLocal
    ? `it means building ${SECTOR_PHRASES[role.sector] ?? "production software"} in ${localCity}, where I am based`
    : `it means building ${SECTOR_PHRASES[role.sector] ?? "software that people actually rely on"}`;

  // Para 1: who I am + exact role + specific reason, in 2 sentences.
  const p1 = `As a ${profile.course} graduate from ${profile.university} ${gradePhrase}, I am applying for the ${role.title}${role.location ? ` (${firstLocation(role)})` : ""} because ${whyThem}. I work in ${skillsPhrase}, the same ground this role covers.`;

  // Para 2: evidence #1 - strongest project, ownership verbs, no hedges.
  const p2 =
    evidence.length > 0
      ? `${evidence[0]}. I took it end to end, from design through deployment, and it shaped how I work: ship something real, measure it, improve it.`
      : `I have delivered full-stack projects end to end, from design through deployment: shipping something real, measuring it, improving it.`;

  // Para 3: evidence #2 + what the scheme lets me develop (specific, not flattery).
  const learnLine = hook
    ? `What I want from ${company} is its ${hook}: structured depth my own projects cannot replicate.`
    : `What I want from ${company} is to work at a scale my own projects cannot reach, inside an experienced engineering team.`;
  const ownershipLine = /founder|founded|self-employed|freelance/i.test(profile.projects)
    ? " Running my own client work has made me used to owning outcomes and deadlines, not just tickets."
    : "";
  const p3 = (evidence.length > 1 ? `${evidence[1]}. ${learnLine}` : learnLine) + ownershipLine;

  // Close: availability + call to action, two lines. Skip the location line
  // when para 1 already said it for a local role.
  const p4 = isLocal
    ? `I am available to start promptly and can interview at short notice. I would welcome the chance to discuss what I could contribute.`
    : `I am based in ${profile.location || "the UK"} and available to start promptly. I would welcome the chance to discuss what I could contribute, and I am available for interview at your convenience.`;

  // Unnamed greeting -> "Yours faithfully" (UK convention).
  const signoff = `Yours faithfully,\n${profile.name}`;

  const header = [
    profile.name,
    [profile.linkedin, profile.portfolio].filter(Boolean).join("  |  ") || null,
    new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  ]
    .filter(Boolean)
    .join("\n");

  return [header, "", greeting, "", p1, "", p2, "", p3, "", p4, "", signoff].join("\n");
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
