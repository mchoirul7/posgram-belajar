import {
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  Flag,
  Lock,
  PencilLine,
  Play,
  Rocket,
  Sparkles,
  Trophy
} from "lucide-react";
import {
  completeLearningStepAction,
  startLearningPathAction
} from "@/app/actions";
import type {
  LearningMissionDetails,
  LearningPathDetails,
  LearningPathStep
} from "@/lib/learning/data";
import { toProgressLabel, toResourceLabel } from "@/lib/learning/labels";
import { ResourceContent } from "./resource-content";

function StepIcon({ step }: { step: LearningPathStep }) {
  if (step.progressStatus === "completed") {
    return <CheckCircle2 aria-hidden="true" size={24} />;
  }

  if (step.progressStatus === "not_started") {
    return <Lock aria-hidden="true" size={23} />;
  }

  if (step.stepType === "material") {
    return <BookOpen aria-hidden="true" size={23} />;
  }

  if (step.stepType === "example") {
    return <Eye aria-hidden="true" size={23} />;
  }

  if (step.stepType === "guided_practice") {
    return <Sparkles aria-hidden="true" size={23} />;
  }

  return <PencilLine aria-hidden="true" size={23} />;
}

function StepCard({
  learningPathId,
  returnPath,
  sectionUnlocked = true,
  step
}: {
  learningPathId: string;
  returnPath?: string;
  sectionUnlocked?: boolean;
  step: LearningPathStep;
}) {
  const statusLabel = toProgressLabel(step.progressStatus);
  const canOpen =
    sectionUnlocked &&
    (step.progressStatus === "in_progress" ||
      step.progressStatus === "completed");
  const completeAction = completeLearningStepAction.bind(
    null,
    learningPathId,
    step.id,
    returnPath
  );

  return (
    <li className={`journey-step ${statusLabel}`}>
      <div className="checkpoint-icon">
        <StepIcon step={step} />
      </div>
      <article className="journey-card">
        <div className="checkpoint-head">
          <div>
            <h2 className="checkpoint-title">
              {step.sequence}. {toResourceLabel(step.stepType)}
            </h2>
            <p className="checkpoint-subtitle">
              {step.resource?.title ?? "Resource belum tersedia"}
              {step.estimatedMinutes ? ` · ${step.estimatedMinutes} menit` : ""}
            </p>
          </div>
          <span className={`status-badge ${statusLabel}`}>{statusLabel}</span>
        </div>

        {canOpen && step.resource ? (
          <details
            className="checkpoint-details"
            open={step.progressStatus === "in_progress"}
          >
            <summary>Buka checkpoint</summary>
            <ResourceContent resource={step.resource} />
            {step.progressStatus === "in_progress" ? (
              <form action={completeAction} className="checkpoint-action">
                <button className="button" type="submit">
                  <Check aria-hidden="true" size={19} />
                  Selesaikan Checkpoint
                </button>
              </form>
            ) : null}
          </details>
        ) : (
          <p className="locked-copy">
            {sectionUnlocked
              ? "Checkpoint ini terbuka setelah checkpoint aktif selesai."
              : "Area concept ini terbuka setelah area sebelumnya selesai."}
          </p>
        )}
      </article>
    </li>
  );
}

function isPathComplete(learningPath: LearningPathDetails): boolean {
  const requiredSteps = learningPath.steps.filter((step) => step.isRequired);

  return (
    requiredSteps.length > 0 &&
    requiredSteps.every((step) => step.progressStatus === "completed")
  );
}

function hasActiveStep(learningPath: LearningPathDetails): boolean {
  return learningPath.steps.some((step) => step.progressStatus === "in_progress");
}

function PathSection({
  index,
  learningPath,
  returnPath,
  sectionUnlocked = true,
  showStart = true
}: {
  index?: number;
  learningPath: LearningPathDetails;
  returnPath?: string;
  sectionUnlocked?: boolean;
  showStart?: boolean;
}) {
  const complete = isPathComplete(learningPath);
  const active = hasActiveStep(learningPath);
  const startAction = startLearningPathAction.bind(
    null,
    learningPath.id,
    returnPath
  );
  const canStart = showStart && sectionUnlocked && !complete && !active;

  return (
    <section className={`concept-section ${sectionUnlocked ? "" : "locked"}`}>
      <div className="concept-header">
        <span className="concept-number">
          {typeof index === "number" ? index + 1 : 1}
        </span>
        <div>
          <p className="eyebrow">Area concept</p>
          <h2>{learningPath.targetConcept.name}</h2>
          <p>
            {learningPath.targetConcept.code}
            {learningPath.estimatedMinutes
              ? ` · ${learningPath.estimatedMinutes} menit`
              : ""}
          </p>
        </div>
      </div>

      {canStart ? (
        <form action={startAction} className="concept-action">
          <button className="button secondary" type="submit">
            <Play aria-hidden="true" size={18} />
            Mulai Area
          </button>
        </form>
      ) : null}

      <ol className="journey">
        {learningPath.steps.map((step) => (
          <StepCard
            key={step.id}
            learningPathId={learningPath.id}
            returnPath={returnPath}
            sectionUnlocked={sectionUnlocked}
            step={step}
          />
        ))}
      </ol>
    </section>
  );
}

