import type { DesignStyles } from "./index.js";

// Prompt (components/layout/Prompt.tsx): a ready-to-copy AI prompt.
//
//   .dcp-prompt                the card
//   .dcp-prompt__header        icon, description and actions
//   .dcp-prompt__description   the prompt's title
//   .dcp-prompt__actions       the copy button and the Cursor link
//   .dcp-prompt__cursor        the "open in Cursor" link, drawn like the
//                              copy button
//   .dcp-prompt__body          the prompt text
//
// In the design layer after the article prose (docs.ts), competing with it
// by specificity as before.
const css = `.dcp-prompt {
  background: var(--color-light);
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
}

.dcp-prompt__header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0 0 15px;
  font-size: 14px;
  line-height: 1.7;
  font-weight: 700;
  color: var(--color-dark);
}

.dcp-prompt__header > svg.lucide {
  flex-shrink: 0;
  margin-top: 4px;
  color: inherit;
}

.dcp-prompt__description {
  flex: 1;
  min-width: 0;
}

.dcp-prompt__actions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.dcp-prompt__cursor {
  transition: all 0.3s ease;
  border: solid 1px transparent;
  box-shadow: 0 0 0 0px var(--color-primary);
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--color-light);
  border-color: var(--color-grayLight);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  color: var(--color-grayDark);
  text-decoration: none;
}

.dcp-prompt__cursor:hover {
  border-color: var(--color-primary);
}

.dcp-prompt__cursor:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primaryLight);
}

.dcp-prompt__cursor:active {
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-prompt__cursor svg.lucide {
  margin: 0;
  color: inherit;
}

.dcp-prompt__body {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-grayDark);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media screen and (min-width: 992px) {
  .dcp-prompt__header,
  .dcp-prompt__body {
    font-size: 16px;
    line-height: 1.7;
  }
}`;

export const promptStyles: DesignStyles = {
  classic: css,
  modern: css,
};
