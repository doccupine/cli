import type { DesignStyles } from "./index.js";

// <View> (components/layout/View.tsx) and the page's view selector
// (components/layout/ViewSelector.tsx, in the action bar).
//
//   .dcp-view                    one view; hidden unless it is the shown one
//   .dcp-view[data-default]      a view of the page's first title, shown
//                                until the reader picks another
//   .dcp-view-selector           the selector: the shared Dropdown with a
//                                compact pill trigger
//   .dcp-view-selector__content  the trigger's label and chevron
//   .dcp-view-selector__mark     the check beside the picked title
//
// Showing a picked title is per page: Docs writes a small <style> naming the
// page's titles, keyed off <html data-view> (the pick, restored before the
// first paint), so these rules only cover the default.
const css = `.dcp-view {
  display: none;
  flex-direction: column;
  gap: inherit;
}

.dcp-view[data-default] {
  display: flex;
}

.dcp-view-selector__content {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 180px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  color: var(--color-dark);
}

.dcp-view-selector__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dcp-view-selector__content > svg {
  flex-shrink: 0;
  color: var(--color-grayDark);
  transition: transform 0.2s ease;
}

[aria-expanded="true"] > .dcp-view-selector__content > svg {
  transform: rotate(180deg);
}

.dcp-view-selector__mark {
  display: flex;
  flex-shrink: 0;
  width: 14px;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-view-selector__content > svg {
    transition: none;
  }
}`;

export const viewsStyles: DesignStyles = { classic: css, modern: css };
