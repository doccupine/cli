import type { DesignStyles } from "./index.js";

// File trees (components/layout/Tree.tsx).
//
//   .dcp-tree           the tree (<ul role="tree">)
//   .dcp-tree__group    a folder's children (<ul role="group">)
//   .dcp-tree__item     a <li role="treeitem">
//   .dcp-tree__row      the clickable row; data-interactive on folders that
//                       open and close
//   .dcp-tree__chevron  a folder's chevron; data-open while it is open
//   .dcp-tree__spacer   keeps files aligned with folders
//   .dcp-tree__icon     the folder or file icon
//   .dcp-tree__name     the name; data-folder on folders
//
// The article's prose styles every descendant "ul li" (bullet dots, padding,
// min-height) at (0,1,2) and up, so the tree's lists and items double their
// class to reach (0,2,0) and win. A design rule in both designs, after the
// prose (which lives in the design layer).
const tree = `.dcp-tree.dcp-tree {
  background: var(--color-light);
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  padding: 12px;
  margin: 0;
  width: 100%;
  list-style: none;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
}

.dcp-tree__group.dcp-tree__group {
  list-style: none;
  margin: 0 0 0 13px;
  padding: 0 0 0 9px;
  border-left: solid 1px var(--color-grayLight);
}

.dcp-tree__row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.dcp-tree__row:where([data-interactive]) {
  cursor: pointer;
}

.dcp-tree__row:where([data-interactive]):hover {
  background: var(--color-grayLight);
}

.dcp-tree__item.dcp-tree__item {
  display: block;
  padding: 0;
  margin: 0;
  min-height: 0;
  outline: none;
}

.dcp-tree__item.dcp-tree__item::before {
  content: none;
}

.dcp-tree__item:focus-visible > .dcp-tree__row {
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-tree__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: var(--color-gray);
  transition: transform 0.2s ease;
}

.dcp-tree__chevron:where([data-open]) {
  transform: rotate(90deg);
}

.dcp-tree__spacer {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.dcp-tree__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-gray);
}

.dcp-tree__name {
  font-family: "Roboto Mono", monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: nowrap;
  color: var(--color-grayDark);
}

.dcp-tree__name:where([data-folder]) {
  color: var(--color-dark);
}`;

export const treeStyles: DesignStyles = { classic: tree, modern: tree };
