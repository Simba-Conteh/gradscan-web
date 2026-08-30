"use client";

import { useEffect, useState } from "react";
import { backend, backendName } from "@/lib/backend";
import type { Role, RoleComment } from "@/lib/types";

export default function Discussion({
  role,
  userId,
  authorName,
  onClose,
}: {
  role: Role;
  userId: string;
  authorName: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<RoleComment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    backend
      .listComments(role.id)
      .then(setComments)
      .catch(() => setComments([]));
  }, [role.id]);

  async function post() {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    setError("");
    try {
      await backend.addComment(userId, authorName, role.id, body);
      setDraft("");
      setComments(await backend.listComments(role.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't post that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl border border-line bg-panel p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-bold">
            💬 {role.company}
            <span className="ml-2 text-sm font-normal text-muted">{role.title}</span>
          </h3>
          <button onClick={onClose} className="text-xl leading-none text-muted hover:text-body" aria-label="Close">
            ×
          </button>
        </div>
        <p className="mb-3 text-xs text-muted">
          Application chat for this role — timelines, test formats, offers.
          {backendName === "local" && " (Demo mode: posts stay in this browser only.)"}
        </p>

        <div className="min-h-[120px] flex-1 space-y-3 overflow-y-auto rounded-xl border border-line bg-bg p-3">
          {comments === null && <p className="text-sm text-muted">Loading...</p>}
          {comments?.length === 0 && (
            <p className="text-sm text-muted">No posts yet — start the thread.</p>
          )}
          {comments?.map((c) => (
            <div key={c.id} className="rounded-lg bg-panel2 p-3">
              <div className="mb-1 text-xs text-muted">
                <b className="text-accent">{c.author_name}</b> ·{" "}
                {new Date(c.created_at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="whitespace-pre-wrap text-sm">{c.body}</div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            placeholder="Share where you are with this application..."
          />
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted">Posting as {authorName || "Anonymous"}</span>
            <button onClick={post} disabled={busy || !draft.trim()} className="btn !py-1.5 text-sm">
              {busy ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
