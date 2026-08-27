import { UNIVERSITIES } from "./constants";

/** Applicant details pulled from pasted CV text. Everything is best-effort:
 *  only confidently matched fields are returned, and the form only fills
 *  fields the user hasn't already typed into. */
export interface ExtractedApplicant {
  name?: string;
  linkedin?: string;
  portfolio?: string;
  university?: string;
  course?: string;
  grade?: string;
}

export function extractApplicant(text: string): ExtractedApplicant {
  const out: ExtractedApplicant = {};
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Name: first line that looks like "Firstname Lastname" (2-4 capitalised words)
  for (const line of lines.slice(0, 5)) {
    if (/^[A-Z][a-zA-Z'-]+(\s[A-Z][a-zA-Z'-]+){1,3}$/.test(line)) {
      out.name = line;
      break;
    }
  }

  const linkedin = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]+/i);
  if (linkedin) out.linkedin = linkedin[0].replace(/^https?:\/\//i, "");

  // Portfolio: first non-LinkedIn, non-email personal-site-looking URL
  const urls = text.match(/(?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:dev|app|io|me|co|com|uk|wtf|site|page)\b(?:\/\S*)?/gi) ?? [];
  for (const raw of urls) {
    const u = raw.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    const host = u.split("/")[0].toLowerCase();
    if (host.includes("linkedin.com")) continue;
    if (text.includes(`@${host}`)) continue; // part of an email address
    out.portfolio = u;
    break;
  }

  const lower = text.toLowerCase();
  const uni = UNIVERSITIES.find(
    (u) => u !== "Other UK university" && lower.includes(u.toLowerCase()),
  );
  if (uni) out.university = uni;

  // [ \t] not \s: the course name must not swallow words from the next line
  const course = text.match(
    /\b(BSc|BA|BEng|MEng|MSc|MA|LLB)[ \t]*(?:\(Hons\))?[ \t]+[A-Z][A-Za-z&',/-]*(?:[ \t]+(?:&|and|[A-Z][A-Za-z&',/-]*)){0,5}/,
  );
  if (course) out.course = course[0].replace(/[ \t]+/g, " ").trim();

  const predicted = /predicted|on track for|expected/i.test(text);
  let grade: string | undefined;
  if (/\bfirst[- ]class\b|\b1st\b|\bhigh first\b/i.test(text)) grade = "First";
  else if (/\b2[.:]1\b|\bupper second\b/i.test(text)) grade = "2:1";
  else if (/\b2[.:]2\b|\blower second\b/i.test(text)) grade = "2:2";
  if (grade) out.grade = predicted ? `Predicted ${grade}` : grade;

  return out;
}
