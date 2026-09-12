/** Cross-tab signal: a checkpoint tab tells the roadmap tab to reload itself. */
export const ROADMAP_CHANNEL = "posgram-roadmap";

export type RoadmapChannelMessage = {
  missionId: string;
};

export function postRoadmapUpdate(missionId: string) {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  const channel = new BroadcastChannel(ROADMAP_CHANNEL);

  channel.postMessage({ missionId } satisfies RoadmapChannelMessage);
  channel.close();
}
