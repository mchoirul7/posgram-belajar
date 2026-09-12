import type { DataContext } from "@/lib/learning/content";

/**
 * Renders the `data_context` bar-chart payload shared by schema version 3
 * `example`, `guided_practice`, and `practice` resources. Bars are plain CSS
 * so the panel keeps the roadmap's flat, game-like look.
 */
export function DataContextPanel({ dataContext }: { dataContext: DataContext }) {
  const values = dataContext.values;
  const maxValue = values.reduce(
    (max, entry) => Math.max(max, entry.value),
    0
  );
  const scale = dataContext.scale && dataContext.scale > 0 ? dataContext.scale : 0;
  const ceiling = scale
    ? Math.max(scale, Math.ceil(maxValue / scale) * scale)
    : maxValue;

  return (
    <figure className="data-context">
      <figcaption className="data-context-head">
        <span className="data-context-tag">Data</span>
        {dataContext.title ? <strong>{dataContext.title}</strong> : null}
      </figcaption>

      {values.length > 0 ? (
        <ul className="data-context-chart">
          {values.map((entry) => (
            <li className="data-context-row" key={entry.category}>
              <span className="data-context-category">{entry.category}</span>
              <span className="data-context-track">
                <span
                  className="data-context-bar"
                  style={{
                    width: `${ceiling > 0 ? (entry.value / ceiling) * 100 : 0}%`
                  }}
                />
              </span>
              <span className="data-context-value">{entry.value}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {scale ? (
        <p className="data-context-scale">Skala: 1 satuan = {scale}</p>
      ) : null}
    </figure>
  );
}
