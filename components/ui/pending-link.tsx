"use client";

import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { Spinner } from "./loading";

/**
 * Swaps a link's own icon for a spinner while its destination is loading.
 *
 * `useLinkStatus` reports the nearest enclosing <Link>, so the indicator has to
 * live in a child component of that Link.
 */
function LinkBody({
  children,
  icon,
  pendingLabel
}: {
  children: ReactNode;
  icon?: ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      {pending ? <Spinner size={18} /> : icon}
      {pending ? pendingLabel : children}
    </>
  );
}

export function PendingLink({
  children,
  className,
  href,
  icon,
  pendingLabel
}: {
  children: ReactNode;
  className?: string;
  href: string;
  icon?: ReactNode;
  pendingLabel: string;
}) {
  return (
    <Link className={className} href={href}>
      <LinkBody icon={icon} pendingLabel={pendingLabel}>
        {children}
      </LinkBody>
    </Link>
  );
}
