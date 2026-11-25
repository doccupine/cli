import { deriveTemplate } from "../../../../lib/derive-template.js";
import { sectionBarTemplate } from "../../../components/layout/SectionBar.js";

// The classic SectionBar.tsx with the modern design's edits.
export const modernSectionBarTemplate = deriveTemplate(
  "modern components/layout/SectionBar.tsx",
  sectionBarTemplate,
  [
    [
      `import Link from "next/link";
import styled from "styled-components";
import { styledText } from "cherry-styled-components";
import { mq, Theme } from "@/app/theme";
import { useVariant } from "@/components/useVariant";
import { joinVariantSlug } from "@/utils/variants";

interface SectionConfig {`,
      `import Link from "next/link";
import styled from "styled-components";
import { mq, Theme } from "@/app/theme";
import { useVariant } from "@/components/useVariant";
import { joinVariantSlug } from "@/utils/variants";
import {
  COLUMN_GUTTER,
  HEADER_HEIGHT,
  HEADER_HEIGHT_WITH_SECTIONS,
  HEADER_MENU_SLOT,
} from "@/components/layout/designTokens";

interface SectionConfig {`,
    ],
    [
      `}

const StyledSectionBar = styled.nav<{ theme: Theme }>\`
  display: flex;
  order: 3;
  width: calc(100% + 20px);
  margin: 0 0 0 -10px;
  padding: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;`,
      `}

// Soft pills: centered in the header from "lg", a scrolling second row of
// the header below it. The active section reads as a quiet gray fill.
const StyledSectionBar = styled.nav<{ theme: Theme }>\`
  display: flex;
  align-items: center;
  gap: 4px;
  order: 3;
  width: calc(100% + \${HEADER_MENU_SLOT + 2 * COLUMN_GUTTER}px);
  height: \${HEADER_HEIGHT_WITH_SECTIONS - HEADER_HEIGHT}px;
  margin: 0 -\${HEADER_MENU_SLOT + COLUMN_GUTTER}px 0 -\${COLUMN_GUTTER}px;
  /* The pills start on the page gutter, like the logo and the content. */
  padding: 0 0 6px \${COLUMN_GUTTER}px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;`,
    ],
    [
      `  }

  \${mq("lg")} {
    padding: 0 10px;
    order: unset;
    width: 100%;
    margin: 0;
    justify-content: flex-end;
  }
\`;`,
      `  }

  /* The same gutter after the last pill once the row scrolls to its end (a
     spacer, because scroll containers do not reliably keep end padding). */
  &::after {
    content: "";
    flex: 0 0 \${COLUMN_GUTTER - 4}px;
    height: 1px;
  }

  \${mq("lg")} {
    order: unset;
    width: auto;
    height: auto;
    margin: 0;
    padding: 0;
    overflow: visible;

    &::after {
      display: none;
    }
  }
\`;`,
    ],
    [
      `  $isActive: boolean;
}>\`
  \${({ theme }) => styledText(theme)};
  text-decoration: none;
  padding: 16px 10px;
  white-space: nowrap;
  font-weight: \${({ $isActive }) => ($isActive ? "600" : "500")};
  color: \${({ theme, $isActive }) =>
    $isActive ? theme.colors.primary : theme.colors.gray};
  border-bottom: solid 2px
    \${({ theme, $isActive }) =>
      $isActive ? theme.colors.primary : "transparent"};
  transition: all 0.3s ease;
  min-width: fit-content;
  position: relative;

  /* The section bar scrolls horizontally, and overflow-x:auto makes it clip
     vertically too, so an edge-drawn ring gets shaved top and bottom. Draw the
     ring on an inset pseudo-element so it sits fully inside the link and can't
     be clipped on any side. */
  &:focus-visible {
    outline: none;
    /* Opt out of the global a:focus-visible ring; the ::after below draws it
       inset so the scroll container can't clip it. */
    box-shadow: none;
  }

  &:focus-visible::after {
    content: "";
    position: absolute;
    inset: 3px;
    border: solid 2px \${({ theme }) => theme.colors.primaryLight};
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    pointer-events: none;
  }

  &:hover {
    color: \${({ theme }) => theme.colors.primary};
  }
\`;`,
      `  $isActive: boolean;
}>\`
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 20px;
  text-decoration: none;
  padding: 6px 12px;
  white-space: nowrap;
  border-radius: \${({ theme }) => theme.spacing.radius.xl};
  font-weight: 500;
  color: \${({ theme, $isActive }) =>
    $isActive ? theme.colors.dark : theme.colors.grayDark};
  background: \${({ theme, $isActive }) =>
    $isActive
      ? \`color-mix(in srgb, \${theme.colors.dark} 6%, transparent)\`
      : "transparent"};
  transition: all 0.3s ease;
  min-width: fit-content;
  position: relative;

  /* The ring is inset so the horizontally scrolling bar below "lg" cannot
     clip it. */
  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }

  &:hover {
    color: \${({ theme }) => theme.colors.dark};
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 4%, transparent)\`};
  }
\`;`,
    ],
  ],
);
