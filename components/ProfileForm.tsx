"use client";

import { useState } from "react";
import { EMPTY_PROFILE, type Profile } from "@/lib/types";
import { GRADES, SECTORS, TRAITS, UNIVERSITIES } from "@/lib/constants";
import { extractSkills } from "@/lib/fit";
import { extractApplicant } from "@/lib/extract";

function Chips({
  all,
  selected,
  onToggle,
}: {
  all: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {all.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onToggle(v)}
          className={`chip ${selected.includes(v) ? "chip-on" : ""}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export default function ProfileForm({
  initial,
  submitLabel,
  onSave,
}: {
  initial?: Profile | null;
  submitLabel: string;
  onSave: (p: Profile) => Promise<void>;
}) {
  const [p, setP] = useState<Profile>({ ...EMPTY_PROFILE, ...(initial ?? {}) });
  const [busy, setBusy] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [autoFilled, setAutoFilled] = useState<string[]>([]);
  const [reading, setReading] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const toggle = (k: "sectors" | "traits") => (v: string) =>
    set(k, p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v]);

  function runScan(cvText: string) {
    const found = extractApplicant(cvText);
    const filled: string[] = [];
    setP((x) => {
      const next = { ...x, cvText, skills: extractSkills(cvText + " " + x.projects, x.skills) };
      // Fill only what the user hasn't already typed - the scan assists, never overwrites.
      if (found.name && !x.name) { next.name = found.name; filled.push("name"); }
      if (found.course && !x.course) { next.course = found.course; filled.push("course"); }
      if (found.university && !x.university) { next.university = found.university; filled.push("university"); }
      if (found.grade && x.grade === EMPTY_PROFILE.grade && found.grade !== x.grade) {
        next.grade = found.grade; filled.push("grade");
      }
      if (found.linkedin && !x.linkedin) { next.linkedin = found.linkedin; filled.push("LinkedIn"); }
      if (found.portfolio && !x.portfolio) { next.portfolio = found.portfolio; filled.push("portfolio"); }
      return next;
    });
    setAutoFilled(filled);
    setScanned(true);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError("");
    setScanned(false);
    setReading("Reading file...");
    try {
      const { readCVFile } = await import("@/lib/cvfile");
      const text = await readCVFile(file, setReading);
      runScan(text);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Couldn't read that file.");
    } finally {
      setReading(null);
    }
  }

  function addSkill() {
    const s = newSkill.trim();
    if (!s) return;
    if (!p.skills.some((k) => k.toLowerCase() === s.toLowerCase())) set("skills", [...p.skills, s]);
    setNewSkill("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await onSave(p);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input required value={p.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label">Grade</label>
          <select value={p.grade} onChange={(e) => set("grade", e.target.value)}>
            {GRADES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Course</label>
          <input
            required
            value={p.course}
            onChange={(e) => set("course", e.target.value)}
            placeholder="e.g. BSc Digital Business & Technology"
          />
        </div>
        <div>
          <label className="label">University (UK)</label>
          <select value={p.university} onChange={(e) => set("university", e.target.value)}>
            <option value="">Select...</option>
            {UNIVERSITIES.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Location (town/city)</label>
          <input
            value={p.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Manchester"
          />
        </div>
        <div>
          <label className="label">Age (optional)</label>
          <input
            type="number"
            min={16}
            max={80}
            value={p.age}
            onChange={(e) => set("age", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Demographic (optional)</label>
          <select value={p.demographic} onChange={(e) => set("demographic", e.target.value)}>
            {[
              "Prefer not to say",
              "Asian or Asian British",
              "Black, African, Caribbean or Black British",
              "Mixed or multiple ethnic groups",
              "White",
              "Other ethnic group",
            ].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">
            Private to your account. Used only to flag diversity-focused programmes.
          </p>
        </div>
      </div>

      <div>
        <label className="label">Sectors you want</label>
        <Chips all={SECTORS} selected={p.sectors} onToggle={toggle("sectors")} />
      </div>

      <div>
        <label className="label">Personal traits</label>
        <Chips all={TRAITS} selected={p.traits} onToggle={toggle("traits")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">LinkedIn URL</label>
          <input
            value={p.linkedin}
            onChange={(e) => set("linkedin", e.target.value)}
            placeholder="linkedin.com/in/you"
          />
        </div>
        <div>
          <label className="label">Portfolio URL</label>
          <input
            value={p.portfolio}
            onChange={(e) => set("portfolio", e.target.value)}
            placeholder="you.dev"
          />
        </div>
      </div>

      <div>
        <label className="label">Projects &amp; experience</label>
        <textarea
          rows={3}
          value={p.projects}
          onChange={(e) => set("projects", e.target.value)}
          placeholder="What have you built or done? Skills are extracted from this too."
        />
      </div>

      <div>
        <label className="label">CV scanner — upload your CV (PDF, photo, or .txt) or paste the text</label>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <label className="btn-ghost !py-1.5 text-sm">
            📄 Upload CV file
            <input
              type="file"
              accept=".txt,.md,.pdf,image/*"
              onChange={onFile}
              className="hidden"
              disabled={!!reading}
            />
          </label>
          {reading && <span className="text-xs text-warn">⏳ {reading}</span>}
          {fileError && <span className="text-xs text-danger">{fileError}</span>}
        </div>
        <p className="mb-2 text-xs text-muted">
          Your file is read entirely in this browser — it is never uploaded or stored anywhere, so
          there is nothing to delete. Only the extracted text below is kept, and only when you save.
        </p>
        <textarea
          rows={5}
          value={p.cvText}
          onChange={(e) => set("cvText", e.target.value)}
          placeholder="...or paste your CV text here and hit Scan CV."
        />
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={() => runScan(p.cvText)} className="btn-ghost" disabled={!!reading}>
            Scan CV
          </button>
          {scanned && (
            <span className="text-xs text-ok">
              ✓ {p.skills.length} skills found
              {autoFilled.length > 0 && <> · auto-filled: {autoFilled.join(", ")} — check they look right</>}
            </span>
          )}
        </div>
        {(scanned || p.skills.length > 0) && (
          <div className="mt-3">
            <span className="label">Your skills — click × to remove, add anything the scan missed</span>
            <div className="flex flex-wrap items-center gap-2">
              {p.skills.map((k) => (
                <button
                  key={k}
                  type="button"
                  title={`Remove ${k}`}
                  onClick={() => set("skills", p.skills.filter((s) => s !== k))}
                  className="chip chip-kw !cursor-pointer hover:!border-danger hover:!text-danger"
                >
                  {k} <span aria-hidden>×</span>
                </button>
              ))}
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="+ add a skill"
                className="!w-36 !rounded-full !py-1 text-[13px]"
              />
              {newSkill.trim() && (
                <button type="button" onClick={addSkill} className="btn-ghost !px-3 !py-1 text-xs">
                  Add
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-panel2 p-4">
        <input
          type="checkbox"
          checked={p.urlScanConsent}
          onChange={(e) => set("urlScanConsent", e.target.checked)}
          className="mt-0.5 !h-4 !w-4 accent-[#5eead4]"
        />
        <span className="text-sm">
          I confirm it&apos;s okay for GradScan to scan the URLs on my profile (LinkedIn,
          portfolio) to strengthen my matches and support further job applications.
          <span className="mt-1 block text-xs text-muted">
            Optional — everything else works without it. You can untick this at any time and no
            URL is ever scanned without it.
          </span>
        </span>
      </label>

      <button className="btn" disabled={busy}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
