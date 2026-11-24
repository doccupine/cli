import { deriveTemplate } from "../../../lib/derive-template.js";
import { searchModalContentTemplate } from "../../components/SearchModalContent.js";

// The classic SearchModalContent.tsx with the modern design's edits.
export const modernSearchModalContentTemplate = deriveTemplate(
  "modern components/SearchModalContent.tsx",
  searchModalContentTemplate,
  [
    [
      `import { withCount } from "@/utils/strings";
import {
  interactiveStyles,
  thinScrollbar,
} from "@/components/layout/SharedStyled";

export interface PageItem {`,
      `import { withCount } from "@/utils/strings";
import {
  pillControlStyles,
  thinScrollbar,
} from "@/components/layout/SharedStyled";
import { HEADER_HEIGHT } from "@/components/layout/designTokens";

export interface PageItem {`,
    ],
    [
      `const StyledModal = styled.div<{ theme: Theme; $isClosing: boolean }>\`
  background: \${({ theme }) => theme.colors.light};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  box-shadow: \${({ theme }) => theme.shadows.xs};
  width: 100%;
  max-width: 560px;
  max-height: calc(100dvh - 40px);
  display: flex;`,
      `const StyledModal = styled.div<{ theme: Theme; $isClosing: boolean }>\`
  background: \${({ theme }) => theme.colors.light};
  border-radius: \${({ theme }) => \`calc(\${theme.spacing.radius.lg} + 4px)\`};
  box-shadow: \${({ theme }) => theme.shadows.xs};
  overflow: hidden;
  width: 100%;
  max-width: 600px;
  max-height: calc(100dvh - 40px);
  display: flex;`,
    ],
    [
      `  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  flex-shrink: 0;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};

  & svg.lucide {
    color: \${({ theme }) => theme.colors.gray};
    flex-shrink: 0;
  }
\`;
`,
      `  display: flex;
  align-items: center;
  gap: 8px;
  min-height: \${HEADER_HEIGHT}px;
  padding: 0 12px 0 16px;
  flex-shrink: 0;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};

  & > svg.lucide {
    width: 16px;
    height: 16px;
    margin-right: 4px;
    color: \${({ theme }) => theme.colors.grayDark};
    flex-shrink: 0;
  }

  /* The close button (Cherry's IconButton): a 32px ghost square like the
     chat panel's header actions. Doubled to outrank Cherry's own fill,
     border and focus ring; the ring shows on keyboard focus only. */
  && > button:last-child {
    /* An exact 32px square whatever Cherry's IconButton sizing says; the
       hover fill and focus ring take the sidebar row's rounded square. */
    box-sizing: border-box;
    width: 32px;
    height: 32px;
    min-width: 32px;
    max-width: 32px;
    min-height: 32px;
    max-height: 32px;
    padding: 0;
    flex-shrink: 0;
    border: solid 1px transparent;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    background: transparent;
    color: \${({ theme }) => theme.colors.grayDark};
    box-shadow: none;
    transition:
      color 0.2s ease,
      background-color 0.2s ease;

    & svg {
      width: 16px;
      height: 16px;
      color: inherit;
    }

    &:hover {
      color: \${({ theme }) => theme.colors.dark};
      border-color: transparent;
      background: \${({ theme }) =>
        \`color-mix(in srgb, \${theme.colors.dark} 6%, transparent)\`};
    }

    &:focus,
    &:active {
      border-color: transparent;
      box-shadow: none;
    }

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
    }
  }
\`;
`,
    ],
    [
      `  outline: none;
  background: transparent;
  font-size: \${({ theme }) => theme.fontSizes.text.lg};
  line-height: \${({ theme }) => theme.lineHeights.text.lg};
  color: \${({ theme }) => theme.colors.dark};
  font-family: inherit;`,
      `  outline: none;
  background: transparent;
  font-size: 16px;
  line-height: 24px;
  color: \${({ theme }) => theme.colors.dark};
  font-family: inherit;`,
    ],
    [
      `// Option+Enter shortcut; mobile users reach the assistant from the header CTA.
const StyledAskAssistant = styled.button<{ theme: Theme }>\`
  \${interactiveStyles};
  display: none;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  background: \${({ theme }) => theme.colors.light};
  color: \${({ theme }) => theme.colors.grayDark};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  padding: 5px 4px 5px 8px;
  font-family: inherit;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;

  &:disabled {`,
      `// Option+Enter shortcut; mobile users reach the assistant from the header CTA.
const StyledAskAssistant = styled.button<{ theme: Theme }>\`
  \${pillControlStyles};
  display: none;
  flex-shrink: 0;
  padding: 0 6px 0 12px;

  &:disabled {`,
    ],
    [
      `
    &:hover {
      border-color: \${({ theme }) => theme.colors.grayLight};
    }

    &:focus,
    &:active {
      outline: none;
      box-shadow: 0 0 0 0 \${({ theme }) => theme.colors.primaryLight};
    }
  }`,
      `
    &:hover {
      color: \${({ theme }) => theme.colors.grayDark};
      border-color: \${({ theme }) => theme.colors.grayLight};
      background: transparent;
    }
  }`,
    ],
    [
      `\`;

const StyledAskKbd = styled.kbd<{ theme: Theme }>\`
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: \${({ theme }) => theme.colors.grayLight};
  color: \${({ theme }) => theme.colors.grayDark};
  border-radius: 4px;
\`;
`,
      `\`;

// Key hints: small rounded hairline chips, like the header's Cmd+K hint.
const StyledAskKbd = styled.kbd<{ theme: Theme }>\`
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  color: \${({ theme }) => theme.colors.grayDark};
  border-radius: \${({ theme }) => theme.spacing.radius.xl};
\`;
`,
    ],
    [
      `  pointer-events: none;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.primaryLight} 20%, transparent)\`};
  transition:
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),`,
      `  pointer-events: none;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  /* The sidebar's current-page wash. */
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.accent} 7%, transparent)\`};
  transition:
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),`,
    ],
    [
      `    css\`
      & > span:first-of-type {
        color: \${theme.colors.primary};
      }
    \`}`,
      `    css\`
      & > span:first-of-type {
        color: \${theme.colors.accent};
      }
    \`}`,
    ],
  ],
);
