import {
  CheckCircle2,
  Clock3,
  Flame,
  Home,
  Map,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ParentShareButton } from "@/components/parent-share-button";
import { StudentTabs } from "@/components/student/student-tabs";
import { PendingLink } from "@/components/ui/pending-link";
import {
  getParticipantDetail,
  getParticipantShareHref
} from "@/lib/assessments/data";
import { summarizeMissionProgress } from "@/lib/learning/roadmap";
import { getMockStudent } from "@/lib/students/mock";

type StudentPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

const conceptIcons = ["📊", "🧮", "💯", "📐", "🔢"];
const conceptColors = ["#ff4152", "#ff9700", "#2f7bff", "#16a34a", "#7c6bff"];

/** Class drives the existing badge colours; label is what the teacher reads. */
const roadmapStatusClasses: Record<string, string> = {
  completed: "selesai",
  in_progress: "aktif",
  not_started: "locked"
};

const roadmapStatusLabels: Record<string, string> = {
  completed: "selesai",
  in_progress: "aktif",
  not_started: "belum dibuka"
};

function formatLastActivity(value: string | null) {
  if (!value) {
    return null;
  }

  const completedAt = new Date(value);
  const days = Math.floor(
    (Date.now() - completedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days <= 0) {
    return "hari ini";
  }

  if (days === 1) {
    return "kemarin";
  }

  if (days < 7) {
    return `${days} hari lalu`;
  }

  return completedAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default async function StudentPage({ params }: StudentPageProps) {
  const { studentId } = await params;
  const participant = await getParticipantDetail(studentId);
  const mock = getMockStudent(studentId);

  if (!participant && !mock) {
    notFound();
  }

  const name = participant?.studentName ?? mock?.name ?? "Siswa";
  const avatarInitials = participant?.avatarInitials ?? mock?.avatar ?? "S";
  const avatarTone = participant?.avatarTone ?? mock?.avatarTone ?? "blue";
  const shareHref = participant ? getParticipantShareHref(participant) : null;
  const weaknesses = participant?.weaknesses ?? [];
  const progress = participant?.mission
    ? summarizeMissionProgress(participant.mission)
    : null;
  const lastActivity = formatLastActivity(progress?.lastActivityAt ?? null);
  const missionId = participant?.roadmap?.learningMissionId ?? null;
  const hasRoadmap = Boolean(missionId && progress);

  const overview = (
    <section className="tab-panel-body">
      <div className="section-head">
        <h2 className="section-title">Konsep yang masih lemah</h2>
        {participant?.assessment ? (
          <span className="section-note">{participant.assessment.name}</span>
        ) : null}
      </div>

      <section className="critical-list">
        {weaknesses.map((weakness, index) => (
          <article className="critical-card" key={weakness.id}>
            <span className="critical-icon">
              {conceptIcons[index % conceptIcons.length]}
            </span>
            <div>
              <div className="critical-head">
                <strong>{weakness.subtopicName}</strong>
                <small>{weakness.score}%</small>
              </div>
              <p>Area : {weakness.topicName}</p>
              <div className="thin-track">
                <span
                  style={{
                    background: conceptColors[index % conceptColors.length],
                    width: `${weakness.score}%`
                  }}
                />
              </div>
            </div>
          </article>
        ))}

        {weaknesses.length === 0 ? (
          <p className="progress-empty">
            Belum ada hasil kelemahan dari ujian terakhir.
          </p>
        ) : null}
      </section>

      {shareHref ? (
        <div className="detail-action-row">
          <ParentShareButton
            assessmentName={participant?.assessment.name}
            href={shareHref}
            studentName={name}
          />
        </div>
      ) : null}
    </section>
  );

  const roadmap = (
    <section className="tab-panel-body">
      {hasRoadmap && progress ? (
        <section className="progress-panel" aria-label="Progress roadmap belajar">
          <div className="progress-panel-head">
            <div>
              <span>Progress Belajar</span>
              <h2>Roadmap di rumah</h2>
            </div>
            <strong className="progress-panel-percent">
              {progress.percent}%
            </strong>
          </div>

          <div className="progress-bar-row">
            <div className="thin-track">
              <span style={{ width: `${progress.percent}%` }} />
            </div>
            <small>
              {progress.completed}/{progress.total} checkpoint
            </small>
          </div>

          <p className="progress-meta">
            <Clock3 aria-hidden="true" size={15} />
            {lastActivity
              ? `Terakhir belajar ${lastActivity}`
              : "Belum ada checkpoint yang diselesaikan"}
          </p>

          <ul className="progress-concept-list">
            {progress.concepts.map((concept, index) => (
              <li className="progress-concept" key={concept.id}>
                <div className="progress-concept-head">
                  <strong>{concept.name}</strong>
                  <span
                    className={`status-badge ${roadmapStatusClasses[concept.status]}`}
                  >
                    {roadmapStatusLabels[concept.status]}
                  </span>
                </div>
                <div className="thin-track">
                  <span
                    style={{
                      background: conceptColors[index % conceptColors.length],
                      width: `${concept.percent}%`
                    }}
                  />
                </div>
                <small>
                  {concept.completed}/{concept.total} checkpoint selesai
                </small>
              </li>
            ))}
          </ul>

          <PendingLink
            className="button"
            href={`/mission/${missionId}`}
            icon={<Map aria-hidden="true" size={18} />}
            pendingLabel="Membuka roadmap…"
          >
            Lihat Roadmap Lengkap
          </PendingLink>
        </section>
      ) : (
        <section className="roadmap-empty-panel">
          <span className="roadmap-empty-icon">
            <Map aria-hidden="true" size={30} />
          </span>
          <h2>Belum ada roadmap belajar</h2>
          <p>
            Orang tua belum menjalankan roadmap pembelajaran untuk {name}.
            Bagikan link laporannya supaya roadmap bisa dibuat dan dikerjakan di
            rumah.
          </p>
          {shareHref ? (
            <ParentShareButton
              assessmentName={participant?.assessment.name}
              className="share-parent-button"
              href={shareHref}
              label="Buat Roadmap"
              studentName={name}
            />
          ) : (
            <p className="progress-empty">
              Siswa ini belum terdaftar pada ujian mana pun, jadi roadmap belum
              bisa dibuat.
            </p>
          )}
        </section>
      )}
    </section>
  );

  return (
    <main className="mobile-shell detail-page">
      <div className="app-bar">
        <Link href="/">
          <Home aria-hidden="true" size={18} />
        </Link>
        <div className="address-pill">edu.asiq.id</div>
        <span>+</span>
      </div>

      <section className="detail-hero">
        <div className="hero-grid" />
        <Link
          aria-label="Kembali ke daftar siswa"
          className="detail-back-button"
          href="/"
        >
          ←
        </Link>
        <h1>Detail Siswa</h1>
        <div className="profile-avatar-ring">
          <div className={`avatar portrait large ${avatarTone}`}>
            {avatarInitials}
          </div>
        </div>
        <h2>{name}</h2>
      </section>

      <section className="student-stat-card" aria-label="Ringkasan siswa">
        <div>
          <span>🌟</span>
          <strong>{participant?.totalScore ?? "—"}</strong>
          <small>Rata-rata Skor</small>
        </div>
        <div>
          <CheckCircle2 aria-hidden="true" size={30} />
          <strong>
            {participant?.completionPercent !== null &&
            participant?.completionPercent !== undefined
              ? `${participant.completionPercent}%`
              : "—"}
          </strong>
          <small>Ketuntasan Ujian</small>
        </div>
        <div>
          <Flame aria-hidden="true" size={30} />
          <strong>{participant?.weaknessCount ?? 0}</strong>
          <small>Konsep Lemah</small>
        </div>
        <div>
          <Trophy aria-hidden="true" size={30} />
          <strong>{participant?.rankInAssessment ?? "—"}</strong>
          <small>Ranking</small>
        </div>
      </section>

      <StudentTabs
        overview={overview}
        roadmap={roadmap}
        roadmapBadge={hasRoadmap && progress ? `${progress.percent}%` : undefined}
      />
    </main>
  );
}
