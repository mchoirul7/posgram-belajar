import { LoadingScreen, Skeleton } from "@/components/ui/loading";

/** Mirrors the roadmap board: header, concept legend, then the winding path. */
export default function Loading() {
  const nodes = [50, 30, 70, 32, 68, 44, 50, 30];

  return (
    <main className="roadmap-full-page">
      <header className="roadmap-full-header">
        <div className="roadmap-full-title">
          <Skeleton height={72} radius={999} width={72} />
          <div className="skeleton-stack">
            <Skeleton height={12} width={120} />
            <Skeleton height={26} width={210} />
            <Skeleton height={12} width={160} />
          </div>
        </div>
      </header>

      <section className="roadmap-full-board">
        <LoadingScreen caption="Menyiapkan roadmap belajar…">
          <div className="roadmap-legend">
            {[128, 150, 112].map((width) => (
              <Skeleton height={30} key={width} radius={999} width={width} />
            ))}
          </div>

          <div className="roadmap-map skeleton-map">
            {nodes.map((x, index) => (
              <span
                className="skeleton skeleton-node"
                key={`${x}-${index}`}
                style={{
                  left: `${x}%`,
                  top: `${120 + index * 88}px`
                }}
              />
            ))}
          </div>
        </LoadingScreen>
      </section>
    </main>
  );
}
