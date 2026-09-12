"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * Top progress bar for every navigation and form submit.
 *
 * Route segments have their own loading.tsx skeletons, but those only appear
 * once the server starts streaming. This fires the moment something is clicked,
 * so nothing ever feels unresponsive in between.
 *
 * It watches clicks and submits rather than router internals because the App
 * Router exposes no global "navigation started" event.
 */

type Navigation = {
  active: boolean;
  /** URL the navigation started from; the bar stops once it no longer matches. */
  from: string;
};

function currentLocationKey() {
  return `${window.location.pathname}${window.location.search}`;
}

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const routeKey = `${pathname}${query ? `?${query}` : ""}`;

  const [navigation, setNavigation] = useState<Navigation>({
    active: false,
    from: routeKey
  });

  // The URL moved on, so the navigation landed. Adjusting during render keeps
  // this out of an effect and avoids a flash of the stale bar.
  if (navigation.active && navigation.from !== routeKey) {
    setNavigation({ active: false, from: routeKey });
  }

  const stop = useCallback(() => {
    setNavigation((current) =>
      current.active ? { ...current, active: false } : current
    );
  }, []);

  useEffect(() => {
    function start() {
      setNavigation({ active: true, from: currentLocationKey() });
    }

    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");

      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const href = anchor.getAttribute("href");

      if (!href || href.startsWith("#")) {
        return;
      }

      const target = new URL(href, window.location.href);

      if (target.origin !== window.location.origin) {
        return;
      }

      // Same page, nothing to wait for.
      if (`${target.pathname}${target.search}` === currentLocationKey()) {
        return;
      }

      start();
    }

    function handleSubmit(event: SubmitEvent) {
      const form = event.target as HTMLFormElement | null;

      if (!event.defaultPrevented && form?.target !== "_blank") {
        start();
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("submit", handleSubmit, { capture: true });
    window.addEventListener("pagehide", stop);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("submit", handleSubmit, { capture: true });
      window.removeEventListener("pagehide", stop);
    };
  }, [stop]);

  // Safety valve: a cancelled navigation would otherwise leave the bar running.
  useEffect(() => {
    if (!navigation.active) {
      return;
    }

    const timer = window.setTimeout(stop, 15000);

    return () => window.clearTimeout(timer);
  }, [navigation.active, stop]);

  return (
    <div
      aria-hidden="true"
      className={`route-progress${navigation.active ? " active" : ""}`}
    >
      <span />
    </div>
  );
}
