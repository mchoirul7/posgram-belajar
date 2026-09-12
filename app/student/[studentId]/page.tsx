import {
  CheckCircle2,
  Flame,
  Home,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ParentShareButton } from "@/components/parent-share-button";
import { getParticipantDetail, getParticipantShareHref } from "@/lib/assessments/data";
import { getMockStudent } from "@/lib/students/mock";

type StudentPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

const criticalTopics = [
  ["📊", "Interpretasi Grafik", "69%", "#ff4152"],
  ["🧮", "Operasi Hitung Campuran", "74%", "#ff9700"],
  ["💯", "Persentase", "81%", "#2f7bff"]
];

function StudentHero({ student }: {
  student: NonNullable<ReturnType<typeof getMockStudent>>;
}) {
  return (
    <>
      <section className="detail-hero">
        <div className="hero-grid" />
        <Link className="detail-back-button" href="/" aria-label="Kembali ke daftar siswa">
          ←
        </Link>
        <h1>Detail Siswa</h1>
        <div className="profile-avatar-ring">
          <div className={`avatar portrait large ${student.avatarTone}`}>
            {student.avatar}
          </div>
        </div>
        <h2>{student.name}</h2>
      </section>

      <section className="student-stat-card" aria-label="Ringkasan siswa">
        <div>
          <span>🌟</span>
          <strong>40</strong>
          <small>Rata-rata Skor</small>
        </div>
        <div>
          <CheckCircle2 aria-hidden="true" size={30} />
          <strong>100%</strong>
          <small>Ketuntasan</small>
        </div>
        <div>
          <Flame aria-hidden="true" size={30} />
          <strong>3</strong>
          <small>Konsep Lemah</small>
        </div>
        <div>
          <Trophy aria-hidden="true" size={30} />
          <strong>26</strong>
          <small>Ranking</small>
        </div>
      </section>
    </>
  );
}

export default async function StudentPage({ params }: StudentPageProps) {
  const { studentId } = await params;
  const student = getMockStudent(studentId);

  if (!student) {
    notFound();
  }

  const participant = await getParticipantDetail(studentId);
  const parentShareHref = participant ? getParticipantShareHref(participant) : null;

  return (
    <main className="mobile-shell detail-page">
      <div className="app-bar">
        <Link href="/">
          <Home aria-hidden="true" size={18} />
        </Link>
        <div className="address-pill">edu.asiq.id</div>
        <span>+</span>
      </div>

      <StudentHero student={student} />

      <section className="overview-screen">
        {parentShareHref ? (
          <div className="detail-action-row">
            <ParentShareButton
              href={parentShareHref}
              studentName={student.name}
            />
          </div>
        ) : null}

        <div className="section-head">
          <h2 className="section-title">Konsep yang masih lemah</h2>
          <span>Lihat Semua</span>
        </div>
        <section className="critical-list">
          {student.weakConcepts.map((concept, index) => (
            <article className="critical-card" key={concept.code}>
              <span className="critical-icon">
                {criticalTopics[index]?.[0] ?? "📘"}
              </span>
              <div>
                <div className="critical-head">
                  <strong>{concept.name}</strong>
                  <small>{concept.score}%</small>
                </div>
                <p>Area : {concept.area}</p>
                <div className="thin-track">
                  <span
                    style={{
                      background: criticalTopics[index]?.[3] ?? "#2f7bff",
                      width: `${concept.score}%`
                    }}
                  />
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
