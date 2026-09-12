import { LoadingScreen, Skeleton } from "@/components/ui/loading";

/** Mirrors the student detail page: hero, stat card, then the weak concepts. */
export default function Loading() {
  return (
    <main className="mobile-shell detail-page">
      <header className="detail-hero">
        <Skeleton height={24} width={120} />
        <Skeleton height={96} radius={999} width={96} />
        <Skeleton height={24} width={200} />
      </header>

      <LoadingScreen caption="Memuat data siswa…">
        <Skeleton height={96} radius={16} width="100%" />
        <Skeleton height={48} radius={16} width="100%" />
        <div className="skeleton-rows">
          {[0, 1, 2].map((row) => (
            <Skeleton height={74} key={row} radius={16} width="100%" />
          ))}
        </div>
      </LoadingScreen>
    </main>
  );
}
