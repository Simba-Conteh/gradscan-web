import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AuthError, type Backend } from "./types";
import type { Profile, User } from "../types";
import { EMPTY_PROFILE } from "../types";

/**
 * Supabase adapter. Activates automatically (see lib/backend/index.ts) once
 * these exist in .env.local (and in Vercel env vars when deploying):
 *
 *   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable/anon key>
 *
 * Prerequisite: run supabase/schema.sql on the project (SQL Editor) first.
 * Tip: if you want instant sign-ups without a confirmation email, turn off
 * "Confirm email" under Authentication → Providers → Email in the dashboard.
 */

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}

function toUser(u: { id: string; email?: string; created_at?: string }): User {
  return { id: u.id, email: u.email ?? "", createdAt: u.created_at ?? "" };
}

type ProfileRow = {
  user_id: string;
  name: string;
  grade: string;
  course: string;
  university: string;
  age: string;
  demographic: string;
  sectors: string[];
  traits: string[];
  linkedin: string;
  portfolio: string;
  projects: string;
  skills: string[];
  cv_text: string;
};

function fromRow(r: ProfileRow): Profile {
  const { user_id: _uid, cv_text, ...rest } = r;
  return { ...EMPTY_PROFILE, ...rest, cvText: cv_text ?? "" };
}

function toRow(userId: string, p: Profile): ProfileRow {
  const { cvText, ...rest } = p;
  return { user_id: userId, ...rest, cv_text: cvText };
}

export const supabaseBackend: Backend = {
  async register(email, password) {
    const { data, error } = await sb().auth.signUp({ email, password });
    if (error) throw new AuthError(error.message);
    if (!data.session) {
      throw new AuthError(
        "Account created - check your email for a confirmation link, then jump back in.",
      );
    }
    return toUser(data.user!);
  },

  async login(email, password) {
    const { data, error } = await sb().auth.signInWithPassword({ email, password });
    if (error) throw new AuthError(error.message);
    return toUser(data.user);
  },

  async logout() {
    await sb().auth.signOut();
  },

  async currentUser() {
    const { data } = await sb().auth.getUser();
    return data.user ? toUser(data.user) : null;
  },

  async getProfile(userId) {
    const { data, error } = await sb()
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new AuthError(error.message);
    return data ? fromRow(data as ProfileRow) : null;
  },

  async saveProfile(userId, profile) {
    const { error } = await sb().from("profiles").upsert(toRow(userId, profile));
    if (error) throw new AuthError(error.message);
  },
};
