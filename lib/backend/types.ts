import type { Profile, User } from "../types";

/** Swappable backend contract. The app only ever talks to this interface,
 *  so wiring in Supabase (or anything else) later touches zero UI code. */
export interface Backend {
  register(email: string, password: string): Promise<User>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  currentUser(): Promise<User | null>;
  getProfile(userId: string): Promise<Profile | null>;
  saveProfile(userId: string, profile: Profile): Promise<void>;
}

export class AuthError extends Error {}
