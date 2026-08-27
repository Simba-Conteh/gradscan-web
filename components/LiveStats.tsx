"use client";

import { useRoles } from "@/lib/useRoles";

/** Landing-page stats: render instantly from the build-time snapshot, then
 *  upgrade to the live feed. */
export default function LiveStats() {
  const { meta, roles, live } = useRoles();
  const open = roles.filter((r) => r.status === "Open").length;
  const soon = roles.filter((r) => r.status === "Opens soon").length;

  return (
    <>
      <div className="flex gap-8">
        <div>
          <div className="text-3xl font-bold text-ok">{open}</div>
          <div className="text-xs uppercase tracking-wider text-muted">Open now</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-warn">{soon}</div>
          <div className="text-xs uppercase tracking-wider text-muted">Opening soon</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-accent2">{roles.length}</div>
          <div className="text-xs uppercase tracking-wider text-muted">Roles tracked</div>
        </div>
      </div>
      <p className="mt-6 text-xs text-muted">
        {live ? "● Live feed · updated " : "Data updated "}
        {meta.last_updated} · scanned daily
      </p>
    </>
  );
}
