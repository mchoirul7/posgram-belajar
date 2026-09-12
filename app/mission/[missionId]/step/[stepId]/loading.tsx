import { LoadingScreen, Skeleton } from "@/components/ui/loading";

/** Mirrors the checkpoint page: blue header, then the content card. */
export default function Loading() {
  return (
    <main className="step-shell">
      <header className="step-header">
        <Skeleton height={14} width={90} />
        <Skeleton height={12} width={140} />
        <Skeleton height={30} width={200} />
        <Skeleton height={14} width={240} />
      </header>

      <section className="step-content-card">
        <LoadingScreen caption="Memuat materi checkpoint…">
          <Skeleton height={14} width="82%" />
          <Skeleton height={14} width="94%" />
          <Skeleton height={96} radius={12} width="100%" />
          <Skeleton height={14} width="70%" />
          <Skeleton height={120} radius={12} width="100%" />
        </LoadingScreen>
      </section>
    </main>
  );
}
