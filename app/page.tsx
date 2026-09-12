import { Flame, Home, Search, SlidersHorizontal, Star, Target } from "lucide-react";
import Link from "next/link";
import { mockStudents } from "@/lib/students/mock";

export default function HomePage() {
  return (
    <main className="mobile-shell">
      <div className="app-bar">
        <Home aria-hidden="true" size={18} />
        <div className="address-pill">edu.asiq.id</div>
        <span>+</span>
      </div>

      <header className="group-topbar">
        <div className="ghost-circle" />
        <h1>Kelompok Belajar</h1>
      </header>

      <section className="group-card">
        <div className="group-title">
          <div className="group-icon">📚</div>
          <div>
            <h2>Pendampingan</h2>
            <p>18 Siswa • Matematika • Kelas 9A</p>
          </div>
        </div>
        <div className="group-stats">
          <div>
            <span>🌟</span>
            <strong>60</strong>
            <small>Rata-rata Skor</small>
          </div>
          <div>
            <Target aria-hidden="true" size={28} />
            <strong>80%</strong>
            <small>Akurasi</small>
          </div>
          <div>
            <Flame aria-hidden="true" size={28} />
            <strong>4</strong>
            <small>Konsep Lemah</small>
          </div>
        </div>
      </section>

      <nav className="mock-tabs" aria-label="Kelompok belajar">
        <span>Overview</span>
        <span className="active">Daftar Murid</span>
      </nav>

      <div className="search-shell">
        <Search aria-hidden="true" size={24} />
        <span>Search</span>
        <SlidersHorizontal aria-hidden="true" size={24} />
      </div>

      <section className="student-list" aria-label="Daftar siswa">
        {mockStudents.map((student) => (
          <Link
            className="student-row"
            href={`/student/${student.id}`}
            key={student.id}
          >
            <div className={`avatar portrait ${student.avatarTone}`}>
              {student.avatar}
            </div>
            <div className="student-row-body">
              <div className="student-row-head">
                <h2>{student.name}</h2>
                <strong>{student.progressPercent}%</strong>
              </div>
              <p>Kesulitan : {student.criticalTopics.join(", ")}, dll.</p>
              <div className="thin-track">
                <span style={{ width: `${student.progressPercent}%` }} />
              </div>
            </div>
          </Link>
        ))}
      </section>

      <Star className="soft-star" aria-hidden="true" size={1} />
    </main>
  );
}
