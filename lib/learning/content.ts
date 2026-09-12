import type { ResourceType } from "./labels";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonRecord = { [key: string]: JsonValue };

/**
 * Bar-chart style context shared by `example`, `guided_practice`, and
 * `practice` resources in schema version 3.
 */
export type DataContextValue = {
  category: string;
  value: number;
};

export type DataContext = {
  title?: string;
  scale?: number;
  values: DataContextValue[];
};

/**
 * One block inside a `material` resource. `type` drives the visual treatment
 * (`concept`, `example`, `misconception`, `quick_check`, `strategy`,
 * `summary`, plus the legacy `text`), while every field stays optional so an
 * unfamiliar block still renders whatever it carries.
 */
export type CheckpointSection = {
  type: string;
  title?: string;
  body?: string;
  keyPoint?: string;
  formula?: string;
  example?: string;
  note?: string;
  question?: string;
  answer?: string;
  explanation?: string;
  items: string[];
};

export type WorkedExample = {
  title?: string;
  problem?: string;
  steps: string[];
  answer?: string;
  why?: string;
  explanation?: string;
  misconceptionTarget?: string;
};

export type CheckpointOption = {
  id: string;
  text: string;
};

export type CheckpointQuestion = {
  id: string;
  type: string;
  difficulty?: string;
  question: string;
  options: CheckpointOption[];
  hint?: string;
  answer?: string;
  explanation?: string;
  misconceptionTarget?: string;
};

export type MaterialContent = {
  kind: "material";
  title?: string;
  subtitle?: string;
  intro?: string;
  reinforcementFocus: string[];
  prerequisiteCheck: string[];
  coreIdea?: { title?: string; body?: string };
  dataContext: DataContext | null;
  sections: CheckpointSection[];
};

export type ExampleContent = {
  kind: "example";
  title?: string;
  intro?: string;
  takeaway?: string;
  dataContext: DataContext | null;
  workedExamples: WorkedExample[];
};

export type QuestionSetContent = {
  kind: "questionSet";
  mode: "guided_practice" | "practice";
  title?: string;
  intro?: string;
  instructions?: string;
  completionMessage?: string;
  dataContext: DataContext | null;
  questions: CheckpointQuestion[];
};

/** Schema version 1 shapes: `{ body, format }`, `{ items }`, `{ instructions }`. */
export type LegacyItem = {
  question?: string;
  answer?: string;
  explanation?: string;
};

export type LegacyContent = {
  kind: "legacy";
  title?: string;
  intro?: string;
  instructions?: string;
  paragraphs: string[];
  items: LegacyItem[];
};

export type UnknownContent = {
  kind: "unknown";
  keys: string[];
};

export type CheckpointContent =
  | MaterialContent
  | ExampleContent
  | QuestionSetContent
  | LegacyContent
  | UnknownContent;

export type LearningResource = {
  id: string;
  title: string;
  resourceType: ResourceType;
  difficulty: string;
  content: CheckpointContent | null;
  estimatedMinutes: number | null;
  status: string;
};

function isRecord(value: JsonValue | undefined): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return undefined;
}

function readNumber(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readStringList(record: JsonRecord, key: string): string[] {
  const value = record[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim();
      }

      if (typeof entry === "number") {
        return String(entry);
      }

      if (isRecord(entry)) {
        return (
          readString(entry, "text") ??
          readString(entry, "body") ??
          readString(entry, "title") ??
          ""
        );
      }

      return "";
    })
    .filter(Boolean);
}

