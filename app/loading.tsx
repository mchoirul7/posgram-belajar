import { LoadingScreen, Skeleton } from "@/components/ui/loading";

export default function Loading() {
  return (
    <main className="mobile-shell">
      <LoadingScreen caption="Memuat halaman…">
        <Skeleton height={132} radius={18} width="100%" />
        <div className="skeleton-rows">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton height={76} key={row} radius={16} width="100%" />
          ))}
        </div>
      </LoadingScreen>
    </main>
  );
}
