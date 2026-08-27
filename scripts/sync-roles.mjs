// Copies the source-of-truth roles.json from the gradscan folder into this
// app's data directory. Run after each daily scan (or add to the scheduled
// task) so the site ships fresh data on next build/deploy.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "..", "gradscan", "roles.json");
const dst = join(here, "..", "data", "roles.json");

// The site only needs meta + roles. The personal profile block stays out of
// the repo - users build their own profiles in-app.
const { meta, roles } = JSON.parse(readFileSync(src, "utf-8"));
writeFileSync(dst, JSON.stringify({ meta, roles }, null, 2) + "\n", "utf-8");
console.log(`Synced ${roles.length} roles (profile stripped) -> ${dst}`);
