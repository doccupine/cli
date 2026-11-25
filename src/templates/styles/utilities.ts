// The utilities layer: single-purpose classes that win over every component
// and design rule.
export const utilitiesCss = `.full-width {
  width: 100%;
}

/* Mode-conditional visibility helpers (logos, icons). Pure CSS, so the swap
   follows the "dark" class on <html> without JS or a re-render. */
:root.dark .light-only {
  display: none !important;
}

:root:not(.dark) .dark-only {
  display: none !important;
}

/* Visually hidden but read by assistive tech and crawlers. */
.dcp-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}`;
