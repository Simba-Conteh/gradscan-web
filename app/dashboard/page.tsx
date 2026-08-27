"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import RolesTable from "@/components/RolesTable";
import { backend } from "@/lib/backend";
import { getRolesFile } from "@/lib/roles";
import { daysUntil, fitScore } from "@/lib/fit";
import { EMPTY_PROFILE, type Profile, type User } from "@/lib/types";

function Dashboard({ user }: { user: User }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    backend.getProfile(user.id).then((p) => {
      if (!p) router.replace("/onboarding");
      else setProfile(p);
    });
  }, [user.id, router]);

  const { meta, roles } = getRolesFile();
  const today = useMemo(() => new Date(meta.last_updated + "T00:00:00"), [meta.last_updated]);

  const scored = useMemo(
    () => roles.map((r) => ({ ...r, fit: fitScore(r, profile ?? EMPTY_PROFILE) })),
    [roles, profile],
  );

  if (profile === undefined) return <div className="p-10 text-center text-muted">Loading...</div>;
  if (!profile) return null;

  const closing = roles.filter(
    (r) =>
      r.status === "Open" &&
      r.date_confidence !== "unconfirmed" &&
      (daysUntil(r.deadline, today) ?? -1) >= 0 &&
      (daysUntil(r.deadline, today) ?? 99) <= 14,
  ).length;
  const urgent = roles
    .filter(
      (r) =>
        r.status === "Open" &&
        r.date_confidence === "confirmed" &&
        (daysUntil(r.deadline, today) ?? -1) >= 0 &&
        (daysUntil(r.deadline, today) ?? 99) <= 14,
    )
    .sort((a, b) => (daysUntil(a.deadline, today) ?? 0) - (daysUntil(b.deadline, today) ?? 0));

  const cards = [
    { n: closing, label: "Closing ≤14 days", cls: "text-danger", filter: "Open" },
    { n: roles.filter((r) => r.status === "Open").length, label: "Open now", cls: "text-ok", filter: "Open" },
    { n: roles.filter((r) => r.status === "Opens soon").length, label: "Opening soon", cls: "text-warn", filter: "Opens soon" },
    { n: roles.filter((r) => r.date_confidence === "unconfirmed" || !r.region_confirmed).length, label: "Unconfirmed", cls: "text-muted", filter: "" },
    { n: roles.length, label: "Total tracked", cls: "text-accent2", filter: "" },
  ];

  return (
    <main>
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">
          Hey {profile.name.split(" ")[0] || "there"} — your matches
        </h1>
        <span className="text-xs text-muted">Data updated {meta.last_updated}</span>
      </div>

      {urgent.length > 0 && (
        <div className="mb-4 rounded-xl border border-danger/50 bg-danger/10 p-4 text-sm">
          <b className="text-danger">⚠ Closing within 14 days:</b>
          <ul className="ml-5 mt-1 list-disc">
            {urgent.map((r) => (
              <li key={r.id}>
                <b>{r.company}</b> — {r.title} · {r.deadline} ({daysUntil(r.deadline, today)} days)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => setStatusFilter(c.filter)}
            className="rounded-xl border border-line bg-panel p-4 text-left transition-colors hover:border-accent"
          >
            <div className={`text-2xl font-bold ${c.cls}`}>{c.n}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted">{c.label}</div>
          </button>
        ))}
      </div>

      <RolesTable
        roles={scored}
        today={today}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        profile={profile}
      />

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Dates only come from UK-specific sources. <b>confirmed</b> = stated for this cycle on a UK
        page · <b>indicative</b> = UK source but rolling / prior cycle · <b>unconfirmed</b> = no UK
        source, so no date is shown and no alert fires. Rolling schemes deliberately show no
        deadline. Job boards are discovery only, never the source of a date.
      </p>
    </main>
  );
}

export default function DashboardPage() {
  return <AppShell>{(user) => <Dashboard user={user} />}</AppShell>;
}
