"use client";

import { CheckCircle2, Map } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { postRoadmapUpdate } from "@/components/roadmap/roadmap-channel";

/**
 * Shown after a checkpoint is completed in its own tab.
 *
 * It tells the roadmap tab to reload, then closes itself. A browser only lets a
 * tab close when a script opened it, so when the close is refused this stays on
 * screen as a normal "back to roadmap" card instead of leaving a blank tab.
 */
export function CheckpointDone({
  missionId,
  roadmapHref
}: {
  missionId: string;
  roadmapHref: string;
}) {
  const [closing, setClosing] = useState(true);

  useEffect(() => {
    postRoadmapUpdate(missionId);

    const opener = window.opener as Window | null;

    if (opener && !opener.closed) {
      try {
        opener.focus();
      } catch {
        // Focusing the roadmap tab is a nicety; ignore if the browser blocks it.
      }
    }

    const closeTimer = window.setTimeout(() => {
      window.close();

      // Still here a beat later? The browser refused, so show the fallback.
      window.setTimeout(() => setClosing(false), 400);
    }, 700);

    return () => window.clearTimeout(closeTimer);
  }, [missionId]);

  return (
    <div className="checkpoint-done">
      <span className="checkpoint-done-icon">
        <CheckCircle2 aria-hidden="true" size={40} />
      </span>
      <h2>Checkpoint selesai!</h2>
      <p>
        {closing
          ? "Menutup tab ini dan kembali ke roadmap…"
          : "Roadmap sudah diperbarui. Kembali ke tab roadmap kamu, atau buka lagi lewat tombol di bawah."}
      </p>
      <Link className="button" href={roadmapHref}>
        <Map aria-hidden="true" size={18} />
        Buka Roadmap
      </Link>
    </div>
  );
}
