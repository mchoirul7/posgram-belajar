import { notFound } from "next/navigation";
import { RoadmapMap } from "@/components/roadmap-map";
import { getLearningMission } from "@/lib/learning/data";
import { getMockStudent } from "@/lib/students/mock";

type MissionPageProps = {
  params: Promise<{
    missionId: string;
  }>;
};

export default async function MissionPage({ params }: MissionPageProps) {
  const { missionId } = await params;
  const mission = await getLearningMission(missionId);

  if (!mission) {
    notFound();
  }

  const student = getMockStudent(mission.studentId);

  return (
    <main className="roadmap-full-page">
      <header className="roadmap-full-header">
        <div className="roadmap-full-title">
          <div className={`avatar portrait large ${student?.avatarTone ?? "blue"}`}>
            {student?.avatar ?? "S"}
          </div>
          <div>
            <span>Roadmap Belajar</span>
            <h1>{student?.name ?? mission.studentName ?? "Siswa"}</h1>
            <p>{mission.paths.length} konsep dalam misi belajar ini</p>
          </div>
        </div>
      </header>

      <section className="roadmap-full-board">
        <RoadmapMap mission={mission} student={student} />
      </section>
    </main>
  );
}
