import { ArrowLeft, Check, Clock3 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { completeLearningStepAction } from "@/app/actions";
import { CheckpointDone } from "@/components/checkpoint/checkpoint-done";
import { ResourceContent } from "@/components/resource-content";
import { SubmitButton } from "@/components/ui/submit-button";
import { getLearningMission } from "@/lib/learning/data";
import { toProgressLabel, toResourceLabel } from "@/lib/learning/labels";

type StepPageProps = {
  params: Promise<{
    missionId: string;
    stepId: string;
  }>;
  searchParams?: Promise<{
    done?: string;
    path?: string;
  }>;
};

export default async function StepPage({ params, searchParams }: StepPageProps) {
  const { missionId, stepId } = await params;
  const query = await searchParams;
  const mission = await getLearningMission(missionId);

  if (!mission) {
    notFound();
  }

  const pathEntry = query?.path
    ? mission.paths.find(({ learningPath }) => learningPath.id === query.path)
    : mission.paths.find(({ learningPath }) =>
        learningPath.steps.some((step) => step.id === stepId)
      );
  const learningPath = pathEntry?.learningPath;
  const step = learningPath?.steps.find((candidate) => candidate.id === stepId);

  if (!learningPath || !step || !step.resource) {
    notFound();
  }

  const canOpen =
    step.progressStatus === "in_progress" || step.progressStatus === "completed";

  if (!canOpen) {
    notFound();
  }

  const roadmapHref = `/mission/${mission.id}`;
  const isDone = query?.done === "1";
  const completeAction = completeLearningStepAction.bind(
    null,
    learningPath.id,
    step.id,
    `/mission/${mission.id}/step/${step.id}?done=1`
  );
  const statusLabel = toProgressLabel(step.progressStatus);

  return (
    <main className="step-shell">
      <header className="step-header">
        <Link className="back-link" href={roadmapHref}>
          <ArrowLeft aria-hidden="true" size={18} />
          Roadmap
        </Link>
        <p className="eyebrow">{learningPath.targetConcept.name}</p>
        <h1>{toResourceLabel(step.stepType)}</h1>
        <p>{step.resource.title}</p>
        <div className="summary-meta">
          <span className={`status-badge ${statusLabel}`}>{statusLabel}</span>
          {step.estimatedMinutes ? (
            <span className="pill">
              <Clock3 aria-hidden="true" size={16} />
              {step.estimatedMinutes} menit
            </span>
          ) : null}
        </div>
      </header>

      {isDone ? (
        <CheckpointDone missionId={mission.id} roadmapHref={roadmapHref} />
      ) : (
        <>
          <section className="step-content-card">
            <ResourceContent resource={step.resource} />
          </section>

          {step.progressStatus === "in_progress" ? (
            <form action={completeAction} className="step-footer-action">
              <SubmitButton
                icon={<Check aria-hidden="true" size={19} />}
                pendingLabel="Menyimpan progres…"
              >
                Selesaikan Checkpoint
              </SubmitButton>
            </form>
          ) : null}
        </>
      )}
    </main>
  );
}
