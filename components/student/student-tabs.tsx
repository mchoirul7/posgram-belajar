"use client";

import { useId, useState, type ReactNode } from "react";

type TabKey = "overview" | "roadmap";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "roadmap", label: "Roadmap" }
];

/**
 * Splits the student detail into Overview and Roadmap.
 *
 * Both panels are rendered on the server and handed in as slots; this only
 * chooses which one is visible, so switching tabs costs no round trip. The
 * hidden panel stays mounted so its scroll position and state survive.
 */
export function StudentTabs({
  overview,
  roadmap,
  roadmapBadge
}: {
  overview: ReactNode;
  roadmap: ReactNode;
  roadmapBadge?: string;
}) {
  const [active, setActive] = useState<TabKey>("overview");
  const baseId = useId();

  return (
    <>
      <div className="mock-tabs student-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            aria-controls={`${baseId}-${tab.key}`}
            aria-selected={active === tab.key}
            className={active === tab.key ? "active" : ""}
            id={`${baseId}-${tab.key}-tab`}
            key={tab.key}
            onClick={() => setActive(tab.key)}
            role="tab"
            type="button"
          >
            {tab.label}
            {tab.key === "roadmap" && roadmapBadge ? (
              <span className="student-tab-badge">{roadmapBadge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          aria-labelledby={`${baseId}-${tab.key}-tab`}
          hidden={active !== tab.key}
          id={`${baseId}-${tab.key}`}
          key={tab.key}
          role="tabpanel"
          tabIndex={0}
        >
          {tab.key === "overview" ? overview : roadmap}
        </div>
      ))}
    </>
  );
}
