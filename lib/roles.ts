import rolesFile from "@/data/roles.json";
import type { RolesFile } from "./types";

/** Roles feed. Currently the JSON snapshot synced from ../gradscan/roles.json
 *  (npm run sync-roles). When Supabase is wired, swap this for a
 *  `select * from roles` so the site updates without redeploys. */
export function getRolesFile(): RolesFile {
  return rolesFile as unknown as RolesFile;
}
