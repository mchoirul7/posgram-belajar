import {
  BookOpenCheck,
  CheckCircle2,
  Flame,
  Home,
  Map,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createLearningMissionAction } from "@/app/actions";
import {
  getParticipantDetailByShareToken,
  getTargetWeaknesses
} from "@/lib/assessments/data";

type ParentReportPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

function formatHeldAt(heldAt: string | null) {
  if (!heldAt) {
    return null;
  }

  return new Date(heldAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export default async function ParentReportPage({
  params,
  searchParams
}: ParentReportPageProps) {
  const { token } = await params;
  const query = await searchParams;
  const participant = await getParticipantDetailByShareToken(token);

  if (!participant) {
    notFound();
  }

  const targets = getTargetWeaknesses(participant);
  const roadmap = participant.roadmap;
  const heldAt = formatHeldAt(participant.assessment.heldAt);
  const returnTo = `/parent/${token}`;

  return (
    <main className="parent-share-page">
      <header className="parent-share-hero">
        <nav className="parent-share-nav" aria-label="Navigasi laporan">
          <span />
          <Link href="/" aria-label="Beranda">
            <Home aria-hidden="true" size={18} />
          </Link>
        </nav>
        <div className={`avatar portrait large ${participant.avatarTone}`}>
          {participant.avatarInitials}
        </div>
        <p>Laporan Orang Tua</p>
        <h1>{participant.studentName}</h1>
        <span>{participant.gradeLabel}</span>
      </header>

      <section className="parent-share-content">
        <section className="parent-report-panel" aria-label="Informasi ujian">
          <div className="parent-report-icon">
            <BookOpenCheck aria-hidden="true" size={30} />
          </div>
          <div>
            <span>Ujian diikuti</span>
            <h2>{participant.assessment.name}</h2>
            <p>
              {heldAt ? `Dilaksanakan ${heldAt}. ` : ""}
              Hasil awal menunjukkan beberapa konsep perlu didampingi dalam
              roadmap belajar personal.
            </p>
          </div>
        </section>

        <section
          className="parent-concepts-panel"
          aria-label="Konsep yang perlu pendampingan"
        >
          <div className="parent-section-head">
            <div>
              <span>Fokus Belajar</span>
              <h2>Konsep yang perlu pendampingan</h2>
            </div>
            <strong>{targets.length} konsep</strong>
          </div>

          {targets.length > 0 ? (
            <div className="parent-concept-grid">
              {targets.map(({ target, weakness }) => (
                <article className="parent-concept-card" key={target.id}>
                  <div className="parent-concept-head">
                    <Flame aria-hidden="true" size={20} />
                    <strong>{weakness ? `${weakness.score}%` : "—"}</strong>
                  </div>
                  <h3>{target.conceptName}</h3>
                  <p>{weakness?.subtopicName ?? target.conceptCode}</p>
                  <div className="thin-track">
                    <span style={{ width: `${weakness?.score ?? 0}%` }} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="parent-empty-copy">
              Belum ada konsep yang ditandai untuk pendampingan pada ujian ini.
            </p>
          )}
        </section>

        <section className="parent-roadmap-panel" aria-label="Roadmap belajar">
          {query?.error ? <div className="alert">{query.error}</div> : null}

          <div className="parent-roadmap-copy">
            <Sparkles aria-hidden="true" size={30} />
            <div>
              <h2>Roadmap Belajar</h2>
              <p>
                Roadmap disusun dari konsep lemah siswa dan template FOUNDATION.
              </p>
            </div>
          </div>

          {roadmap?.learningMissionId ? (
            <Link
              className="generate-button"
              href={`/mission/${roadmap.learningMissionId}`}
            >
              <Map aria-hidden="true" size={18} />
              Buka Roadmap Belajar
            </Link>
          ) : roadmap && targets.length > 0 ? (
            <form action={createLearningMissionAction}>
              <input name="studentId" type="hidden" value={participant.studentId} />
              <input name="roadmapId" type="hidden" value={roadmap.id} />
              <input name="returnTo" type="hidden" value={returnTo} />
              <button className="generate-button" type="submit">
                <CheckCircle2 aria-hidden="true" size={18} />
                Generate Roadmap
              </button>
            </form>
          ) : (
            <p className="parent-empty-copy">
              Roadmap belajar belum tersedia untuk ujian ini.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
