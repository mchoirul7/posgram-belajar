import { LoadingScreen, Skeleton } from "@/components/ui/loading";

/** Mirrors the parent report: hero, exam panel, then the concept cards. */
export default function Loading() {
  return (
    <main className="parent-share-page">
      <header className="parent-share-hero">
        <Skeleton height={72} radius={999} width={72} />
        <Skeleton height={12} width={130} />
        <Skeleton height={28} width={220} />
        <Skeleton height={12} width={90} />
      </header>

      <section className="parent-share-content">
        <LoadingScreen caption="Memuat laporan belajar…">
          <Skeleton height={108} radius={16} width="100%" />
          <div className="skeleton-grid">
            {[0, 1, 2, 3].map((card) => (
              <Skeleton height={132} key={card} radius={16} width="100%" />
            ))}
          </div>
          <Skeleton height={132} radius={16} width="100%" />
        </LoadingScreen>
      </section>
    </main>
  );
}
