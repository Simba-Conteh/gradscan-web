"use client";

import { useState } from "react";
import { EMPTY_PROFILE, type Profile } from "@/lib/types";
import { GRADES, SECTORS, TRAITS, UNIVERSITIES } from "@/lib/constants";
import { extractSkills } from "@/lib/fit";

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
  const [p, setP] = useState<Profile>(initial ?? EMPTY_PROFILE);
  const [busy, setBusy] = useState(false);
  const [scanned, setScanned] = useState(false);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const toggle = (k: "sectors" | "traits") => (v: string) =>
    set(k, p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v]);

  function scanCV() {
    set("skills", extractSkills(p.cvText + " " + p.projects, p.skills));
    setScanned(true);
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
        <label className="label">CV scanner — paste your CV text</label>
        <textarea
          rows={5}
          value={p.cvText}
          onChange={(e) => set("cvText", e.target.value)}
          placeholder="Paste your CV here and hit Scan CV — skills are extracted automatically."
        />
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={scanCV} className="btn-ghost">
            Scan CV
          </button>
          {scanned && (
            <span className="text-xs text-ok">✓ {p.skills.length} skills on file</span>
          )}
        </div>
        {p.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {p.skills.map((k) => (
              <span key={k} className="chip chip-kw">
                {k}
              </span>
            ))}
          </div>
        )}
      </div>

      <button className="btn" disabled={busy}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
