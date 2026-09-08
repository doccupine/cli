export const sectionBarTemplate = `"use client";
import Link from "next/link";
import styled from "styled-components";
import { styledText } from "cherry-styled-components";
import { mq, Theme } from "@/app/theme";
import { useVariant } from "@/components/useVariant";
import { joinVariantSlug } from "@/utils/variants";

interface SectionConfig {
  label: string;
  slug: string;
  directory?: string;
}

interface SectionBarProps {
  sections: SectionConfig[];
  /** Section slugs that have pages in each language/version prefix; a
   *  section absent from the current prefix is not shown there. */
  variantSections?: Record<string, string[]>;
}

const StyledSectionBar = styled.nav<{ theme: Theme }>\`
  display: flex;
  order: 3;
  width: calc(100% + 20px);
  margin: 0 0 0 -10px;
  padding: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;

  &::-webkit-scrollbar {
    display: none;
  }

  \${mq("lg")} {
    padding: 0 10px;
    order: unset;
    width: 100%;
    margin: 0;
    justify-content: flex-end;
  }
\`;

const StyledSectionLink = styled(Link)<{
  theme: Theme;
  $isActive: boolean;
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
\`;

function SectionBar({ sections, variantSections }: SectionBarProps) {
  const { prefix, rest } = useVariant();
  const visibleSections = variantSections
    ? sections.filter((section) =>
        (variantSections[prefix] ?? []).includes(section.slug),
      )
    : sections;

  const activeSection = visibleSections.find((section) => {
    if (section.slug === "") return false;
    return rest === section.slug || rest.startsWith(section.slug + "/");
  });

  const activeSectionSlug = activeSection ? activeSection.slug : "";

  return (
    <StyledSectionBar>
      {visibleSections.map((section) => (
        <StyledSectionLink
          key={section.slug}
          href={"/" + joinVariantSlug(prefix, section.slug)}
          $isActive={activeSectionSlug === section.slug}
        >
          {section.label}
        </StyledSectionLink>
      ))}
    </StyledSectionBar>
  );
}

export { SectionBar };
`;
