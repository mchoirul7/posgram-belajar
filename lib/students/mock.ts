import "server-only";

export type MockStudent = {
  id: string;
  name: string;
  avatar: string;
  avatarTone: "blue" | "gray" | "green" | "rose";
  grade: string;
  criticalTopics: string[];
  weakConceptCodes: string[];
  weakConcepts: Array<{
    code: string;
    name: string;
    score: number;
    area: string;
  }>;
  progressPercent: number;
  activeMissionCount: number;
  lastActivity: string;
  overview: {
    focus: string;
    strengths: string[];
    needsSupport: string[];
    weeklyTarget: string;
  };
};

export const mockStudents: MockStudent[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Alfredo Akbar Jauzah",
    avatar: "AA",
    avatarTone: "blue",
    grade: "Kelas 9A",
    criticalTopics: ["Bangun Ruang", "Aljabar"],
    weakConceptCodes: ["BIL-BR-02-K1", "BIL-BR-02-K2", "GPK-OG-02-K1"],
    weakConcepts: [
      {
        code: "BIL-BR-02-K1",
        name: "Perbandingan dua pecahan",
        score: 69,
        area: "Bilangan Rasional"
      },
      {
        code: "BIL-BR-02-K2",
        name: "Pengurutan beberapa pecahan",
        score: 74,
        area: "Bilangan Rasional"
      },
      {
        code: "GPK-OG-02-K1",
        name: "Visualisasi tampak depan/atas/samping",
        score: 81,
        area: "Objek Geometri"
      }
    ],
    progressPercent: 40,
    activeMissionCount: 0,
    lastActivity: "Hari ini",
    overview: {
      focus: "Meningkatkan konsistensi pada Aljabar Linear dan Geometri Ruang.",
      strengths: ["Cepat memahami pola", "Aktif menyelesaikan latihan"],
      needsSupport: ["Interpretasi grafik", "Operasi hitung campuran"],
      weeklyTarget: "Selesaikan roadmap konsep lemah minggu ini."
    }
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Budi Santoso",
    avatar: "BS",
    avatarTone: "gray",
    grade: "Kelas 9A",
    criticalTopics: ["Statistika", "Geometri"],
    weakConceptCodes: ["BIL-BR-04-K1", "BIL-BR-04-K3", "GPK-OG-01-K2"],
    weakConcepts: [
      {
        code: "BIL-BR-04-K1",
        name: "Penjumlahan bilangan cacah",
        score: 60,
        area: "Operasi Hitung"
      },
      {
        code: "BIL-BR-04-K3",
        name: "Perkalian bilangan cacah",
        score: 66,
        area: "Operasi Hitung"
      },
      {
        code: "GPK-OG-01-K2",
        name: "Sifat segiempat",
        score: 72,
        area: "Objek Geometri"
      }
    ],
    progressPercent: 60,
    activeMissionCount: 0,
    lastActivity: "Kemarin",
    overview: {
      focus: "Memperkuat urutan operasi hitung dan tanda bilangan.",
      strengths: ["Percaya diri mencoba soal", "Konsisten menyelesaikan latihan"],
      needsSupport: ["Mengecek ulang langkah", "Membedakan tanda positif/negatif"],
      weeklyTarget: "Latihan 3 checkpoint operasi hitung."
    }
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Citra Dewi",
    avatar: "CD",
    avatarTone: "green",
    grade: "Kelas 9A",
    criticalTopics: ["Kalkulus", "Trigonometri"],
    weakConceptCodes: ["BIL-BR-03-K1", "BIL-BR-03-K2", "GPK-PK-02-K1"],
    weakConcepts: [
      {
        code: "BIL-BR-03-K1",
        name: "Konversi pecahan ke desimal",
        score: 58,
        area: "Bilangan Rasional"
      },
      {
        code: "BIL-BR-03-K2",
        name: "Konversi pecahan ke persen",
        score: 63,
        area: "Bilangan Rasional"
      },
      {
        code: "GPK-PK-02-K1",
        name: "Konversi satuan besar ke kecil",
        score: 70,
        area: "Pengukuran"
      }
    ],
    progressPercent: 25,
    activeMissionCount: 0,
    lastActivity: "2 hari lalu",
    overview: {
      focus: "Menghubungkan bentuk pecahan, desimal, dan persen.",
      strengths: ["Rapi menulis proses", "Mau bertanya saat bingung"],
      needsSupport: ["Konversi bentuk bilangan", "Membaca konteks cerita"],
      weeklyTarget: "Mulai roadmap konversi bilangan."
    }
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Eka Lestari",
    avatar: "EL",
    avatarTone: "rose",
    grade: "Kelas 9A",
    criticalTopics: ["Teori Bilangan", "Kombinatorik"],
    weakConceptCodes: ["BIL-BR-06-K1", "BIL-BR-06-K2", "BIL-BR-06-K3"],
    weakConcepts: [
      {
        code: "BIL-BR-06-K1",
        name: "Kelipatan bilangan",
        score: 62,
        area: "Bilangan Rasional"
      },
      {
        code: "BIL-BR-06-K2",
        name: "Faktor bilangan",
        score: 67,
        area: "Bilangan Rasional"
      },
      {
        code: "BIL-BR-06-K3",
        name: "KPK",
        score: 73,
        area: "Bilangan Rasional"
      }
    ],
    progressPercent: 40,
    activeMissionCount: 0,
    lastActivity: "3 hari lalu",
    overview: {
      focus: "Memperkuat konsep dasar kombinatorik dan pola bilangan.",
      strengths: ["Konsisten mengikuti kelas", "Rapi mencatat rumus"],
      needsSupport: ["Membuat strategi soal", "Mengurangi tebakan"],
      weeklyTarget: "Bangun roadmap latihan teori bilangan."
    }
  }
];

export function getMockStudent(studentId: string): MockStudent | null {
  return mockStudents.find((student) => student.id === studentId) ?? null;
}
