import "server-only";

import { getLearningMission, type LearningMissionDetails } from "@/lib/learning/data";
import {
  getParentReportHref,
  normalizeShareToken
} from "@/lib/parent/share-token";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type RawRecord = Record<string, unknown>;

export type AvatarTone = "blue" | "gray" | "green" | "rose";

export type AssessmentInfo = {
  id: string;
  code: string;
  name: string;
  gradeLabel: string;
  groupName: string | null;
  heldAt: string | null;
};

export type WeaknessResult = {
  id: string;
  subtopicId: string;
  subtopicName: string;
  topicName: string;
  score: number;
  status: string;
  priorityOrder: number;
};

export type RoadmapTarget = {
  id: string;
  conceptId: string;
  conceptCode: string;
  conceptName: string;
  priorityOrder: number;
  source: string;
  sourceAssessmentSubtopicResultId: string | null;
};

export type StudentRoadmapInfo = {
  id: string;
  assessmentId: string;
  studentId: string;
  assessmentParticipantId: string;
  learningMissionId: string | null;
  generationSource: string;
  status: string;
  targets: RoadmapTarget[];
};

export type ParticipantSummary = {
  participantId: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  gradeLabel: string;
  avatarInitials: string;
  avatarTone: AvatarTone;
  totalScore: number | null;
  completionPercent: number | null;
  rankInAssessment: number | null;
  participantStatus: string;
  shareToken: string;
  shareRevokedAt: string | null;
  weaknessCount: number;
  weaknessNames: string[];
  roadmap: StudentRoadmapInfo | null;
  roadmapProgressPercent: number;
};

export type AssessmentDashboard = {
  assessment: AssessmentInfo;
  participants: ParticipantSummary[];
  averageScore: number | null;
  averageCompletionPercent: number | null;
  totalWeaknessCount: number;
};

export type ParticipantDetail = ParticipantSummary & {
  assessment: AssessmentInfo;
  weaknesses: WeaknessResult[];
  mission: LearningMissionDetails | null;
};

export type RoadmapGenerationData = {
  roadmap: StudentRoadmapInfo;
  targetConceptCodes: string[];
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return asNumber(value);
}

function asAvatarTone(value: unknown): AvatarTone {
  if (value === "gray" || value === "green" || value === "rose") {
    return value;
  }

  return "blue";
}

function makeInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function assertNoError(error: { message?: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message ?? "Supabase request failed."}`);
  }
}

function toAssessmentInfo(record: RawRecord): AssessmentInfo {
  return {
    id: asString(record.id),
    code: asString(record.code),
    name: asString(record.name),
    gradeLabel: asString(record.grade_label),
    groupName: asNullableString(record.group_name),
    heldAt: asNullableString(record.held_at)
  };
}

function toParticipantSummary(
  participant: RawRecord,
  weaknesses: WeaknessResult[],
  roadmap: StudentRoadmapInfo | null,
  roadmapProgressPercent: number
): ParticipantSummary {
  const studentName = asString(participant.student_name);

  return {
    participantId: asString(participant.id),
    assessmentId: asString(participant.assessment_id),
    studentId: asString(participant.student_id),
    studentName,
    gradeLabel: asString(participant.grade_label),
    avatarInitials:
      asNullableString(participant.avatar_initials) ?? makeInitials(studentName),
    avatarTone: asAvatarTone(participant.avatar_tone),
    totalScore: asNullableNumber(participant.total_score),
    completionPercent: asNullableNumber(participant.completion_percent),
    rankInAssessment: asNullableNumber(participant.rank_in_assessment),
    participantStatus: asString(participant.participant_status),
    shareToken: asString(participant.share_token),
    shareRevokedAt: asNullableString(participant.share_revoked_at),
    weaknessCount: weaknesses.length,
    weaknessNames: weaknesses.map((weakness) => weakness.subtopicName),
    roadmap,
    roadmapProgressPercent
  };
}

async function getLatestAssessment(): Promise<AssessmentInfo | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, code, name, grade_label, group_name, held_at, created_at")
    .eq("status", "published")
    .order("held_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1);

  assertNoError(error, "Unable to load latest assessment");

  const assessment = data?.[0] as RawRecord | undefined;

  return assessment ? toAssessmentInfo(assessment) : null;
}

async function getAssessment(assessmentId: string): Promise<AssessmentInfo | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, code, name, grade_label, group_name, held_at")
    .eq("id", assessmentId)
    .limit(1);

  assertNoError(error, "Unable to load assessment");

  const assessment = data?.[0] as RawRecord | undefined;

  return assessment ? toAssessmentInfo(assessment) : null;
}

async function getParticipants(assessmentId: string): Promise<RawRecord[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("assessment_participants")
    .select(
      "id, assessment_id, student_id, student_name, grade_label, avatar_initials, avatar_tone, total_score, completion_percent, rank_in_assessment, participant_status, share_token, share_revoked_at"
    )
    .eq("assessment_id", assessmentId)
    .order("rank_in_assessment", { ascending: true, nullsFirst: false })
    .order("student_name", { ascending: true });

  assertNoError(error, "Unable to load assessment participants");

  return (data ?? []) as RawRecord[];
}

async function getParticipantByStudent(
  studentId: string,
  assessmentId?: string
): Promise<RawRecord | null> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("assessment_participants")
    .select(
      "id, assessment_id, student_id, student_name, grade_label, avatar_initials, avatar_tone, total_score, completion_percent, rank_in_assessment, participant_status, share_token, share_revoked_at"
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (assessmentId) {
    query = query.eq("assessment_id", assessmentId);
  }

  const { data, error } = await query;

  assertNoError(error, "Unable to load student assessment participant");

  return (data?.[0] as RawRecord | undefined) ?? null;
}

async function getParticipantById(
  participantId: string
): Promise<RawRecord | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("assessment_participants")
    .select(
      "id, assessment_id, student_id, student_name, grade_label, avatar_initials, avatar_tone, total_score, completion_percent, rank_in_assessment, participant_status, share_token, share_revoked_at"
    )
    .eq("id", participantId)
    .limit(1);

  assertNoError(error, "Unable to load assessment participant");

  return (data?.[0] as RawRecord | undefined) ?? null;
}

async function getWeaknessesByParticipantIds(
  participantIds: string[]
): Promise<Map<string, WeaknessResult[]>> {
  const result = new Map<string, WeaknessResult[]>();

  if (participantIds.length === 0) {
    return result;
  }

  const supabase = getSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("assessment_subtopic_results")
    .select(
      "id, assessment_participant_id, subtopic_id, score, result_status, priority_order"
    )
    .in("assessment_participant_id", participantIds)
    .order("priority_order", { ascending: true });

  assertNoError(error, "Unable to load assessment weakness results");

  const weaknessRows = (rows ?? []) as RawRecord[];
  const subtopicIds = [
    ...new Set(weaknessRows.map((row) => asString(row.subtopic_id)).filter(Boolean))
  ];
  const subtopicMetaById = await getSubtopicMetaById(subtopicIds);

  for (const row of weaknessRows) {
    const participantId = asString(row.assessment_participant_id);
    const subtopicId = asString(row.subtopic_id);
    const meta = subtopicMetaById.get(subtopicId);
    const weakness = {
      id: asString(row.id),
      subtopicId,
      subtopicName: meta?.name ?? "Subtopic",
      topicName: meta?.topicName ?? "Topik",
      score: asNumber(row.score),
      status: asString(row.result_status),
      priorityOrder: asNumber(row.priority_order)
    };

    result.set(participantId, [...(result.get(participantId) ?? []), weakness]);
  }

  return result;
}

async function getSubtopicMetaById(subtopicIds: string[]) {
  const result = new Map<string, { name: string; topicId: string; topicName: string }>();

  if (subtopicIds.length === 0) {
    return result;
  }

  const supabase = getSupabaseServerClient();
  const { data: subtopics, error: subtopicError } = await supabase
    .from("subtopics")
    .select("id, topic_id, name")
    .in("id", subtopicIds);

  assertNoError(subtopicError, "Unable to load weakness subtopics");

  const subtopicRows = (subtopics ?? []) as RawRecord[];
  const topicIds = [
    ...new Set(subtopicRows.map((row) => asString(row.topic_id)).filter(Boolean))
  ];
  const topicNameById = new Map<string, string>();

  if (topicIds.length > 0) {
    const { data: topics, error: topicError } = await supabase
      .from("topics")
      .select("id, name")
      .in("id", topicIds);

    assertNoError(topicError, "Unable to load weakness topics");

    for (const topic of (topics ?? []) as RawRecord[]) {
      topicNameById.set(asString(topic.id), asString(topic.name));
    }
  }

  for (const subtopic of subtopicRows) {
    const topicId = asString(subtopic.topic_id);
    result.set(asString(subtopic.id), {
      name: asString(subtopic.name),
      topicId,
      topicName: topicNameById.get(topicId) ?? "Topik"
    });
  }

  return result;
}

async function getRoadmapsByParticipantIds(
  participantIds: string[]
): Promise<Map<string, StudentRoadmapInfo>> {
  const result = new Map<string, StudentRoadmapInfo>();

  if (participantIds.length === 0) {
    return result;
  }

  const supabase = getSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("student_roadmaps")
    .select(
      "id, assessment_id, student_id, assessment_participant_id, learning_mission_id, generation_source, status"
    )
    .in("assessment_participant_id", participantIds);

  assertNoError(error, "Unable to load student roadmaps");

  const roadmaps = (rows ?? []) as RawRecord[];
  const roadmapIds = roadmaps.map((row) => asString(row.id)).filter(Boolean);
  const targetsByRoadmapId = await getTargetsByRoadmapIds(roadmapIds);

  for (const row of roadmaps) {
    const id = asString(row.id);
    result.set(asString(row.assessment_participant_id), {
      id,
      assessmentId: asString(row.assessment_id),
      studentId: asString(row.student_id),
      assessmentParticipantId: asString(row.assessment_participant_id),
      learningMissionId: asNullableString(row.learning_mission_id),
      generationSource: asString(row.generation_source),
      status: asString(row.status),
      targets: targetsByRoadmapId.get(id) ?? []
    });
  }

  return result;
}

async function getTargetsByRoadmapIds(
  roadmapIds: string[]
): Promise<Map<string, RoadmapTarget[]>> {
  const result = new Map<string, RoadmapTarget[]>();

  if (roadmapIds.length === 0) {
    return result;
  }

  const supabase = getSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("student_roadmap_targets")
    .select(
      "id, student_roadmap_id, concept_id, source_assessment_subtopic_result_id, priority_order, source"
    )
    .in("student_roadmap_id", roadmapIds)
    .order("priority_order", { ascending: true });

  assertNoError(error, "Unable to load student roadmap targets");

  const targetRows = (rows ?? []) as RawRecord[];
  const conceptIds = [
    ...new Set(targetRows.map((row) => asString(row.concept_id)).filter(Boolean))
  ];
  const conceptById = await getConceptsById(conceptIds);

  for (const row of targetRows) {
    const roadmapId = asString(row.student_roadmap_id);
    const conceptId = asString(row.concept_id);
    const concept = conceptById.get(conceptId);
    const target = {
      id: asString(row.id),
      conceptId,
      conceptCode: concept?.code ?? "",
      conceptName: concept?.name ?? "Konsep",
      priorityOrder: asNumber(row.priority_order),
      source: asString(row.source),
      sourceAssessmentSubtopicResultId: asNullableString(
        row.source_assessment_subtopic_result_id
      )
    };

    result.set(roadmapId, [...(result.get(roadmapId) ?? []), target]);
  }

  return result;
}

async function getConceptsById(conceptIds: string[]) {
  const result = new Map<string, { code: string; name: string }>();

  if (conceptIds.length === 0) {
    return result;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("concepts")
    .select("id, code, name")
    .in("id", conceptIds);

  assertNoError(error, "Unable to load roadmap target concepts");

  for (const concept of (data ?? []) as RawRecord[]) {
    result.set(asString(concept.id), {
      code: asString(concept.code),
      name: asString(concept.name)
    });
  }

  return result;
}

async function getMissionProgressPercentByIds(missionIds: string[]) {
  const result = new Map<string, number>();

  await Promise.all(
    missionIds.map(async (missionId) => {
      const mission = await getLearningMission(missionId);
      const requiredSteps =
        mission?.paths.flatMap(({ learningPath }) =>
          learningPath.steps.filter((step) => step.isRequired)
        ) ?? [];
      const completedRequiredSteps = requiredSteps.filter(
        (step) => step.progressStatus === "completed"
      );

      result.set(
        missionId,
        requiredSteps.length > 0
          ? Math.round((completedRequiredSteps.length / requiredSteps.length) * 100)
          : 0
      );
    })
  );

  return result;
}

function average(values: number[]) {
  const numericValues = values.filter((value) => Number.isFinite(value));

  if (numericValues.length === 0) {
    return null;
  }

  return Math.round(
    (numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length) *
      100
  ) / 100;
}

export async function getAssessmentDashboard(
  assessmentId?: string
): Promise<AssessmentDashboard | null> {
  const assessment = assessmentId
    ? await getAssessment(assessmentId)
    : await getLatestAssessment();

  if (!assessment) {
    return null;
  }

  const participants = await getParticipants(assessment.id);
  const participantIds = participants.map((participant) => asString(participant.id));
  const [weaknessesByParticipantId, roadmapsByParticipantId] = await Promise.all([
    getWeaknessesByParticipantIds(participantIds),
    getRoadmapsByParticipantIds(participantIds)
  ]);
  const missionIds = [
    ...new Set(
      [...roadmapsByParticipantId.values()]
        .map((roadmap) => roadmap.learningMissionId)
        .filter((missionId): missionId is string => Boolean(missionId))
    )
  ];
  const progressByMissionId = await getMissionProgressPercentByIds(missionIds);
  const hydratedParticipants = participants.map((participant) => {
    const participantId = asString(participant.id);
    const roadmap = roadmapsByParticipantId.get(participantId) ?? null;
    const progress = roadmap?.learningMissionId
      ? progressByMissionId.get(roadmap.learningMissionId) ?? 0
      : 0;

    return toParticipantSummary(
      participant,
      weaknessesByParticipantId.get(participantId) ?? [],
      roadmap,
      progress
    );
  });

  return {
    assessment,
    participants: hydratedParticipants,
    averageScore: average(
      hydratedParticipants
        .map((participant) => participant.totalScore)
        .filter((score): score is number => score !== null)
    ),
    averageCompletionPercent: average(
      hydratedParticipants
        .map((participant) => participant.completionPercent)
        .filter((score): score is number => score !== null)
    ),
    totalWeaknessCount: hydratedParticipants.reduce(
      (sum, participant) => sum + participant.weaknessCount,
      0
    )
  };
}

async function hydrateParticipantDetail(
  participant: RawRecord
): Promise<ParticipantDetail | null> {
  const participantId = asString(participant.id);
  const [assessment, weaknessesByParticipantId, roadmapsByParticipantId] =
    await Promise.all([
      getAssessment(asString(participant.assessment_id)),
      getWeaknessesByParticipantIds([participantId]),
      getRoadmapsByParticipantIds([participantId])
    ]);

  if (!assessment) {
    return null;
  }

  const roadmap = roadmapsByParticipantId.get(participantId) ?? null;
  const mission = roadmap?.learningMissionId
    ? await getLearningMission(roadmap.learningMissionId)
    : null;
  const progressByMissionId = roadmap?.learningMissionId
    ? await getMissionProgressPercentByIds([roadmap.learningMissionId])
    : new Map<string, number>();
  const roadmapProgressPercent = roadmap?.learningMissionId
    ? progressByMissionId.get(roadmap.learningMissionId) ?? 0
    : 0;
  const weaknesses = weaknessesByParticipantId.get(participantId) ?? [];

  return {
    ...toParticipantSummary(participant, weaknesses, roadmap, roadmapProgressPercent),
    assessment,
    weaknesses,
    mission
  };
}

export async function getParticipantDetail(
  studentId: string,
  assessmentId?: string
): Promise<ParticipantDetail | null> {
  const participant = await getParticipantByStudent(studentId, assessmentId);

  return participant ? hydrateParticipantDetail(participant) : null;
}

export async function getParticipantDetailById(
  participantId: string
): Promise<ParticipantDetail | null> {
  const participant = await getParticipantById(participantId);

  return participant ? hydrateParticipantDetail(participant) : null;
}

/**
 * Entry point for the public parent report. A revoked token resolves to null,
 * so a link that was rotated or pulled back stops working immediately.
 */
export async function getParticipantDetailByShareToken(
  token: string
): Promise<ParticipantDetail | null> {
  const shareToken = normalizeShareToken(token);

  if (!shareToken) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("assessment_participants")
    .select(
      "id, assessment_id, student_id, student_name, grade_label, avatar_initials, avatar_tone, total_score, completion_percent, rank_in_assessment, participant_status, share_token, share_revoked_at"
    )
    .eq("share_token", shareToken)
    .is("share_revoked_at", null)
    .limit(1);

  assertNoError(error, "Unable to load participant for share token");

  const participant = (data?.[0] as RawRecord | undefined) ?? null;

  return participant ? hydrateParticipantDetail(participant) : null;
}

export async function getParticipantByLearningMission(
  learningMissionId: string
): Promise<ParticipantDetail | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("student_roadmaps")
    .select("student_id, assessment_id")
    .eq("learning_mission_id", learningMissionId)
    .limit(1);

  assertNoError(error, "Unable to load roadmap participant for mission");

  const roadmap = data?.[0] as RawRecord | undefined;

  if (!roadmap) {
    return null;
  }

  return getParticipantDetail(
    asString(roadmap.student_id),
    asString(roadmap.assessment_id)
  );
}

export async function getRoadmapGenerationData(
  roadmapId: string
): Promise<RoadmapGenerationData | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("student_roadmaps")
    .select(
      "id, assessment_id, student_id, assessment_participant_id, learning_mission_id, generation_source, status"
    )
    .eq("id", roadmapId)
    .limit(1);

  assertNoError(error, "Unable to load roadmap generation data");

  const row = data?.[0] as RawRecord | undefined;

  if (!row) {
    return null;
  }

  const targetsByRoadmapId = await getTargetsByRoadmapIds([asString(row.id)]);
  const targets = targetsByRoadmapId.get(asString(row.id)) ?? [];

  return {
    roadmap: {
      id: asString(row.id),
      assessmentId: asString(row.assessment_id),
      studentId: asString(row.student_id),
      assessmentParticipantId: asString(row.assessment_participant_id),
      learningMissionId: asNullableString(row.learning_mission_id),
      generationSource: asString(row.generation_source),
      status: asString(row.status),
      targets
    },
    targetConceptCodes: targets
      .map((target) => target.conceptCode)
      .filter(Boolean)
      .slice(0, 5)
  };
}

export function getParticipantShareHref(
  participant: ParticipantDetail | ParticipantSummary
): string | null {
  if (!participant.shareToken || participant.shareRevokedAt) {
    return null;
  }

  return getParentReportHref(participant.shareToken);
}

/**
 * Pairs each roadmap target concept with the weakness result it came from, so
 * the parent report can show a score and area per concept without a second
 * round of lookups.
 */
export function getTargetWeaknesses(participant: ParticipantDetail) {
  const weaknessById = new Map(
    participant.weaknesses.map((weakness) => [weakness.id, weakness])
  );

  return (participant.roadmap?.targets ?? []).map((target) => ({
    target,
    weakness: target.sourceAssessmentSubtopicResultId
      ? weaknessById.get(target.sourceAssessmentSubtopicResultId) ?? null
      : null
  }));
}
