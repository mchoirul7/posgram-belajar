import type { CheckpointSection } from "@/lib/learning/content";

const sectionLabels: Record<string, string> = {
  concept: "Konsep",
  example: "Contoh",
  misconception: "Sering Keliru",
  quick_check: "Cek Cepat",
  strategy: "Strategi",
  summary: "Rangkuman",
  text: "Catatan"
};

function sectionLabel(type: string): string {
  return sectionLabels[type] ?? "Bagian";
}

/**
 * Renders one `sections[]` entry. The switch only picks the framing; every
 * common field (`body`, `key_point`, `formula`, `example`, `note`, `items`,
 * `question`/`answer`/`explanation`) is rendered whenever present, so a
 * section type this app has not seen before still shows its content.
 */
export function MaterialSection({ section }: { section: CheckpointSection }) {
  const isQuickCheck = section.type === "quick_check";

  return (
    <section className={`material-section section-${section.type}`}>
      <p className="material-section-tag">{sectionLabel(section.type)}</p>

      {section.title ? <h3>{section.title}</h3> : null}
      {section.body ? <p className="material-body">{section.body}</p> : null}

      {section.formula ? (
        <p className="material-formula">{section.formula}</p>
      ) : null}

      {section.keyPoint ? (
        <p className="material-key-point">{section.keyPoint}</p>
      ) : null}

      {section.example ? (
        <p className="material-example">Contoh: {section.example}</p>
      ) : null}

      {section.items.length > 0 ? (
        <ul className="material-items">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {section.note ? <p className="material-note">{section.note}</p> : null}

      {section.question ? (
        <div className="material-quick-check">
          <p className="material-question">{section.question}</p>
          {section.answer || section.explanation ? (
            <details className="answer-box">
              <summary>
                {isQuickCheck ? "Cek jawabanmu" : "Lihat jawaban"}
              </summary>
              {section.answer ? <p>Jawaban: {section.answer}</p> : null}
              {section.explanation ? <p>{section.explanation}</p> : null}
            </details>
          ) : null}
        </div>
      ) : null}

      {!section.question && section.explanation ? (
        <p className="material-body">{section.explanation}</p>
      ) : null}
    </section>
  );
}
