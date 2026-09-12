import { CheckpointQuestions } from "@/components/checkpoint/checkpoint-questions";
import { DataContextPanel } from "@/components/checkpoint/data-context-panel";
import { MaterialSection } from "@/components/checkpoint/material-sections";
import { WorkedExampleCard } from "@/components/checkpoint/worked-examples";
import type {
  CheckpointContent,
  ExampleContent,
  LegacyContent,
  LearningResource,
  MaterialContent,
  QuestionSetContent
} from "@/lib/learning/content";

function EmptyContent() {
  return (
    <div className="resource-content">
      <p>Konten checkpoint belum tersedia.</p>
    </div>
  );
}

function MaterialView({ content }: { content: MaterialContent }) {
  return (
    <div className="resource-content checkpoint-material">
      {content.subtitle ? (
        <p className="checkpoint-subtitle-line">{content.subtitle}</p>
      ) : null}

      {content.intro ? <p className="checkpoint-intro">{content.intro}</p> : null}

      {content.prerequisiteCheck.length > 0 ? (
        <section className="checkpoint-callout prerequisite">
          <p className="checkpoint-callout-title">Sebelum mulai, ingat ini</p>
          <ul>
            {content.prerequisiteCheck.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {content.reinforcementFocus.length > 0 ? (
        <section className="checkpoint-callout focus">
          <p className="checkpoint-callout-title">Fokus latihan</p>
          <ul>
            {content.reinforcementFocus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {content.coreIdea ? (
        <section className="checkpoint-core-idea">
          <p className="checkpoint-callout-title">
            {content.coreIdea.title ?? "Ide utama"}
          </p>
          {content.coreIdea.body ? <p>{content.coreIdea.body}</p> : null}
        </section>
      ) : null}

      {content.dataContext ? (
        <DataContextPanel dataContext={content.dataContext} />
      ) : null}

      {content.sections.map((section, index) => (
        <MaterialSection key={`${section.type}-${index}`} section={section} />
      ))}
    </div>
  );
}

function ExampleView({ content }: { content: ExampleContent }) {
  return (
    <div className="resource-content checkpoint-example">
      {content.intro ? <p className="checkpoint-intro">{content.intro}</p> : null}

      {content.dataContext ? (
        <DataContextPanel dataContext={content.dataContext} />
      ) : null}

      <ol className="worked-example-list">
        {content.workedExamples.map((workedExample, index) => (
          <WorkedExampleCard
            index={index}
            key={workedExample.title ?? `worked-example-${index}`}
            workedExample={workedExample}
          />
        ))}
      </ol>

      {content.takeaway ? (
        <section className="checkpoint-callout takeaway">
          <p className="checkpoint-callout-title">Yang perlu diingat</p>
          <p>{content.takeaway}</p>
        </section>
      ) : null}
    </div>
  );
}

function QuestionSetView({ content }: { content: QuestionSetContent }) {
  return (
    <div className="resource-content checkpoint-practice">
      {content.intro ? <p className="checkpoint-intro">{content.intro}</p> : null}

      {content.instructions ? (
        <p className="checkpoint-instructions">{content.instructions}</p>
      ) : null}

      {content.dataContext ? (
        <DataContextPanel dataContext={content.dataContext} />
      ) : null}

      <CheckpointQuestions
        completionMessage={content.completionMessage}
        questions={content.questions}
      />
    </div>
  );
}

function LegacyView({ content }: { content: LegacyContent }) {
  return (
    <div className="resource-content">
      {content.intro ? <p className="checkpoint-intro">{content.intro}</p> : null}

      {content.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      {content.instructions ? (
        <p className="checkpoint-instructions">{content.instructions}</p>
      ) : null}

      {content.items.length > 0 ? (
        <ol className="question-list">
          {content.items.map((item, index) => (
            <li className="question-card" key={`${item.question}-${index}`}>
              {item.question ? (
                <p className="question-prompt">{item.question}</p>
              ) : null}
              {item.answer || item.explanation ? (
                <details className="answer-box">
                  <summary>Lihat jawaban</summary>
                  {item.answer ? <p>{item.answer}</p> : null}
                  {item.explanation ? <p>{item.explanation}</p> : null}
                </details>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function CheckpointView({ content }: { content: CheckpointContent }) {
  switch (content.kind) {
    case "material":
      return <MaterialView content={content} />;
    case "example":
      return <ExampleView content={content} />;
    case "questionSet":
      return <QuestionSetView content={content} />;
    case "legacy":
      return <LegacyView content={content} />;
    default:
      return <EmptyContent />;
  }
}

export function ResourceContent({ resource }: { resource: LearningResource }) {
  if (!resource.content) {
    return <EmptyContent />;
  }

  return <CheckpointView content={resource.content} />;
}