export function LearningJourney({
  learningPath
}: {
  learningPath: LearningPathDetails;
}) {
  const requiredSteps = learningPath.steps.filter((step) => step.isRequired);
  const completedRequiredSteps = requiredSteps.filter(
    (step) => step.progressStatus === "completed"
  );
  const missionComplete =
    requiredSteps.length > 0 &&
    completedRequiredSteps.length === requiredSteps.length;

  return (
    <section aria-label="Misi belajar">
      <div className="start-marker">
        <div className="marker-icon">
          {missionComplete ? (
            <Trophy aria-hidden="true" size={25} />
          ) : (
            <Rocket aria-hidden="true" size={25} />
          )}
        </div>
        <div className="start-copy">
          <strong>{missionComplete ? "Garis Finish" : "Start"}</strong>
          <span>
            {missionComplete
              ? "Semua checkpoint wajib selesai."
              : "Mulai dari checkpoint aktif pertama."}
          </span>
        </div>
      </div>

      <ol className="journey">
        {learningPath.steps.map((step) => (
          <StepCard
            key={step.id}
            learningPathId={learningPath.id}
            step={step}
          />
        ))}
      </ol>

      {missionComplete ? (
        <div className="finish-banner">
          <strong>🏆 Misi Selesai</strong>
          <span>Semua checkpoint wajib sudah dituntaskan.</span>
        </div>
      ) : (
        <div className="start-marker">
          <div className="marker-icon">
            <Flag aria-hidden="true" size={24} />
          </div>
          <div className="start-copy">
            <strong>Finish</strong>
            <span>Trofi muncul setelah semua checkpoint wajib selesai.</span>
          </div>
        </div>
      )}
    </section>
  );
}

export function MissionJourney({
  mission
}: {
  mission: LearningMissionDetails;
}) {
  const returnPath = `/mission/${mission.id}`;
  const requiredSteps = mission.paths.flatMap(({ learningPath }) =>
    learningPath.steps.filter((step) => step.isRequired)
  );
  const completedRequiredSteps = requiredSteps.filter(
    (step) => step.progressStatus === "completed"
  );
  const missionComplete =
    requiredSteps.length > 0 &&
    completedRequiredSteps.length === requiredSteps.length;

  return (
    <section aria-label="Misi belajar">
      <div className="start-marker">
        <div className="marker-icon">
          {missionComplete ? (
            <Trophy aria-hidden="true" size={25} />
          ) : (
            <Rocket aria-hidden="true" size={25} />
          )}
        </div>
        <div className="start-copy">
          <strong>{missionComplete ? "Garis Finish" : "Start"}</strong>
          <span>
            {missionComplete
              ? "Semua area concept sudah selesai."
              : "Ikuti area concept sesuai urutan misi."}
          </span>
        </div>
      </div>

      {mission.paths.map(({ learningPath }, index) => {
        const previousPathsComplete = mission.paths
          .slice(0, index)
          .every(({ learningPath: previousPath }) =>
            isPathComplete(previousPath)
          );

        return (
          <PathSection
            index={index}
            key={learningPath.id}
            learningPath={learningPath}
            returnPath={returnPath}
            sectionUnlocked={previousPathsComplete}
          />
        );
      })}

      {missionComplete ? (
        <div className="finish-banner">
          <strong>🏆 Misi Selesai</strong>
          <span>Semua checkpoint wajib sudah dituntaskan.</span>
        </div>
      ) : (
        <div className="start-marker">
          <div className="marker-icon">
            <Flag aria-hidden="true" size={24} />
          </div>
          <div className="start-copy">
            <strong>Finish</strong>
            <span>Trofi muncul setelah semua area concept selesai.</span>
          </div>
        </div>
      )}
    </section>
  );
}
