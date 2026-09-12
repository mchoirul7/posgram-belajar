-- Parent report share tokens
--
-- Dijalankan manual di Supabase SQL Editor. File ini SENGAJA tidak diletakkan
-- di supabase/migrations/ supaya tidak ikut ter-apply oleh `supabase db push`.
--
-- Tujuan: memberi link laporan orang tua sebuah token yang bisa DICABUT dan
-- DIPUTAR ULANG, tanpa mengubah bentuk URL yang sekarang sudah dipakai.
--
-- Saat ini token = assessment_participants.id yang dikemas base64url. Aman
-- (122 bit acak) tapi tidak bisa dicabut: kalau link bocor, satu-satunya cara
-- menutupnya adalah menghapus baris peserta. Setelah skrip ini dijalankan,
-- token jadi kolom tersendiri yang bisa diganti kapan saja.
--
-- Aman diulang (idempoten) dan tidak menyentuh data yang sudah ada selain
-- mengisi kolom baru.

begin;

-- 1. Generator token: 16 byte acak -> base64url 22 karakter.
--    Bentuknya identik dengan token yang dipakai frontend sekarang, jadi
--    format URL tidak berubah: /parent/DUOKGMoLR8Kasy-rddiMdA
--    Hanya memakai fungsi bawaan Postgres, tidak butuh pgcrypto.
create or replace function public.generate_share_token()
returns text
language sql
volatile
as $$
  select rtrim(
    translate(
      encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'),
      '+/',
      '-_'
    ),
    '='
  );
$$;

-- 2. Kolom token pada peserta ujian.
alter table public.assessment_participants
  add column if not exists share_token text,
  add column if not exists share_token_rotated_at timestamp with time zone,
  add column if not exists share_revoked_at timestamp with time zone;

-- 3. Isi token untuk peserta yang sudah ada.
update public.assessment_participants
set
  share_token = public.generate_share_token(),
  share_token_rotated_at = now()
where share_token is null;

-- 4. Kunci: wajib ada, unik, dan otomatis terisi untuk peserta baru.
alter table public.assessment_participants
  alter column share_token set not null,
  alter column share_token set default public.generate_share_token();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.assessment_participants'::regclass
      and conname = 'assessment_participants_share_token_key'
  ) then
    alter table public.assessment_participants
      add constraint assessment_participants_share_token_key unique (share_token);
  end if;
end
$$;

commit;

-- 5. Verifikasi: setiap peserta punya token unik sepanjang 22 karakter.
select
  student_name,
  grade_label,
  share_token,
  length(share_token) as token_length,
  share_revoked_at,
  '/parent/' || share_token as share_path
from public.assessment_participants
order by student_name;
