import type { DesignStyles } from "./index.js";

// Mermaid diagrams (components/layout/Mermaid.tsx): the framed diagram, its
// pan/zoom stage and the control pad. The diagram itself paints with the
// --mermaid-* variables (tokens.css), so it follows the mode on its own.
//
//   .dcp-mermaid             the <figure>; full screen through :fullscreen
//   .dcp-mermaid__viewport   clips the stage; data-draggable once the
//                            controls show, data-dragging while dragged
//   .dcp-mermaid__stage      the diagram, moved by the inline
//                            --dcp-mermaid-x, --dcp-mermaid-y and
//                            --dcp-mermaid-scale properties
//   .dcp-mermaid__controls   the 3x3 control pad; data-placement="top-left",
//                            "top-right", "bottom-left" or "bottom-right"
//   .dcp-mermaid__control    a pad button
//
// A design rule in both designs, after the article's prose rules (which live
// in the design layer), so it keeps winning its ties with them.
const mermaid = `.dcp-mermaid {
  position: relative;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  background: var(--color-light);
  overflow: hidden;
}

.dcp-mermaid:fullscreen {
  border: none;
  border-radius: 0;
}

.dcp-mermaid:fullscreen .dcp-mermaid__viewport {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dcp-mermaid:fullscreen .dcp-mermaid__stage {
  width: 100%;
  height: 100%;
}

.dcp-mermaid:fullscreen .dcp-mermaid__stage > svg {
  height: 100%;
}

.dcp-mermaid__viewport {
  overflow: hidden;
  padding: 16px;
}

.dcp-mermaid__viewport:where([data-draggable]) {
  cursor: grab;
  user-select: none;
}

.dcp-mermaid__viewport:where([data-draggable][data-dragging]) {
  cursor: grabbing;
}

.dcp-mermaid__stage {
  transform: translate(var(--dcp-mermaid-x, 0px), var(--dcp-mermaid-y, 0px))
    scale(var(--dcp-mermaid-scale, 1));
  transform-origin: center center;
  transition: transform 0.15s ease-out;
  margin: 0 auto;
}

.dcp-mermaid__stage:where([data-dragging]) {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-mermaid__stage {
    transition: none;
  }
}

.dcp-mermaid__stage > svg {
  display: block;
  width: 100%;
  height: auto;
  min-height: 320px;
  margin: 0 auto;
}

.dcp-mermaid__controls {
  position: absolute;
  display: grid;
  grid-template-columns: repeat(3, 24px);
  grid-template-rows: repeat(3, 24px);
  gap: 2px;
  padding: 4px;
  border: solid 1px var(--color-grayLight);
  border-radius: 6px;
  background: var(--color-light);
  box-shadow: var(--shadow-sm);
}

.dcp-mermaid__controls:where([data-placement^="top"]) {
  top: 8px;
}

.dcp-mermaid__controls:where([data-placement^="bottom"]) {
  bottom: 8px;
}

.dcp-mermaid__controls:where([data-placement$="left"]) {
  left: 8px;
}

.dcp-mermaid__controls:where([data-placement$="right"]) {
  right: 8px;
}

.dcp-mermaid__control {
  box-sizing: border-box;
  appearance: none;
  background: none;
  padding: 0;
  margin: 0;
  outline: none;
  transition: all 0.3s ease;
  border: solid 1px transparent;
  box-shadow: 0 0 0 0px var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--color-grayDark);
  cursor: pointer;
}

.dcp-mermaid__control:hover {
  border-color: var(--color-primary);
}

.dcp-mermaid__control:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-mermaid__control:hover:not(:disabled) {
  background: var(--color-grayLight);
  color: var(--color-dark);
}

.dcp-mermaid__control:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}`;

export const mermaidStyles: DesignStyles = {
  classic: mermaid,
  modern: mermaid,
};
