import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  parseCheckpointContent,
  type CheckpointContent,
  type JsonValue,
  type LearningResource
} from "./content";
import type { ProgressStatus, ResourceType } from "./labels";

type RawRecord = Record<string, unknown>;

export type ConceptOption = {
  id: string;
  code: string;
  name: string;
  competencyName: string;
  subtopicName: string;
  topicName: string;
};

export type LearningPathStep = {
  id: string;
  sequence: number;
  stepType: ResourceType;
  difficulty: string;
  isRequired: boolean;
  estimatedMinutes: number | null;
  resource: LearningResource | null;
  progressStatus: ProgressStatus;
  progressStartedAt: string | null;
  progressCompletedAt: string | null;
};

export type LearningPathDetails = {
  id: string;
  studentId: string;
  status: string;
  estimatedMinutes: number | null;
  startedAt: string | null;
  completedAt: string | null;
  targetConcept: {
    id: string;
    code: string;
    name: string;
    description: string | null;
  };
  steps: LearningPathStep[];
};

export type LearningMissionPath = {
  id: string;
  sequence: number;
  learningPath: LearningPathDetails;
};

export type LearningMissionDetails = {
  id: string;
  studentId: string;
  studentName: string | null;
  status: string;
  estimatedMinutes: number | null;
  startedAt: string | null;
  completedAt: string | null;
  paths: LearningMissionPath[];
};

