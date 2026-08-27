"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { backend, backendName, AuthError } from "@/lib/backend";

type Mode = "register" | "login";

export default function AuthCard() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user =
        mode === "register"
          ? await backend.register(email, password)
          : await backend.login(email, password);
      const profile = await backend.getProfile(user.id);
      router.push(profile ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong - try again.");
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-xl">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-panel2 p-1">
        <button
          type="button"
          onClick={() => { setMode("register"); setError(""); }}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            mode === "register" ? "bg-accent text-[#04211c]" : "text-muted hover:text-body"
          }`}
        >
          New here? Sign up
        </button>
        <button
          type="button"
          onClick={() => { setMode("login"); setError(""); }}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            mode === "login" ? "bg-accent text-[#04211c]" : "text-muted hover:text-body"
          }`}
        >
          Jump back in
        </button>
      </div>

      <h2 className="mb-1 text-lg font-bold">
        {mode === "register" ? "Create your account" : "Welcome back"}
      </h2>
      <p className="mb-5 text-sm text-muted">
        {mode === "register"
          ? "Register, build your profile once, and every role gets scored against it."
          : "Log in to pick up your profile and your matched roles."}
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button className="btn w-full" disabled={busy}>
          {busy ? "One sec..." : mode === "register" ? "Create account →" : "Jump back in →"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">
        {backendName === "supabase"
          ? "Accounts are stored securely — log in from any device."
          : "Demo mode: accounts live only in this browser until a database is linked."}
      </p>
    </div>
  );
}
