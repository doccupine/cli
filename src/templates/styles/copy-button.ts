import type { DesignStyles } from "./index.js";

// CopyButton (components/layout/CopyButton.tsx): the icon-only copy button of
// prompts and the API playground, drawn like the classic code block's.
//
//   .dcp-copy-button     the button; data-copied once copied
//
// A design rule in both designs, so it keeps winning its ties with the
// article's prose rules (.lucide color), which live in the design layer.
const copyButton = `.dcp-copy-button {
  box-sizing: border-box;
  appearance: none;
  margin: 0;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
  border: solid 1px var(--color-grayLight);
  box-shadow: 0 0 0 0px var(--color-primary);
  background: var(--color-light);
  border-radius: 6px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dcp-copy-button:hover {
  border-color: var(--color-primary);
}

.dcp-copy-button:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primaryLight);
}

.dcp-copy-button:active {
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-copy-button svg.lucide {
  margin: 0;
  color: var(--color-grayDark);
}

.dcp-copy-button:where([data-copied]) svg.lucide {
  color: var(--color-success);
}`;

export const copyButtonStyles: DesignStyles = {
  classic: copyButton,
  modern: copyButton,
};
