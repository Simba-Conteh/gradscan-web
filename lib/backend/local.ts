import { AuthError, type Backend } from "./types";
import type { Profile, User } from "../types";

/** Demo backend: everything lives in this browser's localStorage.
 *  Accounts do not sync across devices and are wiped if site data is cleared.
 *  Replace with the Supabase adapter for real multi-user registrations. */

type StoredUser = User & { salt: string; hash: string };

const USERS_KEY = "gradscan_users";
const SESSION_KEY = "gradscan_session";

function read<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable - demo mode degrades silently */
  }
}

async function digest(salt: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(salt + ":" + password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function users(): Record<string, StoredUser> {
  return read<Record<string, StoredUser>>(USERS_KEY) ?? {};
}

export const localBackend: Backend = {
  async register(email, password) {
    const norm = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) throw new AuthError("Enter a valid email address.");
    if (password.length < 8) throw new AuthError("Password must be at least 8 characters.");
    const all = users();
    if (all[norm]) throw new AuthError("That email is already registered - jump back in instead.");
    const salt = crypto.randomUUID();
    const user: StoredUser = {
      id: crypto.randomUUID(),
      email: norm,
      createdAt: new Date().toISOString(),
      salt,
      hash: await digest(salt, password),
    };
    all[norm] = user;
    write(USERS_KEY, all);
    write(SESSION_KEY, user.id);
    const { salt: _s, hash: _h, ...pub } = user;
    return pub;
  },

  async login(email, password) {
    const norm = email.trim().toLowerCase();
    const u = users()[norm];
    if (!u) throw new AuthError("No account found for that email - are you new here?");
    if ((await digest(u.salt, password)) !== u.hash) throw new AuthError("Wrong password.");
    write(SESSION_KEY, u.id);
    const { salt: _s, hash: _h, ...pub } = u;
    return pub;
  },

  async logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  },

  async currentUser() {
    const id = read<string>(SESSION_KEY);
    if (!id) return null;
    const u = Object.values(users()).find((x) => x.id === id);
    if (!u) return null;
    const { salt: _s, hash: _h, ...pub } = u;
    return pub;
  },

  async getProfile(userId) {
    return read<Profile>(`gradscan_profile_${userId}`);
  },

  async saveProfile(userId, profile) {
    write(`gradscan_profile_${userId}`, profile);
  },

  async getWatchlist(userId) {
    return read<string[]>(`gradscan_watch_${userId}`) ?? [];
  },

  async setWatch(userId, roleId, on) {
    const list = new Set(read<string[]>(`gradscan_watch_${userId}`) ?? []);
    if (on) list.add(roleId);
    else list.delete(roleId);
    write(`gradscan_watch_${userId}`, [...list]);
  },

  // Demo comments are per-browser only - the live site's shared discussion
  // needs the Supabase backend.
  async listComments(roleId) {
    return read<import("../types").RoleComment[]>(`gradscan_comments_${roleId}`) ?? [];
  },

  async addComment(userId, authorName, roleId, body) {
    const list = read<import("../types").RoleComment[]>(`gradscan_comments_${roleId}`) ?? [];
    list.push({
      id: crypto.randomUUID(),
      role_id: roleId,
      author_name: authorName || "Anonymous",
      body,
      created_at: new Date().toISOString(),
    });
    write(`gradscan_comments_${roleId}`, list);
  },
};
