import AuthCard from "@/components/AuthCard";
import LiveStats from "@/components/LiveStats";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
      <header className="mb-14 flex items-baseline gap-3">
        <span className="text-2xl font-extrabold tracking-wide">
          GradScan<span className="text-accent">.</span>
        </span>
        <span className="text-sm text-muted">Live UK graduate role scanner</span>
      </header>

      <div className="grid flex-1 items-center gap-12 lg:grid-cols-2">
        <div>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight sm:text-5xl">
            Every UK grad role.
            <br />
            Scored against <span className="text-accent">your</span> profile.
          </h1>
          <p className="mb-8 max-w-md text-muted">
            Build your profile once — grade, course, university, sectors, CV — and GradScan
            matches it against a daily-refreshed feed of UK graduate schemes and junior roles,
            with honest date-confidence on every deadline.
          </p>
          <LiveStats />
        </div>

        <div className="flex justify-center lg:justify-end">
          <AuthCard />
        </div>
      </div>
    </main>
  );
}
