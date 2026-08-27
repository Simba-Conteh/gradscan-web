"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProfileForm from "@/components/ProfileForm";
import { backend } from "@/lib/backend";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <AppShell>
      {(user) => (
        <main className="mx-auto max-w-3xl">
          <h1 className="mb-1 text-2xl font-bold">Build your profile</h1>
          <p className="mb-6 text-sm text-muted">
            This is what every role gets scored against. You can edit it any time.
          </p>
          <div className="rounded-2xl border border-line bg-panel p-6">
            <ProfileForm
              submitLabel="Save & see my matches →"
              onSave={async (p) => {
                await backend.saveProfile(user.id, p);
                router.push("/dashboard");
              }}
            />
          </div>
        </main>
      )}
    </AppShell>
  );
}
