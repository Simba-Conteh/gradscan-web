export type DateConfidence = "confirmed" | "indicative" | "unconfirmed";
export type RoleStatus = "Open" | "Opens soon" | "Verify" | "Watch" | "Closed";

export interface Role {
  id: string;
  company: string;
  title: string;
  sector: string;
  type: string;
  location: string;
  opens: string | null;
  deadline: string | null;
  status: RoleStatus;
  min_grade: string | null;
  eligibility: string | null;
  notes: string | null;
  source: string;
  first_seen: string;
  region_confirmed: boolean;
  date_confidence: DateConfidence;
  tags?: string[];
}

export interface RolesFile {
  meta: { last_updated: string; region_scope: string; [k: string]: unknown };
  roles: Role[];
}

export interface Profile {
  name: string;
  grade: string;
  course: string;
  university: string;
  age: string;
  demographic: string;
  sectors: string[];
  traits: string[];
  linkedin: string;
  portfolio: string;
  projects: string;
  skills: string[];
  cvText: string;
  /** Explicit opt-in: profile URLs (LinkedIn/portfolio) may be scanned to
   *  strengthen future job applications. Never assumed - unticked by default. */
  urlScanConsent: boolean;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export const EMPTY_PROFILE: Profile = {
  name: "",
  grade: "2:1",
  course: "",
  university: "",
  age: "",
  demographic: "Prefer not to say",
  sectors: [],
  traits: [],
  linkedin: "",
  portfolio: "",
  projects: "",
  skills: [],
  cvText: "",
  urlScanConsent: false,
};
