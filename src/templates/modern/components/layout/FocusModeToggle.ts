import { deriveTemplate } from "../../../../lib/derive-template.js";
import { focusModeToggleTemplate } from "../../../components/layout/FocusModeToggle.js";

// The classic FocusModeToggle.tsx with the modern design's edits: the button
// takes the round 32px look of the page header's markdown link. Its behavior,
// fixed placement and labels are the classic ones.
export const modernFocusModeToggleTemplate = deriveTemplate(
  "modern components/layout/FocusModeToggle.tsx",
  focusModeToggleTemplate,
  [
    [
      `import { interactiveStyles } from "@/components/layout/SharedStyled";`,
      `import { inkMix, roundControlStyles } from "@/components/layout/SharedStyled";`,
    ],
    [
      `    \${resetButton};
    \${interactiveStyles};
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    /* Above the sidebar (99) so it stays clickable once the rails are out,
       below the chat panel (1000). */
    z-index: 100;
    /* Left end of the sidebar footer row, flush with the footer's left
       padding; the switchers follow and the ThemeToggle holds the right end,
       all of them 30px tall. */
    left: 20px;
    bottom: 16px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: \${({ theme }) => theme.colors.light};
    border-color: \${({ theme }) => theme.colors.grayLight};

    & svg {
      width: 16px;
      height: 16px;
    }

    & svg[stroke] {
      stroke: \${({ theme }) => theme.colors.primary};
    }

    &:hover svg[stroke] {
      stroke: \${({ theme }) => theme.colors.accent};
    }
  }`,
      `    \${resetButton};
    \${roundControlStyles};
    position: fixed;
    /* Above the sidebar (99) so it stays clickable once the rails are out,
       below the chat panel (1000). */
    z-index: 100;
    /* Left end of the sidebar footer row, which leaves room for it; the
       switchers follow and the theme toggle holds the right end. */
    left: 20px;
    bottom: 16px;
    /* Opaque, since it stays over the page once the sidebar slides away. */
    background: \${({ theme }) => theme.colors.light};

    &:hover {
      background: \${({ theme }) => inkMix(theme, 4)};
    }
  }`,
    ],
  ],
);
