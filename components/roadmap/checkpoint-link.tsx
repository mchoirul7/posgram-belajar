"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Opens a checkpoint in its own tab.
 *
 * It stays a real anchor so middle-click, ctrl-click and a JS-less browser all
 * behave, but a plain click goes through `window.open` on purpose: a tab opened
 * by script is allowed to close itself once the checkpoint is finished.
 */
export function CheckpointLink({
  href,
  className,
  label,
  style,
  children
}: {
  href: string;
  className: string;
  label: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <a
      aria-label={label}
      className={className}
      href={href}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        ) {
          return;
        }

        const tab = window.open(href, "_blank");

        if (tab) {
          event.preventDefault();
          tab.focus();
        }
      }}
      rel="noreferrer"
      style={style}
      target="_blank"
    >
      {children}
    </a>
  );
}
