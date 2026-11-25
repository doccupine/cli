import type { DesignStyles } from "./index.js";

// <SidePanel> (components/layout/SidePanel.tsx), .dcp-side-panel. Below "lg"
// the panel stays in the document flow, inline where it sits in the MDX
// source. From "lg" up it is lifted into the fixed right rail, at the width
// the table of contents it replaces would have used: the article column
// already reserves exactly that much, so nothing moves. From "xl" it widens
// to the chat panel's width, and the article columns make room for it
// (their `body:has([data-side-panel])` rules). In focus mode it slides out
// to the right like the table of contents.
export const sidePanelStyles: DesignStyles = {
  shared: `.dcp-side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-primaryLight) 10%, transparent);
}

@media screen and (min-width: 992px) {
  .dcp-side-panel {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 1;
    width: var(--layout-toc-width);
    height: 100dvh;
    overflow-y: auto;
    gap: 15px;
    padding: var(--layout-rail-top) 20px 20px 20px;
    border-left: solid 1px var(--color-grayLight);
    border-radius: 0;
    background: var(--color-light);
    -webkit-overflow-scrolling: touch;
  }

  .dcp-side-panel::-webkit-scrollbar {
    display: none;
  }
}

@media screen and (min-width: 1200px) {
  .dcp-side-panel {
    width: var(--layout-chat-width);
  }
}

@media screen and (min-width: 992px) {
  .dcp-side-panel {
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
  }

  html[data-focus-mode] .dcp-side-panel {
    transform: translateX(100%);
    opacity: 0;
    pointer-events: none;
  }
}`,
};
