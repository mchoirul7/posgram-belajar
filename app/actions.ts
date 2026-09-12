"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRoadmapGenerationData } from "@/lib/assessments/data";
import {
  getLearningMissionIdForLearningPath,
  getLearningPath
} from "@/lib/learning/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const TEMPLATE_CODE = "FOUNDATION";

function cleanFormValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string, returnTo = "/"): never {
  const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/";
  const separator = safeReturnTo.includes("?") ? "&" : "?";

  redirect(`${safeReturnTo}${separator}error=${encodeURIComponent(message)}`);
}

export async function createLearningMissionAction(formData: FormData) {
  const studentId = cleanFormValue(formData.get("studentId"));
  const roadmapId = cleanFormValue(formData.get("roadmapId"));
  const returnTo = cleanFormValue(formData.get("returnTo")) || "/";
  let targetConceptCodes = formData
    .getAll("targetConceptCodes")
    .map((value) => cleanFormValue(value))
    .filter(Boolean);

  if (!studentId) {
    redirectWithError("Siswa tidak ditemukan.", returnTo);
  }

  if (roadmapId) {
    const generationData = await getRoadmapGenerationData(roadmapId);

    if (!generationData || generationData.roadmap.studentId !== studentId) {
      redirectWithError("Roadmap siswa tidak ditemukan.", returnTo);
    }

    if (generationData.roadmap.learningMissionId) {
      redirect(`/mission/${generationData.roadmap.learningMissionId}`);
    }

    targetConceptCodes = generationData.targetConceptCodes;
  }

  const uniqueConceptCodes = [...new Set(targetConceptCodes)];

  if (uniqueConceptCodes.length === 0) {
    redirectWithError("Pilih minimal satu target belajar.", returnTo);
  }

  if (uniqueConceptCodes.length > 5) {
    redirectWithError("Pilih maksimal 5 concept.", returnTo);
  }

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc("create_learning_mission", {
    p_student_id: studentId,
    p_target_concept_codes: uniqueConceptCodes,
    p_template_code: TEMPLATE_CODE
  });

  if (error || !data) {
    redirectWithError("Misi belajar belum bisa dibuat.", returnTo);
  }

  const learningMissionId = String(data);

  if (roadmapId) {
    const { error: roadmapError } = await supabase
      .from("student_roadmaps")
      .update({
        generated_at: new Date().toISOString(),
        learning_mission_id: learningMissionId,
        status: "generated"
      })
      .eq("id", roadmapId)
      .eq("student_id", studentId);

    if (roadmapError) {
      redirectWithError("Roadmap dibuat, tapi belum bisa ditautkan.", returnTo);
    }
  }

  revalidatePath(returnTo);
  redirect(`/mission/${learningMissionId}`);
}

/**
 * Starts a concept and hands back the URL of the checkpoint that just became
 * active, so the roadmap can open it straight away instead of making the
 * student find and click checkpoint 1 afterwards.
 */
export async function startMissionPathAction(
  learningPathId: string
): Promise<{ href: string } | { error: string }> {
  const learningPath = await getLearningPath(learningPathId);

  if (!learningPath) {
    return { error: "Misi belajar tidak ditemukan." };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.rpc("start_learning_path", {
    p_learning_path_id: learningPath.id,
    p_student_id: learningPath.studentId
  });

  if (error) {
    return { error: "Misi belajar belum bisa dimulai." };
  }

  const [missionId, startedPath] = await Promise.all([
    getLearningMissionIdForLearningPath(learningPathId),
    getLearningPath(learningPathId)
  ]);
  const firstStep =
    startedPath?.steps.find((step) => step.progressStatus === "in_progress") ??
    startedPath?.steps[0];

  if (!missionId || !firstStep) {
    return { error: "Checkpoint pertama belum tersedia." };
  }

  revalidatePath(`/mission/${missionId}`);

  return {
    href: `/mission/${missionId}/step/${firstStep.id}?path=${learningPathId}`
  };
}

export async function startLearningPathAction(
  learningPathId: string,
  returnPath?: string
) {
  const learningPath = await getLearningPath(learningPathId);

  if (!learningPath) {
    redirect("/");
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.rpc("start_learning_path", {
    p_learning_path_id: learningPath.id,
    p_student_id: learningPath.studentId
  });

  if (error) {
    throw new Error("Misi belajar belum bisa dimulai.");
  }

  const destination = returnPath ?? `/learn/${learningPath.id}`;

  revalidatePath(destination);
  redirect(destination);
}

export async function completeLearningStepAction(
  learningPathId: string,
  learningPathStepId: string,
  returnPath?: string
) {
  const learningPath = await getLearningPath(learningPathId);

  if (!learningPath) {
    redirect("/");
  }

  const step = learningPath.steps.find(
    (candidate) => candidate.id === learningPathStepId
  );

  if (!step) {
    redirect(returnPath ?? `/learn/${learningPath.id}`);
  }

  if (step.progressStatus === "not_started") {
    redirect(returnPath ?? `/learn/${learningPath.id}`);
  }

  if (step.progressStatus !== "completed") {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.rpc("complete_learning_step", {
      p_learning_path_step_id: step.id,
      p_student_id: learningPath.studentId
    });

    if (error) {
      throw new Error("Checkpoint belum bisa diselesaikan.");
    }
  }

  const destination = returnPath ?? `/learn/${learningPath.id}`;

  revalidatePath(destination);
  redirect(destination);
}
