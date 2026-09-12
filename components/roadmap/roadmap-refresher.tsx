"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ROADMAP_CHANNEL,
  type RoadmapChannelMessage
} from "./roadmap-channel";

/**
 * Keeps the roadmap tab current while checkpoints are done in other tabs.
 *
 * Two triggers, because neither alone is enough: the broadcast fires the moment
 * a checkpoint is completed, and the window focus handler covers the case where
 * the checkpoint tab closed before its message landed.
 */
export function RoadmapRefresher({ missionId }: { missionId: string }) {
  const router = useRouter();

  useEffect(() => {
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(ROADMAP_CHANNEL);

    if (channel) {
      channel.onmessage = (event: MessageEvent<RoadmapChannelMessage>) => {
        if (event.data?.missionId === missionId) {
          router.refresh();
        }
      };
    }

    const handleFocus = () => {
      router.refresh();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      channel?.close();
      window.removeEventListener("focus", handleFocus);
    };
  }, [missionId, router]);

  return null;
}
