"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProfileForm from "@/components/ProfileForm";
import { backend } from "@/lib/backend";
import type { Profile, User } from "@/lib/types";

function Editor({ user }: { user: User }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    backend.getProfile(user.id).then(setProfile);
  }, [user.id]);

  if (profile === undefined) return <div className="p-10 text-center text-muted">Loading...</div>;

  return (
    <main className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold">Your profile</h1>
      <p className="mb-6 text-sm text-muted">Changes update your fit scores immediately.</p>
      <div className="rounded-2xl border border-line bg-panel p-6">
        <ProfileForm
          initial={profile}
          submitLabel="Save changes"
          onSave={async (p) => {
            await backend.saveProfile(user.id, p);
            router.push("/dashboard");
          }}
        />
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return <AppShell>{(user) => <Editor user={user} />}</AppShell>;
}
