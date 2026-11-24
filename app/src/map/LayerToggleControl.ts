import type { IControl, Map as MapLibreMap } from "maplibre-gl";

export type LayerToggleOption = {
  id: string;
  label: string;
  /** Shown in title / aria when the layer is a stub */
  stub?: boolean;
};

/**
 * MapLibre control: on-canvas layer toggles (same pattern as BasemapControl).
 */
export class LayerToggleControl implements IControl {
  private container: HTMLDivElement | null = null;
  private readonly options: LayerToggleOption[];
  private readonly onChange: (id: string, on: boolean) => void;
  private state: Record<string, boolean>;
  private readonly groupLabel: string;

  constructor(
    groupLabel: string,
    options: LayerToggleOption[],
    initial: Record<string, boolean>,
    onChange: (id: string, on: boolean) => void
  ) {
    this.groupLabel = groupLabel;
    this.options = options;
    this.state = { ...initial };
    this.onChange = onChange;
  }

  setState(next: Record<string, boolean>) {
    this.state = { ...next };
    this.syncButtons();
  }

  onAdd(_map: MapLibreMap): HTMLElement {
    const container = document.createElement("div");
    container.className = "maplibregl-ctrl maplibregl-ctrl-group khm-basemap-ctrl khm-layer-toggle-ctrl";
    container.setAttribute("role", "group");
    container.setAttribute("aria-label", this.groupLabel);

    for (const opt of this.options) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "khm-basemap-ctrl-btn";
      button.dataset.layer = opt.id;
      button.textContent = opt.label;
      button.title = opt.stub
        ? `${opt.label} — coming soon; toggle shows intent`
        : `Toggle ${opt.label}`;
      button.setAttribute("aria-label", `Toggle ${opt.label}`);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const next = !this.state[opt.id];
        this.state = { ...this.state, [opt.id]: next };
        this.syncButtons();
        this.onChange(opt.id, next);
      });
      container.appendChild(button);
    }

    this.container = container;
    this.syncButtons();
    return container;
  }

  onRemove() {
    this.container?.remove();
    this.container = null;
  }

  private syncButtons() {
    if (!this.container) return;
    for (const button of this.container.querySelectorAll<HTMLButtonElement>("[data-layer]")) {
      const id = button.dataset.layer ?? "";
      const active = Boolean(this.state[id]);
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("is-active", active);
    }
  }
}