export type LearningMissionSummary = LearningMissionDetails & {
  requiredStepCount: number;
  completedRequiredStepCount: number;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function asBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function asResourceType(value: unknown): ResourceType {
  const type = asString(value);

  if (
    type === "material" ||
    type === "example" ||
    type === "guided_practice" ||
    type === "practice"
  ) {
    return type;
  }

  return "material";
}

function asProgressStatus(value: unknown): ProgressStatus {
  const status = asString(value);

  if (
    status === "completed" ||
    status === "in_progress" ||
    status === "not_started"
  ) {
    return status;
  }

  return "not_started";
}

/**
 * Surfaces content blobs the checkpoint renderer cannot map, so an unexpected
 * schema shows up in the server console instead of silently falling back.
 */
function logUnrecognizedContent(
  resourceId: string,
  resourceTitle: string,
  rawContent: JsonValue,
  parsed: CheckpointContent | null
) {
  if (parsed && parsed.kind !== "unknown") {
    return;
  }

  const isEmpty =
    rawContent === null ||
    rawContent === undefined ||
    (typeof rawContent === "object" &&
      !Array.isArray(rawContent) &&
      Object.keys(rawContent).length === 0);

  if (isEmpty) {
    return;
  }

  console.warn(
    `[checkpoint-content] Unrecognized content schema for learning_resources.id=${resourceId} ("${resourceTitle}").`,
    {
      topLevelKeys:
        parsed?.kind === "unknown"
          ? parsed.keys
          : typeof rawContent === "object" && !Array.isArray(rawContent)
            ? Object.keys(rawContent ?? {})
            : typeof rawContent,
      content: rawContent
    }
  );
}

function assertNoError(error: { message?: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message ?? "Supabase request failed."}`);
  }
}

export async function getActiveMathConcepts(): Promise<ConceptOption[]> {
  const supabase = getSupabaseServerClient();

  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, code")
    .eq("code", "MTK-SD")
    .eq("is_active", true)
    .limit(1);

  assertNoError(subjectsError, "Unable to load active subject");

  const subjectId = asString(subjects?.[0]?.id);

  if (!subjectId) {
    return [];
  }

  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("id, name, sort_order")
    .eq("subject_id", subjectId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  assertNoError(topicsError, "Unable to load active topics");

  const topicById = new Map(
    (topics ?? []).map((topic) => [
      asString(topic.id),
      {
        name: asString(topic.name),
        sortOrder: asNumber(topic.sort_order)
      }
    ])
  );
  const topicIds = [...topicById.keys()].filter(Boolean);

  if (topicIds.length === 0) {
    return [];
  }

  const { data: subtopics, error: subtopicsError } = await supabase
    .from("subtopics")
    .select("id, topic_id, name, sort_order")
    .in("topic_id", topicIds)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  assertNoError(subtopicsError, "Unable to load active subtopics");

  const subtopicById = new Map(
    (subtopics ?? []).map((subtopic) => [
      asString(subtopic.id),
      {
        name: asString(subtopic.name),
        topicId: asString(subtopic.topic_id),
        sortOrder: asNumber(subtopic.sort_order)
      }
    ])
  );
  const subtopicIds = [...subtopicById.keys()].filter(Boolean);

  if (subtopicIds.length === 0) {
    return [];
  }

  const { data: competencies, error: competenciesError } = await supabase
    .from("competencies")
    .select("id, subtopic_id, name, sort_order")
    .in("subtopic_id", subtopicIds)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  assertNoError(competenciesError, "Unable to load active competencies");

  const competencyById = new Map(
    (competencies ?? []).map((competency) => [
      asString(competency.id),
      {
        name: asString(competency.name),
        subtopicId: asString(competency.subtopic_id),
        sortOrder: asNumber(competency.sort_order)
      }
    ])
  );
  const competencyIds = [...competencyById.keys()].filter(Boolean);

  if (competencyIds.length === 0) {
    return [];
  }

  const { data: concepts, error: conceptsError } = await supabase
    .from("concepts")
    .select("id, competency_id, code, name, sort_order")
    .in("competency_id", competencyIds)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  assertNoError(conceptsError, "Unable to load active concepts");

  return (concepts ?? [])
    .map((concept) => {
      const competency = competencyById.get(asString(concept.competency_id));
      const subtopic = competency
        ? subtopicById.get(competency.subtopicId)
        : undefined;
      const topic = subtopic ? topicById.get(subtopic.topicId) : undefined;

      return {
        id: asString(concept.id),
        code: asString(concept.code),
        name: asString(concept.name),
        competencyName: competency?.name ?? "",
        subtopicName: subtopic?.name ?? "",
        topicName: topic?.name ?? "",
        orderKey: [
          topic?.sortOrder ?? 0,
          subtopic?.sortOrder ?? 0,
          competency?.sortOrder ?? 0,
          asNumber(concept.sort_order)
        ]
      };
    })
    .sort((left, right) => {
      for (let index = 0; index < left.orderKey.length; index += 1) {
        const diff = left.orderKey[index] - right.orderKey[index];
        if (diff !== 0) {
          return diff;
        }
      }

      return left.name.localeCompare(right.name, "id");
    })
    .map((concept) => ({
      id: concept.id,
      code: concept.code,
      name: concept.name,
      competencyName: concept.competencyName,
      subtopicName: concept.subtopicName,
      topicName: concept.topicName
    }));
}

export async function getLearningPath(
  learningPathId: string
): Promise<LearningPathDetails | null> {
  const supabase = getSupabaseServerClient();

  const { data: pathRows, error: pathError } = await supabase
    .from("learning_paths")
    .select(
      "id, student_id, status, estimated_minutes, started_at, completed_at, target_concept_id"
    )
    .eq("id", learningPathId)
    .limit(1);

  assertNoError(pathError, "Unable to load learning path");

  const path = pathRows?.[0] as RawRecord | undefined;

  if (!path) {
    return null;
  }

  const targetConceptId = asString(path.target_concept_id);

  const { data: conceptRows, error: conceptError } = await supabase
    .from("concepts")
    .select("id, code, name, description")
    .eq("id", targetConceptId)
    .limit(1);

  assertNoError(conceptError, "Unable to load target concept");

  const targetConcept = conceptRows?.[0] as RawRecord | undefined;

  if (!targetConcept) {
    return null;
  }

  const { data: stepRows, error: stepsError } = await supabase
    .from("learning_path_steps")
    .select(
      "id, sequence, step_type, difficulty, is_required, estimated_minutes, resource_id"
    )
    .eq("learning_path_id", learningPathId)
    .order("sequence", { ascending: true });

  assertNoError(stepsError, "Unable to load learning path steps");

  const steps = (stepRows ?? []) as RawRecord[];
  const resourceIds = [
    ...new Set(steps.map((step) => asString(step.resource_id)).filter(Boolean))
  ];

  const resourcesById = new Map<string, LearningResource>();

  if (resourceIds.length > 0) {
    const { data: resources, error: resourcesError } = await supabase
      .from("learning_resources")
      .select(
        "id, title, resource_type, difficulty, content, estimated_minutes, status"
      )
      .in("id", resourceIds);

    assertNoError(resourcesError, "Unable to load learning resources");

    for (const resource of (resources ?? []) as RawRecord[]) {
      const id = asString(resource.id);
      const resourceType = asResourceType(resource.resource_type);
      const rawContent = resource.content as JsonValue;
      const content = parseCheckpointContent(rawContent, resourceType);

      logUnrecognizedContent(id, asString(resource.title), rawContent, content);

      resourcesById.set(id, {
        id,
        title: asString(resource.title),
        resourceType,
        difficulty: asString(resource.difficulty),
        content,
        estimatedMinutes: asNullableNumber(resource.estimated_minutes),
        status: asString(resource.status)
      });
    }
  }

  const { data: progressRows, error: progressError } = await supabase
    .from("learning_path_progress")
    .select(
      "learning_path_step_id, status, started_at, completed_at, student_id"
    )
    .eq("learning_path_id", learningPathId)
    .eq("student_id", asString(path.student_id));

  assertNoError(progressError, "Unable to load learning path progress");

  const progressByStepId = new Map(
    ((progressRows ?? []) as RawRecord[]).map((progress) => [
      asString(progress.learning_path_step_id),
      progress
    ])
  );

  const hydratedSteps = steps.map((step) => {
    const stepId = asString(step.id);
    const progress = progressByStepId.get(stepId);

    return {
      id: stepId,
      sequence: asNumber(step.sequence),
      stepType: asResourceType(step.step_type),
      difficulty: asString(step.difficulty),
      isRequired: asBoolean(step.is_required),
      estimatedMinutes: asNullableNumber(step.estimated_minutes),
      resource: resourcesById.get(asString(step.resource_id)) ?? null,
      progressStatus: asProgressStatus(progress?.status),
      progressStartedAt: asNullableString(progress?.started_at),
      progressCompletedAt: asNullableString(progress?.completed_at)
    };
  });

  return {
    id: asString(path.id),
    studentId: asString(path.student_id),
    status: asString(path.status),
    estimatedMinutes: asNullableNumber(path.estimated_minutes),
    startedAt: asNullableString(path.started_at),
    completedAt: asNullableString(path.completed_at),
    targetConcept: {
      id: asString(targetConcept.id),
      code: asString(targetConcept.code),
      name: asString(targetConcept.name),
      description: asNullableString(targetConcept.description)
    },
    steps: hydratedSteps
  };
}

export async function getLearningMission(
  learningMissionId: string
): Promise<LearningMissionDetails | null> {
  const supabase = getSupabaseServerClient();

  const { data: missionRows, error: missionError } = await supabase
    .from("learning_missions")
    .select(
      "id, student_id, student_name, status, estimated_minutes, started_at, completed_at"
    )
    .eq("id", learningMissionId)
    .limit(1);

  assertNoError(missionError, "Unable to load learning mission");

  const mission = missionRows?.[0] as RawRecord | undefined;

  if (!mission) {
    return null;
  }

  const { data: missionPathRows, error: missionPathsError } = await supabase
    .from("learning_mission_paths")
    .select("id, learning_path_id, sequence")
    .eq("learning_mission_id", learningMissionId)
    .order("sequence", { ascending: true });

  assertNoError(missionPathsError, "Unable to load mission paths");

  const missionPathRecords = (missionPathRows ?? []) as RawRecord[];
  const paths = await Promise.all(
    missionPathRecords.map(async (missionPath) => {
      const learningPath = await getLearningPath(
        asString(missionPath.learning_path_id)
      );

      if (!learningPath) {
        return null;
      }

      return {
        id: asString(missionPath.id),
        sequence: asNumber(missionPath.sequence),
        learningPath
      };
    })
  );

  return {
    id: asString(mission.id),
    studentId: asString(mission.student_id),
    studentName: asNullableString(mission.student_name),
    status: asString(mission.status),
    estimatedMinutes: asNullableNumber(mission.estimated_minutes),
    startedAt: asNullableString(mission.started_at),
    completedAt: asNullableString(mission.completed_at),
    paths: paths.filter((path): path is LearningMissionPath => path !== null)
  };
}

export async function getLearningMissionIdForLearningPath(
  learningPathId: string
): Promise<string | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("learning_mission_paths")
    .select("learning_mission_id")
    .eq("learning_path_id", learningPathId)
    .limit(1);

  assertNoError(error, "Unable to load learning mission for path");

  return asNullableString(data?.[0]?.learning_mission_id);
}

export async function getLearningMissionsForStudent(
  studentId: string
): Promise<LearningMissionSummary[]> {
  const supabase = getSupabaseServerClient();

  const { data: missionRows, error } = await supabase
    .from("learning_missions")
    .select("id, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  assertNoError(error, "Unable to load student missions");

  const missions = await Promise.all(
    ((missionRows ?? []) as RawRecord[]).map((mission) =>
      getLearningMission(asString(mission.id))
    )
  );

  return missions
    .filter((mission): mission is LearningMissionDetails => mission !== null)
    .map((mission) => {
      const requiredSteps = mission.paths.flatMap(({ learningPath }) =>
        learningPath.steps.filter((step) => step.isRequired)
      );
      const completedRequiredSteps = requiredSteps.filter(
        (step) => step.progressStatus === "completed"
      );

      return {
        ...mission,
        requiredStepCount: requiredSteps.length,
        completedRequiredStepCount: completedRequiredSteps.length
      };
    });
}
