export const docsSideBarTemplate = `"use client";
import { useCallback, useEffect, useState } from "react";
import { Space } from "cherry-styled-components/src/lib";
import {
  StyledIndexSidebar,
  StyledIndexSidebarLink,
  StyledIndexSidebarLabel,
} from "@/components/layout/DocsComponents";

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export function DocsSideBar({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>("");

  const handleScroll = useCallback(() => {
    if (headings.length === 0) return;

    const headingElements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    const windowHeight = window.innerHeight;

    const visibleHeadings = headingElements.filter((element) => {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top;
      const elementBottom = rect.bottom;
      return elementTop < windowHeight && elementBottom > -50;
    });

    if (visibleHeadings.length > 0) {
      let closestHeading = visibleHeadings[0];
      let closestDistance = Math.abs(
        closestHeading.getBoundingClientRect().top,
      );
      for (const heading of visibleHeadings) {
        const distance = Math.abs(heading.getBoundingClientRect().top);
        if (
          distance < closestDistance &&
          heading.getBoundingClientRect().top <= windowHeight * 0.3
        ) {
          closestDistance = distance;
          closestHeading = heading;
        }
      }
      setActiveId(closestHeading.id);
      return;
    }

    let currentActiveId = headings[0].id;
    for (const element of headingElements) {
      const rect = element.getBoundingClientRect();
      if (rect.top <= 0) {
        currentActiveId = element.id;
      } else {
        break;
      }
    }
    setActiveId(currentActiveId);
  }, [headings]);

  useEffect(() => {
    if (headings.length === 0) return;
    handleScroll();
    let timeoutId: NodeJS.Timeout;
    const throttledHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 50);
    };
    window.addEventListener("scroll", throttledHandleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll, headings]);

  const handleHeadingClick = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <StyledIndexSidebar>
      {headings?.length > 0 && (
        <>
          <StyledIndexSidebarLabel>On this page</StyledIndexSidebarLabel>
          <Space $size={20} />
        </>
      )}
      {headings.map((heading, index) => (
        <li
          key={index}
          style={{ paddingLeft: \`\${(heading.level - 1) * 16}px\` }}
        >
          <StyledIndexSidebarLink
            href={\`#\${heading.id}\`}
            onClick={(e) => {
              e.preventDefault();
              handleHeadingClick(heading.id);
            }}
            $isActive={activeId === heading.id}
          >
            {heading.text}
          </StyledIndexSidebarLink>
        </li>
      ))}
    </StyledIndexSidebar>
  );
}
`;
