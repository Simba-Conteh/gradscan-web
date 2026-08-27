"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { backend } from "@/lib/backend";
import type { User } from "@/lib/types";

/** Wrapper for signed-in pages: enforces a session, renders the top nav,
 *  and hands the user down via render prop. */
export default function AppShell({
  children,
}: {
  children: (user: User) => React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    backend.currentUser().then((u) => {
      if (!u) router.replace("/");
      else setUser(u);
      setLoading(false);
    });
  }, [router]);

  async function logout() {
    await backend.logout();
    router.replace("/");
  }

  if (loading || !user) {
    return <div className="p-10 text-center text-muted">Loading...</div>;
  }

  const tab = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        pathname === href ? "bg-panel2 text-accent" : "text-muted hover:text-body"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/dashboard" className="text-xl font-extrabold tracking-wide">
          GradScan<span className="text-accent">.</span>
        </Link>
        <nav className="ml-2 flex gap-1">
          {tab("/dashboard", "Dashboard")}
          {tab("/profile", "Profile")}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted sm:inline">{user.email}</span>
          <button onClick={logout} className="btn-ghost !px-3 !py-1.5 text-xs">
            Log out
          </button>
        </div>
      </header>
      {children(user)}
    </div>
  );
}
