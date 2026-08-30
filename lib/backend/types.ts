import type { Profile, RoleComment, User } from "../types";

/** Swappable backend contract. The app only ever talks to this interface,
 *  so wiring in Supabase (or anything else) later touches zero UI code. */
export interface Backend {
  register(email: string, password: string): Promise<User>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  currentUser(): Promise<User | null>;
  getProfile(userId: string): Promise<Profile | null>;
  saveProfile(userId: string, profile: Profile): Promise<void>;
  /** Role ids the user watches for job alerts. */
  getWatchlist(userId: string): Promise<string[]>;
  setWatch(userId: string, roleId: string, on: boolean): Promise<void>;
  /** Per-role discussion. */
  listComments(roleId: string): Promise<RoleComment[]>;
  addComment(userId: string, authorName: string, roleId: string, body: string): Promise<void>;
}

export class AuthError extends Error {}
