"use client";

import { useMemo, useState } from "react";
import type { Profile, Role } from "@/lib/types";
import { daysUntil } from "@/lib/fit";
import { generateCoverLetter, wordCount } from "@/lib/coverletter";

type ScoredRole = Role & { fit: number };
type SortKey = "fit" | "company" | "title" | "sector" | "location" | "opens" | "deadline" | "status";

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-ok/15 text-ok",
  "Opens soon": "bg-warn/15 text-warn",
  Verify: "bg-info/15 text-info",
  Watch: "bg-muted/15 text-muted",
  Closed: "bg-danger/15 text-danger",
};

const CONF_STYLES: Record<string, string> = {
  confirmed: "bg-ok/15 text-ok",
  indicative: "bg-warn/15 text-warn",
  unconfirmed: "bg-muted/20 text-muted",
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RolesTable({
  roles,
  today,
  statusFilter,
  onStatusFilter,
  profile,
}: {
  roles: ScoredRole[];
  today: Date;
  statusFilter: string;
  onStatusFilter: (s: string) => void;
  profile: Profile;
}) {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("");
  const [type, setType] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fit");
  const [sortDir, setSortDir] = useState(-1);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [letterRole, setLetterRole] = useState<ScoredRole | null>(null);
  const [letterText, setLetterText] = useState("");
  const [copied, setCopied] = useState(false);

  function openLetter(r: ScoredRole) {
    setLetterRole(r);
    setLetterText(generateCoverLetter(profile, r));
    setCopied(false);
  }

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(letterText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function downloadLetter() {
    const blob = new Blob([letterText], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    // Recruiter-searchable filename convention: Firstname-Lastname-Cover-Letter
    const who = (profile.name || "My").trim().replace(/\s+/g, "-");
    const co = letterRole?.company.replace(/\W+/g, "-") ?? "role";
    a.download = `${who}-Cover-Letter-${co}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const sectors = useMemo(() => [...new Set(roles.map((r) => r.sector))].sort(), [roles]);
  const types = useMemo(() => [...new Set(roles.map((r) => r.type))].sort(), [roles]);
  const statuses = ["Open", "Opens soon", "Verify", "Watch", "Closed"].filter((s) =>
    roles.some((r) => r.status === s),
  );

  const rows = useMemo(() => {
    let out = roles.filter((r) => {
      if (sector && r.sector !== sector) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (type && r.type !== type) return false;
      if (q) {
        const hay = `${r.company} ${r.title} ${r.location} ${r.sector}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      let x: string | number = a[sortKey] ?? "";
      let y: string | number = b[sortKey] ?? "";
      if (sortKey === "opens" || sortKey === "deadline") {
        x = (a[sortKey] as string | null) ?? "9999-12-31";
        y = (b[sortKey] as string | null) ?? "9999-12-31";
      }
      if (typeof x === "string" && typeof y === "string") return sortDir * x.localeCompare(y);
      return sortDir * ((x as number) - (y as number));
    });
    return out;
  }, [roles, q, sector, statusFilter, type, sortKey, sortDir]);

  function sortBy(k: SortKey) {
    if (sortKey === k) setSortDir((d) => -d);
    else {
      setSortKey(k);
      setSortDir(k === "fit" ? -1 : 1);
    }
  }

  const TH = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th
      onClick={() => sortBy(k)}
      className="cursor-pointer select-none whitespace-nowrap bg-panel2 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted"
    >
      {children} {sortKey === k && <span className="text-accent">{sortDir > 0 ? "▲" : "▼"}</span>}
    </th>
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search company, role, location..."
          className="!w-auto min-w-[220px] flex-1"
        />
        <select className="!w-auto" value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">All sectors</option>
          {sectors.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className="!w-auto"
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="!w-auto" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse bg-panel text-sm">
          <thead>
            <tr>
              <TH k="fit">Fit</TH>
              <TH k="company">Company</TH>
              <TH k="title">Role</TH>
              <TH k="sector">Sector</TH>
              <TH k="location">Location</TH>
              <TH k="deadline">Deadline</TH>
              <TH k="status">Status</TH>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  No roles match these filters.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const dl = daysUntil(r.deadline, today);
              const urgentCls =
                dl != null && r.date_confidence !== "unconfirmed" && dl >= 0 && dl <= 14
                  ? "font-bold text-danger"
                  : dl != null && r.date_confidence !== "unconfirmed" && dl <= 30
                    ? "font-semibold text-warn"
                    : "";
              const expanded = openRow === r.id;
              return (
                <FragmentRow
                  key={r.id}
                  role={r}
                  expanded={expanded}
                  onToggle={() => setOpenRow(expanded ? null : r.id)}
                  onLetter={() => openLetter(r)}
                  deadlineCell={
                    <span className={urgentCls}>
                      {fmt(r.deadline)}
                      {dl != null && r.date_confidence !== "unconfirmed" && dl >= 0 && (
                        <span className="ml-1 text-xs">· {dl}d</span>
                      )}
                      <span
                        className={`ml-2 rounded px-1.5 py-0.5 text-[10px] ${CONF_STYLES[r.date_confidence]}`}
                      >
                        {r.date_confidence}
                      </span>
                    </span>
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {letterRole && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLetterRole(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-line bg-panel p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-bold">
                Cover letter — {letterRole.company}
                <span className="ml-2 text-sm font-normal text-muted">{letterRole.title}</span>
              </h3>
              <button
                onClick={() => setLetterRole(null)}
                className="text-xl leading-none text-muted hover:text-body"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="mb-2 text-xs text-muted">
              Drafted from your profile for this specific role — edit before using it, it is a
              starting point, not a submission. UK guidance: 250–400 words, one A4 page, sent as
              PDF; swap the greeting for a named contact if you can find one (then sign off
              &quot;Yours sincerely&quot;).
            </p>
            <textarea
              value={letterText}
              onChange={(e) => setLetterText(e.target.value)}
              className="min-h-[320px] flex-1 whitespace-pre-wrap font-[inherit] text-sm leading-relaxed"
            />
            <div className="mt-3 flex items-center gap-2">
              <button onClick={copyLetter} className="btn">
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button onClick={downloadLetter} className="btn-ghost">
                Download .txt
              </button>
              <button
                onClick={() => setLetterText(generateCoverLetter(profile, letterRole))}
                className="btn-ghost"
                title="Discard edits and re-draft from your profile"
              >
                Re-draft
              </button>
              <span
                className={`ml-auto text-xs ${
                  wordCount(letterText) > 400 ? "text-danger" : "text-muted"
                }`}
              >
                {wordCount(letterText)} words
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FragmentRow({
  role: r,
  expanded,
  onToggle,
  onLetter,
  deadlineCell,
}: {
  role: ScoredRole;
  expanded: boolean;
  onToggle: () => void;
  onLetter: () => void;
  deadlineCell: React.ReactNode;
}) {
  const fitCls = r.fit >= 4 ? "text-ok" : r.fit === 3 ? "text-warn" : "text-muted";
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-t border-line hover:bg-accent/5">
        <td className={`px-3 py-2.5 font-bold ${fitCls}`}>{r.fit}/5</td>
        <td className="px-3 py-2.5 font-semibold">{r.company}</td>
        <td className="px-3 py-2.5">{r.title}</td>
        <td className="px-3 py-2.5">{r.sector}</td>
        <td className="px-3 py-2.5">{r.location}</td>
        <td className="whitespace-nowrap px-3 py-2.5">{deadlineCell}</td>
        <td className="px-3 py-2.5">
          <span
            className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}
          >
            {r.status}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-line bg-panel2 text-[13px]">
          <td colSpan={7} className="px-4 py-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="label !mb-0.5 text-accent">Type / Min grade</div>
                {r.type} · {r.min_grade ?? "No grade stated"}
              </div>
              <div>
                <div className="label !mb-0.5 text-accent">Eligibility</div>
                {r.eligibility ?? "—"}
              </div>
              <div>
                <div className="label !mb-0.5 text-accent">Notes</div>
                {r.notes ?? "—"}
              </div>
              <div>
                <div className="label !mb-0.5 text-accent">Source</div>
                <a
                  href={r.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent2 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(() => {
                    try {
                      return new URL(r.source).hostname;
                    } catch {
                      return r.source;
                    }
                  })()}
                </a>
              </div>
              <div>
                <div className="label !mb-0.5 text-accent">First seen / UK-confirmed</div>
                {r.first_seen} · {r.region_confirmed ? "✓ UK source verified" : "✗ not verified"}
              </div>
              <div className="flex items-start">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLetter();
                  }}
                  className="btn !py-1.5 text-xs"
                >
                  ✉ Draft cover letter
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
