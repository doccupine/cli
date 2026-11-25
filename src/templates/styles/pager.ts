import type { DesignStyles } from "./index.js";

// The previous/next pager under the article
// (components/layout/DocsNavigation.tsx).
//
//   .dcp-pager           the row's outer column, padded like the article
//                        (data-chat-open while the chat panel is open)
//   .dcp-pager__inner    the row, capped at the content width
//   .dcp-pager__link     a page link, data-direction="prev" | "next"
//   .dcp-pager__title    the linked page's title
//   .dcp-pager__label    the "Previous" / "Next" label with its arrow
//   .dcp-pager__spacer   holds the next link right when there is no previous
export const pagerStyles: DesignStyles = {
  shared: `.dcp-pager {
  transition: all 0.3s ease;
}

.dcp-pager__inner {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  max-width: var(--layout-content-width);
  margin: auto;
}

.dcp-pager__link {
  display: flex;
  text-decoration: none;
  max-width: 50%;
}

.dcp-pager__link[data-direction="prev"] {
  align-items: flex-start;
}

.dcp-pager__link[data-direction="next"] {
  align-items: flex-end;
  margin-left: auto;
  text-align: right;
}

.dcp-pager__label {
  display: flex;
  gap: 4px;
  color: var(--color-grayDark);
}

.dcp-pager__title {
  color: var(--color-dark);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 100%;
}

.dcp-pager__spacer {
  flex: 1;
}`,
  classic: `.dcp-pager {
  padding: 0 20px 100px 20px;
}

@media screen and (min-width: 992px) {
  .dcp-pager {
    padding: 0 calc(var(--layout-toc-width) + var(--layout-gutter)) 80px
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }

  .dcp-pager[data-chat-open] {
    padding: 0 calc(var(--layout-chat-width) + var(--layout-gutter)) 80px
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 1200px) {
  body:has([data-side-panel]) .dcp-pager {
    padding-right: calc(var(--layout-chat-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 992px) {
  html[data-focus-mode] .dcp-pager:not([data-chat-open]) {
    padding-left: 20px;
    padding-right: 20px;
  }
}

.dcp-pager__inner {
  align-items: center;
}

/* Bordered cards with the interactive ring (dcp-interactive's rules, stated
   here because the card's own border has to win over it). */
.dcp-pager__link {
  transition: all 0.3s ease;
  box-shadow: 0 0 0 0px var(--color-primary);
  flex-direction: column;
  padding: 20px;
  flex: 50%;
  border-radius: 12px;
  border: solid 1px var(--color-grayLight);
  color: var(--color-dark);
}

.dcp-pager__link:hover {
  border-color: var(--color-primary);
}

.dcp-pager__link:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primaryLight);
}

.dcp-pager__link:active {
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-pager__label {
  flex-direction: row;
}

.dcp-pager__label svg {
  margin: auto 0;
}

.dcp-pager__title {
  font-weight: 600;
  margin: 0 0 4px 0;
}`,
  modern: `.dcp-pager {
  padding: 0 var(--layout-gutter) 40px;
}

@media screen and (min-width: 992px) {
  .dcp-pager {
    padding: 0 calc(var(--layout-toc-width) + var(--layout-gutter)) 40px
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }

  .dcp-pager[data-chat-open] {
    padding: 0 calc(var(--layout-chat-width) + var(--layout-gutter)) 40px
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 1200px) {
  body:has([data-side-panel]) .dcp-pager {
    padding-right: calc(var(--layout-chat-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 992px) {
  html[data-focus-mode] .dcp-pager:not([data-chat-open]) {
    padding-left: 20px;
    padding-right: 20px;
  }
}

/* Previous and next as plain text links over a hairline: a small muted
   direction label above each page title. */
.dcp-pager__inner {
  align-items: flex-start;
  gap: 24px;
  padding-top: 24px;
  border-top: solid 1px var(--color-grayLight);
}

.dcp-pager__link {
  flex-direction: column-reverse;
  gap: 2px;
  min-width: 0;
  padding: 4px 0;
  border-radius: 6px;
}

.dcp-pager__link:hover > span:first-child {
  color: var(--color-accent);
}

.dcp-pager__label {
  align-items: center;
  font-size: 13px;
  line-height: 20px;
}

.dcp-pager__label svg {
  width: 14px;
  height: 14px;
}

.dcp-pager__title {
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  transition: color 0.2s ease;
}`,
};
