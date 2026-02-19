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
  position: fixed;
  top: 70px;
  left: 0;
  width: 100%;
  z-index: 999;
  display: flex;
  padding: 0 20px;
  background: \${({ theme }) => theme.colors.light};
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  \${mq("lg")} {
    padding: 0 40px;
  }
\`;

const StyledSectionLink = styled(Link)<{
  theme: Theme;
  $isActive: boolean;
}>\`
  \${({ theme }) => styledText(theme)};
  text-decoration: none;
  padding: 12px 16px;
  white-space: nowrap;
  font-weight: \${({ $isActive }) => ($isActive ? "600" : "400")};
  color: \${({ theme, $isActive }) =>
    $isActive ? theme.colors.primary : theme.colors.grayDark};
  border-bottom: solid 2px
    \${({ theme, $isActive }) =>
      $isActive ? theme.colors.primary : "transparent"};
  transition: all 0.2s ease;

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
