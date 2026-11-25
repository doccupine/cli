import type { DesignStyles } from "./index.js";

// <Kbd> (components/layout/Kbd.tsx): key caps, inline.
//
//   .dcp-kbd         one key cap (<kbd>)
//   .dcp-kbd-combo   a key combination: a <kbd> holding a cap per key
//   .dcp-kbd__other  the cap most keyboards print
//   .dcp-kbd__mac    the Mac keyboard's cap, shown instead when the pre-paint
//                    script marked <html data-os="mac">
//
// The rules sit in the design layer after the article prose (docs.ts), whose
// ".dcp-docs kbd" draws bare <kbd> elements like inline code: kbd.dcp-kbd has
// the same specificity and comes later, so the cap wins.
const css = `kbd.dcp-kbd {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 1.75em;
  height: 1.75em;
  /* Hug the key even when it stands alone on its own line, where MDX puts it
     straight in the article's stretching column instead of a paragraph. */
  width: fit-content;
  align-self: flex-start;
  max-width: none;
  margin: 0;
  padding: 0 0.4em;
  border: solid 1px var(--color-grayLight);
  border-bottom-width: 2px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-dark) 3%, var(--color-light));
  color: var(--color-dark);
  font-family: inherit;
  font-size: 0.8em;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  vertical-align: 0.1em;
}

kbd.dcp-kbd-combo {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  width: fit-content;
  align-self: flex-start;
  max-width: none;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  font-size: inherit;
  white-space: nowrap;
}

.dcp-kbd__mac {
  display: none;
}

:root[data-os="mac"] .dcp-kbd__mac {
  display: inline;
}

:root[data-os="mac"] .dcp-kbd__other {
  display: none;
}`;

export const kbdStyles: DesignStyles = { classic: css, modern: css };
