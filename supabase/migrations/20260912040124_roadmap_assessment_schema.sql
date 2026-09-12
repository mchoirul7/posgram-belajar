create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null,
  code text not null,
  name text not null,
  grade_label text not null,
  group_name text,
  assessment_type text not null default 'diagnostic',
  status text not null default 'published',
  held_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint assessments_subject_id_fkey
    foreign key (subject_id)
    references public.subjects (id),
  constraint assessments_code_key unique (code),
  constraint assessments_assessment_type_check
    check (assessment_type in ('diagnostic', 'practice', 'exam')),
  constraint assessments_status_check
    check (status in ('draft', 'published', 'archived'))
);

create table public.assessment_participants (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null,
  student_id uuid not null,
  student_name text not null,
  grade_label text not null,
  avatar_initials text,
  avatar_tone text,
  total_score numeric(5,2),
  completion_percent numeric(5,2),
  rank_in_assessment integer,
  participant_status text not null default 'completed',
  started_at timestamp with time zone,
  submitted_at timestamp with time zone,
  last_activity_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint assessment_participants_assessment_id_fkey
    foreign key (assessment_id)
    references public.assessments (id)
    on delete cascade,
  constraint assessment_participants_assessment_student_key
    unique (assessment_id, student_id),
  constraint assessment_participants_id_assessment_student_key
    unique (id, assessment_id, student_id),
  constraint assessment_participants_avatar_tone_check
    check (
      avatar_tone is null
      or avatar_tone in ('blue', 'gray', 'green', 'rose')
    ),
  constraint assessment_participants_total_score_check
    check (total_score is null or total_score between 0 and 100),
  constraint assessment_participants_completion_percent_check
    check (
      completion_percent is null
      or completion_percent between 0 and 100
    ),
  constraint assessment_participants_rank_in_assessment_check
    check (rank_in_assessment is null or rank_in_assessment > 0),
  constraint assessment_participants_participant_status_check
    check (participant_status in ('not_started', 'in_progress', 'completed'))
);

create table public.assessment_subtopic_results (
  id uuid primary key default gen_random_uuid(),
  assessment_participant_id uuid not null,
  subtopic_id uuid not null,
  score numeric(5,2) not null,
  result_status text not null default 'weak',
  priority_order integer not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint assessment_subtopic_results_participant_id_fkey
    foreign key (assessment_participant_id)
    references public.assessment_participants (id)
    on delete cascade,
  constraint assessment_subtopic_results_subtopic_id_fkey
    foreign key (subtopic_id)
    references public.subtopics (id),
  constraint assessment_subtopic_results_participant_subtopic_key
    unique (assessment_participant_id, subtopic_id),
  constraint assessment_subtopic_results_score_check
    check (score between 0 and 100),
  constraint assessment_subtopic_results_result_status_check
    check (result_status in ('weak', 'needs_support', 'ready')),
  constraint assessment_subtopic_results_priority_order_check
    check (priority_order > 0)
);

create table public.student_roadmaps (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null,
  student_id uuid not null,
  assessment_participant_id uuid not null,
  learning_mission_id uuid,
  generation_source text not null default 'subtopic_mapping',
  status text not null default 'draft',
  generated_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint student_roadmaps_assessment_id_fkey
    foreign key (assessment_id)
    references public.assessments (id)
    on delete cascade,
  constraint student_roadmaps_participant_scope_fkey
    foreign key (assessment_participant_id, assessment_id, student_id)
    references public.assessment_participants (id, assessment_id, student_id)
    on delete cascade,
  constraint student_roadmaps_learning_mission_id_fkey
    foreign key (learning_mission_id)
    references public.learning_missions (id)
    on delete set null,
  constraint student_roadmaps_assessment_student_key
    unique (assessment_id, student_id),
  constraint student_roadmaps_learning_mission_id_key
    unique (learning_mission_id),
  constraint student_roadmaps_generation_source_check
    check (
      generation_source in (
        'subtopic_mapping',
        'manual',
        'direct_concept_result'
      )
    ),
  constraint student_roadmaps_status_check
    check (
      status in ('draft', 'generated', 'in_progress', 'completed', 'cancelled')
    )
);

create table public.student_roadmap_targets (
  id uuid primary key default gen_random_uuid(),
  student_roadmap_id uuid not null,
  concept_id uuid not null,
  source_assessment_subtopic_result_id uuid,
  priority_order integer not null,
  source text not null,
  created_at timestamp with time zone not null default now(),
  constraint student_roadmap_targets_roadmap_id_fkey
    foreign key (student_roadmap_id)
    references public.student_roadmaps (id)
    on delete cascade,
  constraint student_roadmap_targets_concept_id_fkey
    foreign key (concept_id)
    references public.concepts (id),
  constraint student_roadmap_targets_source_subtopic_result_id_fkey
    foreign key (source_assessment_subtopic_result_id)
    references public.assessment_subtopic_results (id),
  constraint student_roadmap_targets_roadmap_concept_key
    unique (student_roadmap_id, concept_id),
  constraint student_roadmap_targets_roadmap_priority_key
    unique (student_roadmap_id, priority_order),
  constraint student_roadmap_targets_priority_order_check
    check (priority_order > 0),
  constraint student_roadmap_targets_source_check
    check (source in ('subtopic_mapping', 'direct_concept_result', 'manual')),
  constraint student_roadmap_targets_subtopic_mapping_source_check
    check (
      source <> 'subtopic_mapping'
      or source_assessment_subtopic_result_id is not null
    )
);

create index idx_assessments_subject_id
  on public.assessments (subject_id);

create index idx_assessments_status_held_at
  on public.assessments (status, held_at desc);

create index idx_assessment_participants_student_id
  on public.assessment_participants (student_id);

create index idx_assessment_subtopic_results_participant_priority
  on public.assessment_subtopic_results (
    assessment_participant_id,
    priority_order
  );

create index idx_assessment_subtopic_results_subtopic_id
  on public.assessment_subtopic_results (subtopic_id);

create index idx_student_roadmaps_assessment_participant_id
  on public.student_roadmaps (assessment_participant_id);

create index idx_student_roadmap_targets_concept_id
  on public.student_roadmap_targets (concept_id);

create index idx_student_roadmap_targets_source_result
  on public.student_roadmap_targets (
    source_assessment_subtopic_result_id
  );

alter table public.assessments enable row level security;
alter table public.assessment_participants enable row level security;
alter table public.assessment_subtopic_results enable row level security;
alter table public.student_roadmaps enable row level security;
alter table public.student_roadmap_targets enable row level security;
