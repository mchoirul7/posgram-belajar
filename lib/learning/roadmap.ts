import type {
  LearningMissionDetails,
  LearningPathDetails,
  LearningPathStep
} from "./data";

/**
 * Geometry for the roadmap map.
 *
 * Positions are computed from the mission instead of being hardcoded, so a
 * mission with any number of concepts and checkpoints lays out evenly and the
 * board is exactly as tall as it needs to be. X is a percentage of the board
 * width (the connector SVG uses the same 0-100 scale), Y is in pixels.
 */

const START_Y = 96;
const FIRST_NODE_Y = 196;
const NODE_GAP = 88;
/** Extra breathing room before each new concept, where its label sits. */
const CONCEPT_LEAD = 52;
const FINISH_GAP = 112;
const BOTTOM_PADDING = 96;

/** Serpentine sweep. Kept inside 28-72% so a node never clips on a phone. */
const X_PATTERN = [50, 30, 70, 32, 68, 44];

/** One tone per concept, cycled when a mission somehow exceeds the palette. */
export const CONCEPT_TONE_COUNT = 5;

export type RoadmapCheckpoint = {
  x: number;
  y: number;
  conceptIndex: number;
  conceptName: string;
  missionSequence: number;
  path: LearningPathDetails;
  step: LearningPathStep;
};

export type RoadmapConcept = {
  id: string;
  name: string;
  conceptIndex: number;
  y: number;
  checkpointCount: number;
  completedCount: number;
  locked: boolean;
};

export type RoadmapPoint = { x: number; y: number };

export type RoadmapLayout = {
  height: number;
  start: RoadmapPoint;
  checkpoints: RoadmapCheckpoint[];
  concepts: RoadmapConcept[];
  finish: RoadmapPoint & { unlocked: boolean };
  linePoints: RoadmapPoint[];
  progressPoints: RoadmapPoint[];
  activeCheckpoint: RoadmapCheckpoint | null;
  completedCount: number;
  totalCount: number;
};

export function isPathComplete(path: LearningPathDetails): boolean {
  const requiredSteps = path.steps.filter((step) => step.isRequired);

  return (
    requiredSteps.length > 0 &&
    requiredSteps.every((step) => step.progressStatus === "completed")
  );
}

export function hasActiveStep(path: LearningPathDetails): boolean {
  return path.steps.some((step) => step.progressStatus === "in_progress");
}

/** The next concept a student may start: all earlier concepts are finished. */
export function getStartablePath(
  mission: LearningMissionDetails
): LearningPathDetails | undefined {
  return mission.paths
    .map(({ learningPath }) => learningPath)
    .find((path, index, paths) => {
      const previousComplete = paths
        .slice(0, index)
        .every((previousPath) => isPathComplete(previousPath));

      return previousComplete && !isPathComplete(path) && !hasActiveStep(path);
    });
}

export function buildRoadmapLayout(
  mission: LearningMissionDetails
): RoadmapLayout {
  const checkpoints: RoadmapCheckpoint[] = [];
  const concepts: RoadmapConcept[] = [];

  let y = FIRST_NODE_Y;
  let nodeIndex = 0;

  mission.paths.forEach(({ learningPath, sequence }, conceptIndex) => {
    if (conceptIndex > 0) {
      y += CONCEPT_LEAD;
    }

    const conceptStart = y;
    const steps = learningPath.steps;

    steps.forEach((step) => {
      checkpoints.push({
        x: X_PATTERN[nodeIndex % X_PATTERN.length],
        y,
        conceptIndex,
        conceptName: learningPath.targetConcept.name,
        missionSequence: sequence,
        path: learningPath,
        step
      });

      y += NODE_GAP;
      nodeIndex += 1;
    });

    concepts.push({
      id: learningPath.id,
      name: learningPath.targetConcept.name,
      conceptIndex,
      y: conceptStart - 42,
      checkpointCount: steps.length,
      completedCount: steps.filter(
        (step) => step.progressStatus === "completed"
      ).length,
      locked: steps.every((step) => step.progressStatus === "not_started")
    });
  });

  const lastY = checkpoints.length > 0 ? y - NODE_GAP : START_Y;
  const finishY = lastY + FINISH_GAP;
  const unlocked =
    checkpoints.length > 0 &&
    checkpoints.every(
      ({ step }) => !step.isRequired || step.progressStatus === "completed"
    );

  const start: RoadmapPoint = { x: 50, y: START_Y };
  const finish = { x: 50, y: finishY, unlocked };
  const linePoints: RoadmapPoint[] = [
    start,
    ...checkpoints.map(({ x, y: nodeY }) => ({ x, y: nodeY })),
    { x: finish.x, y: finish.y }
  ];

  // The travelled part of the path: up to the last checkpoint already opened.
  const lastOpenedIndex = checkpoints.reduce(
    (last, checkpoint, index) =>
      checkpoint.step.progressStatus === "not_started" ? last : index,
    -1
  );
  const progressPoints =
    lastOpenedIndex >= 0
      ? linePoints.slice(0, lastOpenedIndex + 2)
      : ([] as RoadmapPoint[]);

  if (unlocked) {
    progressPoints.push({ x: finish.x, y: finish.y });
  }

  return {
    height: finishY + BOTTOM_PADDING,
    start,
    checkpoints,
    concepts,
    finish,
    linePoints,
    progressPoints,
    activeCheckpoint:
      checkpoints.find(
        ({ step }) => step.progressStatus === "in_progress"
      ) ?? null,
    completedCount: checkpoints.filter(
      ({ step }) => step.progressStatus === "completed"
    ).length,
    totalCount: checkpoints.length
  };
}

export function toPolylinePoints(points: RoadmapPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export type ConceptProgress = {
  id: string;
  name: string;
  total: number;
  completed: number;
  percent: number;
  status: "completed" | "in_progress" | "not_started";
};

export type MissionProgressSummary = {
  total: number;
  completed: number;
  percent: number;
  lastActivityAt: string | null;
  concepts: ConceptProgress[];
};

/**
 * Progress of a mission, for the teacher's view of what the family has done.
 *
 * Counts required checkpoints only, matching how the roadmap decides a concept
 * is finished, and reports the most recent completion so a teacher can see not
 * just how far along a student is but whether they are still moving.
 */
export function summarizeMissionProgress(
  mission: LearningMissionDetails
): MissionProgressSummary {
  const concepts = mission.paths.map(({ learningPath }) => {
    const steps = learningPath.steps.filter((step) => step.isRequired);
    const completed = steps.filter(
      (step) => step.progressStatus === "completed"
    ).length;
    const started = learningPath.steps.some(
      (step) => step.progressStatus !== "not_started"
    );

    return {
      id: learningPath.id,
      name: learningPath.targetConcept.name,
      total: steps.length,
      completed,
      percent: steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0,
      status:
        steps.length > 0 && completed === steps.length
          ? ("completed" as const)
          : started
            ? ("in_progress" as const)
            : ("not_started" as const)
    };
  });

  const total = concepts.reduce((sum, concept) => sum + concept.total, 0);
  const completed = concepts.reduce(
    (sum, concept) => sum + concept.completed,
    0
  );
  const completionTimes = mission.paths
    .flatMap(({ learningPath }) => learningPath.steps)
    .map((step) => step.progressCompletedAt)
    .filter((value): value is string => Boolean(value))
    .sort();

  return {
    total,
    completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    lastActivityAt: completionTimes.at(-1) ?? null,
    concepts
  };
}
