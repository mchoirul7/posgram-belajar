import { notFound, redirect } from "next/navigation";
import { getLearningMissionIdForLearningPath } from "@/lib/learning/data";

type LearnPageProps = {
  params: Promise<{
    learningPathId: string;
  }>;
};

export default async function LearnPage({ params }: LearnPageProps) {
  const { learningPathId } = await params;
  const missionId = await getLearningMissionIdForLearningPath(learningPathId);

  if (!missionId) {
    notFound();
  }

  redirect(`/mission/${missionId}`);
}
