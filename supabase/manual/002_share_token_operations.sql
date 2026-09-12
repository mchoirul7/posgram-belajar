-- Operasi harian share token laporan orang tua.
-- Prasyarat: 001_parent_share_token.sql sudah dijalankan.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ PERHATIAN                                                                │
-- │ Semua UPDATE di bawah sengaja DIKOMENTARI.                               │
-- │ Menjalankan file ini utuh hanya akan menampilkan daftar link, tidak      │
-- │ mengubah apa pun. Untuk mengeksekusi sebuah operasi: hapus tanda "--"    │
-- │ pada blok yang dimaksud, ganti nama siswanya, lalu jalankan blok itu     │
-- │ saja (blok, bukan seluruh file).                                         │
-- └──────────────────────────────────────────────────────────────────────────┘


-- ── Lihat semua link (aman, hanya baca) ───────────────────────────────────────
select
  p.student_name,
  p.grade_label,
  a.name as assessment_name,
  '/parent/' || p.share_token as share_path,
  case when p.share_revoked_at is null then 'aktif' else 'dicabut' end as status,
  p.share_token_rotated_at,
  p.share_revoked_at
from public.assessment_participants p
join public.assessments a on a.id = p.assessment_id
order by a.name, p.student_name;


-- ── Cabut link satu siswa (link lama langsung mati) ───────────────────────────
-- update public.assessment_participants
-- set share_revoked_at = now()
-- where student_name = 'Alfredo Akbar Jauzah'
-- returning student_name, share_revoked_at;


-- ── Putar ulang link (terbitkan token baru, link lama mati) ───────────────────
-- update public.assessment_participants
-- set
--   share_token = public.generate_share_token(),
--   share_token_rotated_at = now(),
--   share_revoked_at = null
-- where student_name = 'Alfredo Akbar Jauzah'
-- returning student_name, '/parent/' || share_token as share_path;


-- ── Aktifkan kembali link yang dicabut (token lama tetap dipakai) ─────────────
-- update public.assessment_participants
-- set share_revoked_at = null
-- where student_name = 'Alfredo Akbar Jauzah'
-- returning student_name, '/parent/' || share_token as share_path;


-- ── Aktifkan kembali SEMUA link yang dicabut (pemulihan cepat) ────────────────
-- update public.assessment_participants
-- set share_revoked_at = null
-- where share_revoked_at is not null
-- returning student_name, '/parent/' || share_token as share_path;


-- ── Cabut semua link satu ujian sekaligus (HATI-HATI: massal) ─────────────────
-- update public.assessment_participants
-- set share_revoked_at = now()
-- where assessment_id = (
--   select id from public.assessments where code = 'DIAG-MTK-SD-6A-001'
-- )
-- returning student_name, share_revoked_at;
