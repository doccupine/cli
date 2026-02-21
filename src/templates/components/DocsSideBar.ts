export const docsSideBarTemplate = `"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Space } from "cherry-styled-components";
import {
  StyledIndexSidebar,
  StyledIndexSidebarLink,
  StyledIndexSidebarLabel,
  StyledIndexSidebarLi,
} from "@/components/layout/DocsComponents";

interface Heading {
  id: string;
  text: string;
  level: number;
}

const FALLBACK_OFFSET = 60;

function getOffset() {
  const header = document.getElementById("header");
  return (header ? header.offsetHeight : FALLBACK_OFFSET) + 20;
}

export function DocsSideBar({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const activeRef = useRef<HTMLLIElement>(null);

  const handleScroll = useCallback(() => {
    if (headings.length === 0) return;

    const headingElements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null);

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
        closestHeading.getBoundingClientRect().top - getOffset(),
      );
      for (const heading of visibleHeadings) {
        const distance = Math.abs(
          heading.getBoundingClientRect().top - getOffset(),
        );
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
      if (rect.top <= getOffset()) {
        currentActiveId = element.id;
      } else {
        break;
      }
    }
    setActiveId(currentActiveId);
  }, [headings]);

  useEffect(() => {
    if (headings.length === 0) return;
    // Set active heading from URL hash immediately on mount
    if (window.location.hash) {
      setActiveId(window.location.hash.slice(1));
    }
    // Run initial scroll check on next frame to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(handleScroll);
    // Re-check after browser finishes scrolling to hash target on new tab/page load
    const delayedId = setTimeout(handleScroll, 300);
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
      cancelAnimationFrame(rafId);
      clearTimeout(delayedId);
      clearTimeout(timeoutId);
    };
  }, [handleScroll, headings]);

  useEffect(() => {
    const el = activeRef.current;
    const container = el?.closest("[data-sidebar]") as HTMLElement | null;
    if (!el || !container) return;
    const elRect = el.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const pad = 140;
    if (elRect.bottom + pad > cRect.bottom) {
      container.scrollBy({
        top: elRect.bottom - cRect.bottom + pad,
        behavior: "smooth",
      });
    } else if (elRect.top - pad < cRect.top) {
      container.scrollBy({
        top: elRect.top - cRect.top - pad,
        behavior: "smooth",
      });
    }
  }, [activeId]);

  const handleHeadingClick = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      const elementPosition =
        element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - getOffset(),
        behavior: "smooth",
      });
    }
  };

  return (
    <StyledIndexSidebar data-sidebar>
      {headings?.length > 0 && (
        <>
          <StyledIndexSidebarLabel>On this page</StyledIndexSidebarLabel>
          <Space $size={15} />
        </>
      )}
      {headings.map((heading, index) => (
        <StyledIndexSidebarLi
          key={index}
          ref={activeId === heading.id ? activeRef : null}
          $isActive={activeId === heading.id}
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
        </StyledIndexSidebarLi>
      ))}
    </StyledIndexSidebar>
  );
}
`;
