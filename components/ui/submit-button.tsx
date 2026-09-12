"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "./loading";

/**
 * Submit button that reports the server action's progress.
 *
 * `useFormStatus` only reads the form it is rendered inside, so this has to be
 * its own component below the <form> rather than part of the page.
 */
export function SubmitButton({
  children,
  className = "button",
  icon,
  pendingLabel
}: {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={className}
      disabled={pending}
      type="submit"
    >
      {pending ? <Spinner size={19} /> : icon}
      {pending ? pendingLabel : children}
    </button>
  );
}
