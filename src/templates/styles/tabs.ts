import type { DesignStyles } from "./index.js";

// <Tabs> / <TabContent> (components/layout/Tabs.tsx). Selection and the
// keyboard pattern live in the component; the styles read aria-selected.
//
//   .dcp-tabs           the block
//   .dcp-tabs__list     the tablist
//   .dcp-tabs__tab      a tab button (aria-selected="true" when active)
//   .dcp-tabs__panel    a tabpanel ([hidden] when inactive)
//
// The tabs used to extend Cherry's Button, so they keep its base look where
// the tab does not restate it (nowrap, the hover border color, the focus
// ring), with the same precedence: the selected state stays at one class of
// specificity (:where) so the button hover still wins over it.
export const tabsStyles: DesignStyles = {
  classic: `.dcp-tabs {
  width: 100%;
  margin: 0 auto;
}

.dcp-tabs__list {
  display: flex;
  overflow: hidden;
  border-radius: 12px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background-color: var(--color-light);
  border: solid 1px var(--color-grayLight);
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
}

.dcp-tabs__tab {
  box-sizing: border-box;
  appearance: none;
  margin: 0;
  outline: none;
  font-family: inherit;
  white-space: nowrap;
  hyphens: auto;
  text-decoration: none;
  text-align: center;
  text-overflow: ellipsis;
  box-shadow: 0 0 0 0px var(--color-primary);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 0;
  background: var(--color-light);
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
  min-width: fit-content;
  height: auto;
  min-height: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-dark);
  font-weight: 600;
  position: relative;
}

@media screen and (min-width: 992px) {
  .dcp-tabs__tab {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-tabs__tab .icon,
.dcp-tabs__tab .lucide {
  margin: auto 0;
}

.dcp-tabs__tab svg {
  flex-shrink: 0;
}

.dcp-tabs__tab:where([aria-selected="true"]) {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.dcp-tabs__tab:hover {
  background: var(--color-primaryDark);
  border-color: var(--color-primaryDark);
}

.dcp-tabs__tab:focus {
  box-shadow: 0 0 0 4px var(--color-primaryLight);
}

.dcp-tabs__tab:active {
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-tabs__tab:where(:not([aria-selected="true"])):hover {
  color: var(--color-primary);
  background-color: color-mix(
    in srgb,
    var(--color-primaryLight) 10%,
    transparent
  );
}

.dcp-tabs__tab:focus-visible {
  outline: none;
  z-index: 1;
  box-shadow: inset 0 0 0 2px var(--color-primaryLight);
}

.dcp-tabs__tab:not(:last-child) {
  border-right: 1px solid var(--color-grayLight);
}

@media (prefers-reduced-motion: reduce) {
  .dcp-tabs__tab {
    transition: none;
  }
}

.dcp-tabs__panel {
  background-color: var(--color-light);
  padding: 20px;
  border-radius: 0 0 12px 12px;
  color: var(--color-grayDark);
  font-size: 14px;
  line-height: 1.7;
  border: solid 1px var(--color-grayLight);
  border-top: none;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-wrap: wrap;
  flex: 1;
}

@media screen and (min-width: 992px) {
  .dcp-tabs__panel {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-tabs__panel[hidden] {
  display: none;
}

.dcp-tabs__panel:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--color-primaryLight);
}`,
  modern: `.dcp-tabs {
  width: 100%;
  margin: 0 auto;
}

/* Underline tabs: text labels over a hairline, the active one underlined in
   the ink color. Scrolls sideways when the labels overflow. */
.dcp-tabs__list {
  display: flex;
  gap: 24px;
  border-bottom: solid 1px var(--color-grayLight);
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
}

.dcp-tabs__tab {
  box-sizing: border-box;
  appearance: none;
  outline: none;
  white-space: nowrap;
  hyphens: auto;
  text-decoration: none;
  text-align: center;
  text-overflow: ellipsis;
  justify-content: center;
  box-shadow: 0 0 0 0px var(--color-primary);
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 0;
  margin: 0 0 -1px;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
  height: auto;
  min-height: 0;
  font-family: inherit;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: var(--color-grayDark);
  position: relative;
}

.dcp-tabs__tab .icon,
.dcp-tabs__tab .lucide {
  margin: auto 0;
}

.dcp-tabs__tab svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.dcp-tabs__tab:where([aria-selected="true"]) {
  color: var(--color-dark);
  border-bottom-color: var(--color-dark);
}

.dcp-tabs__tab:hover {
  border-color: var(--color-primaryDark);
}

/* These tabs only change their text and underline: no fill or ring on
   hover, focus and press. */
.dcp-tabs__tab.dcp-tabs__tab:hover,
.dcp-tabs__tab.dcp-tabs__tab:focus,
.dcp-tabs__tab.dcp-tabs__tab:active {
  background: transparent;
  box-shadow: none;
}

.dcp-tabs__tab.dcp-tabs__tab:hover {
  color: var(--color-dark);
}

.dcp-tabs__tab.dcp-tabs__tab:focus-visible {
  outline: none;
  z-index: 1;
  border-radius: 6px;
  box-shadow: inset 0 0 0 2px var(--color-primaryLight);
}

@media (prefers-reduced-motion: reduce) {
  .dcp-tabs__tab {
    transition: none;
  }
}

.dcp-tabs__panel {
  padding: 20px 0 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-wrap: wrap;
  flex: 1;
}

.dcp-tabs__panel[hidden] {
  display: none;
}

.dcp-tabs__panel:focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}`,
};
