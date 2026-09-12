import { Loader2 } from "lucide-react";

/** Spinner. `label` is read by screen readers; hide it when text sits next to it. */
export function Spinner({
  size = 18,
  label
}: {
  size?: number;
  label?: string;
}) {
  return (
    <span className="spinner" role="status">
      <Loader2 aria-hidden="true" size={size} />
      {label ? <span className="visually-hidden">{label}</span> : null}
    </span>
  );
}

/** A shimmering placeholder standing in for text or a block while it loads. */
export function Skeleton({
  width,
  height = 16,
  radius = 8,
  className
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton${className ? ` ${className}` : ""}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: `${radius}px`
      }}
    />
  );
}

/**
 * Wrapper for a route's loading.tsx. The visible skeleton carries the shape of
 * the page; this adds the one spoken announcement and a caption, so the wait is
 * unmistakable rather than just a quiet grey page.
 */
export function LoadingScreen({
  caption,
  children
}: {
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div aria-busy="true" aria-live="polite" className="loading-screen">
      <p className="loading-caption">
        <Spinner size={17} />
        {caption}
      </p>
      {children}
    </div>
  );
}
