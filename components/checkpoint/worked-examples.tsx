import type { WorkedExample } from "@/lib/learning/content";

/** Renders one `worked_examples[]` entry of a schema version 3 `example`. */
export function WorkedExampleCard({
  workedExample,
  index
}: {
  workedExample: WorkedExample;
  index: number;
}) {
  return (
    <li className="worked-example">
      <div className="worked-example-head">
        <span className="worked-example-index">{index + 1}</span>
        <h3>{workedExample.title ?? `Contoh ${index + 1}`}</h3>
      </div>

      {workedExample.problem ? (
        <p className="worked-example-problem">{workedExample.problem}</p>
      ) : null}

      {workedExample.steps.length > 0 ? (
        <ol className="worked-example-steps">
          {workedExample.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}

      {workedExample.answer ? (
        <p className="worked-example-answer">
          <span>Jawaban</span>
          {workedExample.answer}
        </p>
      ) : null}

      {workedExample.why ? (
        <p className="worked-example-why">{workedExample.why}</p>
      ) : null}

      {workedExample.explanation ? (
        <p className="worked-example-why">{workedExample.explanation}</p>
      ) : null}

      {workedExample.misconceptionTarget ? (
        <p className="worked-example-misconception">
          Hati-hati: {workedExample.misconceptionTarget}
        </p>
      ) : null}
    </li>
  );
}