function readRecordList(record: JsonRecord, key: string): JsonRecord[] {
  const value = record[key];
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function parseDataContext(record: JsonRecord): DataContext | null {
  const raw = record.data_context;

  if (!isRecord(raw)) {
    return null;
  }

  const values = readRecordList(raw, "values")
    .map((entry) => ({
      category:
        readString(entry, "category") ?? readString(entry, "label") ?? "",
      value: readNumber(entry, "value") ?? 0
    }))
    .filter((entry) => entry.category);

  const title = readString(raw, "title");

  if (values.length === 0 && !title) {
    return null;
  }

  return {
    title,
    scale: readNumber(raw, "scale"),
    values
  };
}

function parseSection(record: JsonRecord): CheckpointSection {
  return {
    type: readString(record, "type") ?? "concept",
    title: readString(record, "title"),
    body: readString(record, "body"),
    keyPoint: readString(record, "key_point"),
    formula: readString(record, "formula"),
    example: readString(record, "example"),
    note: readString(record, "note"),
    question: readString(record, "question"),
    answer: readString(record, "answer"),
    explanation: readString(record, "explanation"),
    items: readStringList(record, "items")
  };
}

function hasSectionBody(section: CheckpointSection): boolean {
  return Boolean(
    section.title ||
      section.body ||
      section.keyPoint ||
      section.formula ||
      section.example ||
      section.note ||
      section.question ||
      section.answer ||
      section.explanation ||
      section.items.length
  );
}

function parseWorkedExample(record: JsonRecord): WorkedExample {
  return {
    title: readString(record, "title"),
    problem: readString(record, "problem"),
    steps: readStringList(record, "steps"),
    answer: readString(record, "answer"),
    why: readString(record, "why"),
    explanation: readString(record, "explanation"),
    misconceptionTarget: readString(record, "misconception_target")
  };
}

function parseQuestion(record: JsonRecord, index: number): CheckpointQuestion {
  const options = readRecordList(record, "options")
    .map((option, optionIndex) => ({
      id: readString(option, "id") ?? String(optionIndex),
      text: readString(option, "text") ?? readString(option, "label") ?? ""
    }))
    .filter((option) => option.text);

  return {
    id: readString(record, "id") ?? `q-${index + 1}`,
    type: readString(record, "type") ?? (options.length ? "single" : "open"),
    difficulty: readString(record, "difficulty"),
    question: readString(record, "question") ?? "",
    options,
    hint: readString(record, "hint"),
    answer: readString(record, "answer"),
    explanation: readString(record, "explanation"),
    misconceptionTarget: readString(record, "misconception_target")
  };
}

function decodeHtml(value: string): string {
  return value
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

export function toParagraphs(value: string, format?: string): string[] {
  const plain =
    format === "html" || /<\/?[a-z][^>]*>/i.test(value)
      ? decodeHtml(
          value
            .replace(/<\/p>/gi, "\n")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]*>/g, "")
        )
      : value;

  return plain
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseLegacy(record: JsonRecord): LegacyContent {
  const body = readString(record, "body");
  const format = readString(record, "format");
  const items = readRecordList(record, "items")
    .map((item) => ({
      question: readString(item, "question"),
      answer: readString(item, "answer"),
      explanation: readString(item, "explanation")
    }))
    .filter((item) => item.question || item.answer || item.explanation);

  return {
    kind: "legacy",
    title: readString(record, "title"),
    intro: readString(record, "intro"),
    instructions: readString(record, "instructions"),
    paragraphs: body ? toParagraphs(body, format) : [],
    items
  };
}

function toQuestionMode(
  contentType: string | undefined,
  resourceType: ResourceType | undefined
): "guided_practice" | "practice" {
  if (contentType === "guided_practice" || resourceType === "guided_practice") {
    return "guided_practice";
  }

  return "practice";
}

/**
 * Parses a `learning_resources.content` blob into a renderable shape.
 *
 * Dispatch is shape-first (`questions`, `worked_examples`, `sections`, ...) so
 * a resource still renders when `content_type` is missing or unexpected; the
 * database stays the source of truth and nothing is rewritten here. Returns
 * `{ kind: "unknown" }` only when the blob carries no field this app knows,
 * and `null` only when the column itself is empty.
 */
export function parseCheckpointContent(
  content: JsonValue | undefined,
  resourceType?: ResourceType
): CheckpointContent | null {
  if (!isRecord(content)) {
    return null;
  }

  const contentType = readString(content, "content_type");
  const dataContext = parseDataContext(content);

  const questions = readRecordList(content, "questions")
    .map(parseQuestion)
    .filter((question) => question.question || question.options.length);

  if (questions.length > 0) {
    return {
      kind: "questionSet",
      mode: toQuestionMode(contentType, resourceType),
      title: readString(content, "title"),
      intro: readString(content, "intro"),
      instructions: readString(content, "instructions"),
      completionMessage: readString(content, "completion_message"),
      dataContext,
      questions
    };
  }

  const workedExamples = readRecordList(content, "worked_examples").map(
    parseWorkedExample
  );

  if (workedExamples.length > 0) {
    return {
      kind: "example",
      title: readString(content, "title"),
      intro: readString(content, "intro"),
      takeaway: readString(content, "takeaway"),
      dataContext,
      workedExamples
    };
  }

  const coreIdeaRaw = content.core_idea;
  const coreIdea = isRecord(coreIdeaRaw)
    ? {
        title: readString(coreIdeaRaw, "title"),
        body: readString(coreIdeaRaw, "body")
      }
    : undefined;
  const sections = readRecordList(content, "sections")
    .map(parseSection)
    .filter(hasSectionBody);
  const intro = readString(content, "intro");
  const reinforcementFocus = readStringList(content, "reinforcement_focus");
  const prerequisiteCheck = readStringList(content, "prerequisite_check");

  if (
    sections.length > 0 ||
    coreIdea ||
    reinforcementFocus.length > 0 ||
    prerequisiteCheck.length > 0 ||
    (intro && contentType === "material")
  ) {
    return {
      kind: "material",
      title: readString(content, "title"),
      subtitle: readString(content, "subtitle"),
      intro,
      reinforcementFocus,
      prerequisiteCheck,
      coreIdea:
        coreIdea && (coreIdea.title || coreIdea.body) ? coreIdea : undefined,
      dataContext,
      sections
    };
  }

  const legacy = parseLegacy(content);

  if (
    legacy.paragraphs.length > 0 ||
    legacy.items.length > 0 ||
    legacy.intro ||
    legacy.instructions
  ) {
    return legacy;
  }

  return { kind: "unknown", keys: Object.keys(content) };
}
