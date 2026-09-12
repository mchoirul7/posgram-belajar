export type ResourceType =
  | "material"
  | "example"
  | "guided_practice"
  | "practice";

export type ProgressStatus = "completed" | "in_progress" | "not_started";

export const resourceLabels: Record<ResourceType, string> = {
  material: "Pahami",
  example: "Lihat Contoh",
  guided_practice: "Coba Bersama",
  practice: "Tantangan"
};

export const progressLabels: Record<ProgressStatus, string> = {
  completed: "selesai",
  in_progress: "aktif",
  not_started: "locked"
};

export function toResourceLabel(type: string): string {
  return resourceLabels[type as ResourceType] ?? "Checkpoint";
}

export function toProgressLabel(status: string): string {
  return progressLabels[status as ProgressStatus] ?? "locked";
}
