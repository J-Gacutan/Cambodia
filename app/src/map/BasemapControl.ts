import type { IControl, Map as MapLibreMap } from "maplibre-gl";
import type { BasemapChoice } from "./basemap";

/**
 * MapLibre control: Streets / Satellite toggle on the map canvas
 * (not in app chrome).
 */
export class BasemapControl implements IControl {
  private container: HTMLDivElement | null = null;
  private choice: BasemapChoice;
  private readonly onChange: (choice: BasemapChoice) => void;

  constructor(choice: BasemapChoice, onChange: (choice: BasemapChoice) => void) {
    this.choice = choice;
    this.onChange = onChange;
  }

  setChoice(choice: BasemapChoice) {
    this.choice = choice;
    this.syncButtons();
  }

  onAdd(_map: MapLibreMap): HTMLElement {
    const container = document.createElement("div");
    container.className = "maplibregl-ctrl maplibregl-ctrl-group khm-basemap-ctrl";
    container.setAttribute("role", "group");
    container.setAttribute("aria-label", "Basemap");

    for (const [value, label] of [
      ["streets", "Streets"],
      ["satellite", "Satellite"]
    ] as const) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "khm-basemap-ctrl-btn";
      button.dataset.basemap = value;
      button.textContent = label;
      button.title = `${label} basemap`;
      button.setAttribute("aria-label", `${label} basemap`);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (this.choice === value) return;
        this.onChange(value);
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
    for (const button of this.container.querySelectorAll<HTMLButtonElement>("[data-basemap]")) {
      const active = button.dataset.basemap === this.choice;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("is-active", active);
    }
  }
}
