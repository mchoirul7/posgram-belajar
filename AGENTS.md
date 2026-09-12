# Posgram Belajar Agent Notes

## Product Scope

This application is a Web MVP for a multi-concept personal learning mission.

It only handles:
- Creating a learning mission for a student.
- Showing mission concepts and learning path steps as one journey.
- Starting learning paths inside a mission.
- Progressing through steps.
- Completing steps, paths, and the mission journey.

It does not handle:
- Weakness diagnosis.
- Mastery calculation.
- Post-test flows.
- AI generation or AI tutoring.
- Leaderboards, coins, gems, energy, shop, or other economy systems.

## Learning Model

- A `concept` is the smallest unit of learning.
- The MVP uses the `FOUNDATION` path template by default.
- A mission can target up to 5 active Matematika SD concepts.
- `learning_mission_paths.sequence` controls the concept order in the mission journey.
- Student detail data is local mock data for now.
- Mock students must use stable UUIDs.
- The mock student UUID is passed as `p_student_id` when creating missions.
- Do not create a student table or student foreign key until explicitly instructed.

## UX Mapping

Map database resource types to student-facing labels:
- `material` -> `Pahami`
- `example` -> `Lihat Contoh`
- `guided_practice` -> `Coba Bersama`
- `practice` -> `Tantangan`

Do not show raw database enums to students.

## Progress Mapping

Map database progress status to student-facing journey state:
- `completed` -> checkpoint selesai
- `in_progress` -> checkpoint aktif
- `not_started` -> checkpoint terkunci

Checkpoint behavior:
- A checkpoint can only be opened when its status is `in_progress` or `completed`.
- Locked checkpoints must remain visible but unavailable.
- Show completed checkpoints distinctly.
- Show the active checkpoint distinctly.
- Show a trophy/completion state when the path is complete.

## Database Rules

The database is the source of truth.

Do not change database schema, RLS policies, grants, or RPC definitions unless explicitly instructed.

Never run migrations or SQL containing:
- `ALTER`
- `CREATE`
- `DROP`
- `GRANT`
- `REVOKE`
- `INSERT`
- `UPDATE`
- `DELETE`

Allowed discovery/verification should be read-only.

## Supabase Runtime Rules

- Do not expose a service role or secret key to the browser.
- Do not rely on direct browser table access at runtime because RLS is enabled and no table policies are assumed.
- Use server-side actions/endpoints for path creation, path start, and step completion.
- Use existing RPCs only:
  - `create_learning_mission`
  - `create_learning_path`
  - `start_learning_path`
  - `complete_learning_step`
- Do not create `create_learning_path_web` or any other RPC unless explicitly instructed.
