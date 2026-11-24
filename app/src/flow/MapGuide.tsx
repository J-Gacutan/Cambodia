import { Button } from "@patternfly/react-core";
import { MAP_ACTIONS, MAP_COACH_KEY, MAP_FILTER_TOUCHED_KEY, type MapActionId } from "./steps";

export type MapProgress = {
  filterTouched: boolean;
  hasInspect: boolean;
  inspectReviewed: boolean;
  shortlistCount: number;
};

export function resolveMapAction(progress: MapProgress): MapActionId {
  if (!progress.filterTouched) return "filter";
  if (!progress.hasInspect) return "click";
  if (!progress.inspectReviewed) return "inspect";
  return "shortlist";
}

export function mapActionDone(id: MapActionId, progress: MapProgress): boolean {
  switch (id) {
    case "filter":
      return progress.filterTouched;
    case "click":
      return progress.hasInspect;
    case "inspect":
      return progress.inspectReviewed;
    case "shortlist":
      return progress.shortlistCount > 0;
  }
}

/**
 * First-visit coach + progressive next-action CTA for the screen map.
 * On-canvas MapLibre controls stay on the canvas; this sits in the page chrome.
 */
export function MapGuide({
  progress,
  coachOpen,
  onDismissCoach,
  onFocusFilters,
  onMarkInspectReviewed,
  onAddShortlist,
  canAddShortlist
}: {
  progress: MapProgress;
  coachOpen: boolean;
  onDismissCoach: () => void;
  onFocusFilters: () => void;
  onMarkInspectReviewed: () => void;
  onAddShortlist: () => void;
  canAddShortlist: boolean;
}) {
  const current = resolveMapAction(progress);
  const currentMeta = MAP_ACTIONS.find((a) => a.id === current)!;
  const allDone = MAP_ACTIONS.every((a) => mapActionDone(a.id, progress));

  return (
    <div className="khm-map-guide">
      {coachOpen && (
        <div className="khm-map-coach" role="region" aria-label="Map first visit">
          <p>
            <strong>First visit — how to use this map.</strong> Work left to right: filter reasons to pause,
            click a site, read the side panel, then shortlist. Basemap and zoom stay on the map.
          </p>
          <div className="khm-map-tools">
            <Button
              variant="primary"
              onClick={() => {
                onFocusFilters();
                onDismissCoach();
              }}
            >
              Start: filter reasons
            </Button>
            <Button variant="link" onClick={onDismissCoach}>
              Skip coach
            </Button>
          </div>
        </div>
      )}

      <ol className="khm-map-actions" aria-label="Map next actions">
        {MAP_ACTIONS.map((action, index) => {
          const done = mapActionDone(action.id, progress);
          const selected = !allDone && action.id === current;
          return (
            <li
              key={action.id}
              className={[
                "khm-map-action",
                done ? "khm-map-action-done" : "",
                selected ? "khm-map-action-current" : ""
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="khm-map-action-index" aria-hidden>
                {done ? "✓" : index + 1}
              </span>
              <span>{action.label}</span>
            </li>
          );
        })}
      </ol>

      {!allDone && (
        <div className="khm-map-next-cta" role="status">
          <p>
            <strong>Next:</strong> {currentMeta.cta}
          </p>
          <div className="khm-map-tools">
            {current === "filter" && (
              <Button variant="primary" onClick={onFocusFilters}>
                Open reasons to pause
              </Button>
            )}
            {current === "inspect" && progress.hasInspect && (
              <Button variant="primary" onClick={onMarkInspectReviewed}>
                Mark panel read
              </Button>
            )}
            {current === "shortlist" && (
              <Button variant="primary" isDisabled={!canAddShortlist} onClick={onAddShortlist}>
                Add selection to shortlist
              </Button>
            )}
            {current === "click" && (
              <span className="pf-v6-u-font-size-sm">Waiting for a map click…</span>
            )}
          </div>
        </div>
      )}

      {allDone && (
        <div className="khm-map-next-cta" role="status">
          <p>
            <strong>Ready.</strong> Continue to Act for a shortlist report and downloads.
          </p>
          <div className="khm-map-tools">
            <Button variant="secondary" component="a" href="#act">
              Next: Act (shortlist)
            </Button>
            <Button variant="link" component="a" href="#cases">
              Back: Means
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function readCoachDismissed(): boolean {
  try {
    return window.localStorage.getItem(MAP_COACH_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissCoachStorage(): void {
  try {
    window.localStorage.setItem(MAP_COACH_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function readFilterTouched(): boolean {
  try {
    return window.sessionStorage.getItem(MAP_FILTER_TOUCHED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeFilterTouched(): void {
  try {
    window.sessionStorage.setItem(MAP_FILTER_TOUCHED_KEY, "1");
  } catch {
    /* private mode */
  }
}
