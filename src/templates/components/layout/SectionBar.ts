export const sectionBarTemplate = `"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { styledText } from "cherry-styled-components";
import { mq, Theme } from "@/app/theme";

interface SectionConfig {
  label: string;
  slug: string;
  directory?: string;
}

interface SectionBarProps {
  sections: SectionConfig[];
}

const StyledSectionBar = styled.nav<{ theme: Theme }>\`
  display: flex;
  order: 3;
  width: calc(100% + 20px);
  margin: 0 0 0 -20px;
  padding: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;

  &::-webkit-scrollbar {
    display: none;
  }

  \${mq("lg")} {
    padding: 0 20px;
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
  padding: 16px 20px;
  white-space: nowrap;
  font-weight: \${({ $isActive }) => ($isActive ? "600" : "500")};
  color: \${({ theme, $isActive }) =>
    $isActive ? theme.colors.primary : theme.colors.gray};
  border-bottom: solid 2px
    \${({ theme, $isActive }) =>
      $isActive ? theme.colors.primary : "transparent"};
  transition: all 0.3s ease;
  min-width: fit-content;

  &:hover {
    color: \${({ theme }) => theme.colors.primary};
  }
\`;

function SectionBar({ sections }: SectionBarProps) {
  const pathname = usePathname();
  const currentPath = pathname.replace(/^\\//, "").replace(/\\/$/, "");

  const activeSection = sections.find((section) => {
    if (section.slug === "") return false;
    return (
      currentPath === section.slug || currentPath.startsWith(section.slug + "/")
    );
  });

  const activeSectionSlug = activeSection ? activeSection.slug : "";

  return (
    <StyledSectionBar>
      {sections.map((section) => (
        <StyledSectionLink
          key={section.slug}
          href={section.slug === "" ? "/" : \`/\${section.slug}\`}
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
