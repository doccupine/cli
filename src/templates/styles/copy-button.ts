import type { DesignStyles } from "./index.js";
import { squareButtonRules } from "./controls.js";

// CopyButton (components/layout/CopyButton.tsx): the icon-only copy button of
// prompts and the API playground: the shared 32px ghost square, like the
// dialogs' close buttons and the code blocks' copy button.
//
//   .dcp-copy-button     the button; data-copied once copied
//
// A design rule in both designs, so it keeps winning its ties with the
// article's prose rules (.lucide color), which live in the design layer.
const copyButton = `${squareButtonRules(".dcp-copy-button")}

/* svg.lucide outranks the article's own icon color (.dcp-docs .lucide). */
.dcp-copy-button svg.lucide {
  margin: 0;
  color: var(--color-grayDark);
}

.dcp-copy-button:hover svg.lucide {
  color: var(--color-dark);
}

.dcp-copy-button:where([data-copied]) svg.lucide,
.dcp-copy-button:where([data-copied]):hover svg.lucide {
  color: var(--color-success);
}`;

export const copyButtonStyles: DesignStyles = {
  classic: copyButton,
  modern: copyButton,
};
