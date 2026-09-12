"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type StartMissionResult = { href: string } | { error: string };

/**
 * Starts the next concept and lands the student straight on checkpoint 1.
 *
 * The tab is opened synchronously inside the click so the popup blocker lets it
 * through, then pointed at the checkpoint once the server action reports which
 * step became active. The roadmap tab stays put and refreshes behind it.
 */
export function StartMissionButton({
  action
}: {
  action: () => Promise<StartMissionResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (pending) {
      return;
    }

    setError(null);

    const tab = window.open("", "_blank");

    startTransition(async () => {
      const result = await action();

      if ("error" in result) {
        tab?.close();
        setError(result.error);
        return;
      }

      if (tab) {
        tab.location.href = result.href;
        tab.focus();
      } else {
        window.location.href = result.href;
      }

      router.refresh();
    });
  }

  return (
    <div className="start-bubble map-start">
      <span>{pending ? "MEMBUKA…" : "START"}</span>
      <button
        aria-label="Mulai dan buka checkpoint pertama"
        disabled={pending}
        onClick={handleClick}
        type="button"
      >
        <div>
          <Play aria-hidden="true" fill="white" size={30} />
        </div>
      </button>
      {error ? <p className="start-error">{error}</p> : null}
    </div>
  );
}
