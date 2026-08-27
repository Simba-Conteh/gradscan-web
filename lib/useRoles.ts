"use client";

import { useEffect, useState } from "react";
import { getRolesFile } from "./roles";
import type { Role, RolesFile } from "./types";

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface RolesFeed {
  meta: RolesFile["meta"];
  roles: Role[];
  /** true once the data on screen came from the live database rather than
   *  the JSON snapshot bundled at build time. */
  live: boolean;
}

/** Roles feed: renders instantly from the bundled snapshot, then upgrades to
 *  the live Supabase feed (updated daily by the scan, no redeploy needed).
 *  Falls back to the snapshot silently if the fetch fails. */
export function useRoles(): RolesFeed {
  const staticFile = getRolesFile();
  const [feed, setFeed] = useState<RolesFeed>({
    meta: staticFile.meta,
    roles: staticFile.roles,
    live: false,
  });

  useEffect(() => {
    if (!supabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const db = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false } },
        );
        const [{ data: roles, error: rolesErr }, { data: meta }] = await Promise.all([
          db.from("roles").select("*"),
          db.from("site_meta").select("*").maybeSingle(),
        ]);
        if (cancelled || rolesErr || !roles || roles.length === 0) return;
        setFeed({
          meta: {
            ...staticFile.meta,
            ...(meta ?? {}),
            last_updated: meta?.last_updated ?? staticFile.meta.last_updated,
          },
          roles: roles as Role[],
          live: true,
        });
      } catch {
        /* snapshot remains on screen */
      }
    })();
    return () => {
      cancelled = true;
    };
    // staticFile comes from a build-time import - stable by construction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return feed;
}
