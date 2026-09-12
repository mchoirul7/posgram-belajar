import {
  BookOpen,
  Check,
  Eye,
  Flag,
  Lock,
  PencilLine,
  Sparkles,
  Star,
  Trophy
} from "lucide-react";
import { startMissionPathAction } from "@/app/actions";
import { CheckpointLink } from "@/components/roadmap/checkpoint-link";
import { RoadmapRefresher } from "@/components/roadmap/roadmap-refresher";
import { StartMissionButton } from "@/components/roadmap/start-mission-button";
import type { LearningMissionDetails, LearningPathStep } from "@/lib/learning/data";
import { toResourceLabel } from "@/lib/learning/labels";
import {
  buildRoadmapLayout,
  CONCEPT_TONE_COUNT,
  getStartablePath,
  toPolylinePoints
} from "@/lib/learning/roadmap";
import type { MockStudent } from "@/lib/students/mock";

function toneClass(conceptIndex: number) {
  return `tone-${conceptIndex % CONCEPT_TONE_COUNT}`;
}

function NodeIcon({ step }: { step: LearningPathStep }) {
  if (step.progressStatus === "completed") {
    return <Check aria-hidden="true" size={28} />;
  }

  if (step.progressStatus === "not_started") {
    return <Lock aria-hidden="true" size={24} />;
  }

  if (step.stepType === "material") {
    return <BookOpen aria-hidden="true" size={26} />;
  }

  if (step.stepType === "example") {
    return <Eye aria-hidden="true" size={26} />;
  }

  if (step.stepType === "guided_practice") {
    return <Sparkles aria-hidden="true" size={26} />;
  }

  return <PencilLine aria-hidden="true" size={26} />;
}

export function RoadmapMap({
  mission,
  student
}: {
  mission: LearningMissionDetails;
  student: MockStudent | null;
}) {
  const layout = buildRoadmapLayout(mission);
  const startablePath = getStartablePath(mission);
  const startAction = startablePath
    ? startMissionPathAction.bind(null, startablePath.id)
    : null;

  return (
    <>
      <RoadmapRefresher missionId={mission.id} />

      <div className="roadmap-legend" aria-label="Daftar konsep dalam misi">
        {layout.concepts.map((concept) => (
          <span
            className={`roadmap-legend-item ${toneClass(concept.conceptIndex)}${
              concept.locked ? " locked" : ""
            }`}
            key={concept.id}
          >
            <i aria-hidden="true" />
            <strong>{concept.name}</strong>
            <small>
              {concept.completedCount}/{concept.checkpointCount}
            </small>
          </span>
        ))}
      </div>

      <section
        aria-label="Roadmap belajar"
        className="roadmap-map"
        style={{ height: `${layout.height}px` }}
      >
        <svg
          aria-hidden="true"
          className="roadmap-connector"
          preserveAspectRatio="none"
          viewBox={`0 0 100 ${layout.height}`}
        >
          <polyline
            className="roadmap-connector-base"
            points={toPolylinePoints(layout.linePoints)}
            vectorEffect="non-scaling-stroke"
          />
          {layout.progressPoints.length > 1 ? (
            <polyline
              className="roadmap-connector-progress"
              points={toPolylinePoints(layout.progressPoints)}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        <div className="planet one" aria-hidden="true" />
        <div className="planet two" aria-hidden="true" />

        {startAction ? (
          <StartMissionButton action={startAction} />
        ) : (
          <div className="start-bubble map-start">
            <span>START</span>
            <div>
              <Star aria-hidden="true" fill="white" size={30} />
            </div>
          </div>
        )}

        {layout.concepts.map((concept) => (
          <p
            className={`roadmap-concept-label ${toneClass(concept.conceptIndex)}`}
            key={concept.id}
            style={{ top: `${concept.y}px` }}
          >
            <span>Konsep {concept.conceptIndex + 1}</span>
            {concept.name}
          </p>
        ))}

        {layout.checkpoints.map((checkpoint) => {
          const { step, path, missionSequence, conceptIndex, x, y } = checkpoint;
          const clickable =
            step.progressStatus === "completed" ||
            step.progressStatus === "in_progress";
          const className = [
            "map-node",
            toneClass(conceptIndex),
            step.progressStatus === "completed" ? "completed" : "",
            step.progressStatus === "in_progress" ? "active" : "",
            step.progressStatus === "not_started" ? "locked" : ""
          ]
            .filter(Boolean)
            .join(" ");
          const title = `${missionSequence}.${step.sequence} ${toResourceLabel(
            step.stepType
          )}`;
          const style = {
            "--node-x": `${x}%`,
            "--node-y": `${y}px`
          } as React.CSSProperties;
          const content = (
            <>
              <NodeIcon step={step} />
              <span className="node-tooltip">
                <strong>{title}</strong>
                <small>{step.resource?.title ?? "Checkpoint"}</small>
              </span>
            </>
          );

          if (!clickable) {
            return (
              <div
                aria-label={`${title} terkunci`}
                className={className}
                key={step.id}
                style={style}
              >
                {content}
              </div>
            );
          }

          return (
            <CheckpointLink
              className={className}
              href={`/mission/${mission.id}/step/${step.id}?path=${path.id}`}
              key={step.id}
              label={`Buka ${title}`}
              style={style}
            >
              {content}
            </CheckpointLink>
          );
        })}

        {layout.activeCheckpoint ? (
          <div
            aria-hidden="true"
            className={`student-token ${
              layout.activeCheckpoint.x < 50 ? "to-right" : "to-left"
            }`}
            style={{
              "--node-x": `${layout.activeCheckpoint.x}%`,
              "--node-y": `${layout.activeCheckpoint.y}px`
            } as React.CSSProperties}
          >
            <div className={`avatar portrait ${student?.avatarTone ?? "blue"}`}>
              {student?.avatar ?? "S"}
            </div>
          </div>
        ) : null}

        <div
          className={`map-finish${layout.finish.unlocked ? " unlocked" : ""}`}
          style={{
            "--node-x": `${layout.finish.x}%`,
            "--node-y": `${layout.finish.y}px`
          } as React.CSSProperties}
        >
          <div className="map-finish-node">
            {layout.finish.unlocked ? (
              <Trophy aria-hidden="true" size={32} />
            ) : (
              <Flag aria-hidden="true" size={30} />
            )}
          </div>
          <strong>FINISH</strong>
          <small>
            {layout.finish.unlocked
              ? "Misi belajar selesai!"
              : `${layout.completedCount}/${layout.totalCount} checkpoint selesai`}
          </small>
        </div>
      </section>

      <p className="map-help">
        Checkpoint terbuka di tab baru. Tab akan menutup sendiri setelah kamu
        menyelesaikannya, dan roadmap ini ikut diperbarui.
      </p>
    </>
  );
}
