export const searchModalContentTemplate = `"use client";
import React from "react";
import styled, { css, keyframes } from "styled-components";
import { rgba } from "polished";
import { Search } from "lucide-react";
import { mq, Theme } from "@/app/theme";
import { Spinner } from "@/components/Spinner";

export interface PageItem {
  slug: string;
  title: string;
  description?: string;
  category: string;
  section?: string;
}

export interface MergedResult {
  page: PageItem;
  snippet?: string;
}

export interface SearchModalContentProps {
  isClosing: boolean;
  closeSearch: () => void;
  onCloseAnimationEnd: () => void;
  query: string;
  setQuery: (q: string) => void;
  activeIndex: number;
  setActiveIndex: (i: number | ((prev: number) => number)) => void;
  resultsRef: React.RefObject<HTMLUListElement | null>;
  onKeyDown: (e: React.KeyboardEvent) => void;
  merged: MergedResult[];
  sectionLabels: Record<string, string>;
  isSearching: boolean;
  navigate: (slug: string) => void;
}

const ANIMATION_MS = 150;

const backdropIn = keyframes\`
  from { opacity: 0; }
  to { opacity: 1; }
\`;

const backdropOut = keyframes\`
  from { opacity: 1; }
  to { opacity: 0; }
\`;

const modalIn = keyframes\`
  from { opacity: 0; transform: scale(0.96) translateY(-8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
\`;

const modalOut = keyframes\`
  from { opacity: 1; transform: scale(1) translateY(0); }
  to { opacity: 0; transform: scale(0.96) translateY(-8px); }
\`;

const StyledBackdrop = styled.div<{ theme: Theme; $isClosing: boolean }>\`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: \${({ theme }) =>
    rgba(theme.isDark ? theme.colors.light : theme.colors.dark, 0.5)};
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  animation: \${({ $isClosing }) => ($isClosing ? backdropOut : backdropIn)}
    \${ANIMATION_MS}ms ease forwards;

  \${mq("lg")} {
    padding: 120px 20px 20px 20px;
  }
\`;

const StyledModal = styled.div<{ theme: Theme; $isClosing: boolean }>\`
  background: \${({ theme }) => theme.colors.light};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  box-shadow: \${({ theme }) => theme.shadows.xs};
  width: 100%;
  max-width: 560px;
  max-height: calc(100dvh - 40px);
  display: flex;
  flex-direction: column;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  padding-bottom: 8px;
  animation: \${({ $isClosing }) => ($isClosing ? modalOut : modalIn)}
    \${ANIMATION_MS}ms ease forwards;

  \${mq("lg")} {
    max-height: calc(100dvh - 240px);
  }
\`;

const StyledInputWrapper = styled.div<{ theme: Theme }>\`
  display: flex;
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

const StyledInput = styled.input<{ theme: Theme }>\`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: \${({ theme }) => theme.fontSizes.text.lg};
  line-height: \${({ theme }) => theme.lineHeights.text.lg};
  color: \${({ theme }) => theme.colors.dark};
  font-family: inherit;

  &::placeholder {
    color: \${({ theme }) => theme.colors.gray};
  }
\`;

const StyledResults = styled.ul<{ theme: Theme }>\`
  list-style: none;
  margin: 8px 0 0 0;
  padding: 0 8px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
\`;

const StyledResultItem = styled.li<{ theme: Theme; $isActive: boolean }>\`
  padding: 10px 12px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  cursor: pointer;
  transition: background 0.15s ease;

  \${({ $isActive, theme }) =>
    $isActive &&
    css\`
      background: \${rgba(theme.colors.primaryLight, 0.2)};
    \`}

  &:hover {
    background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.15)};
  }
\`;

const StyledResultTitle = styled.span<{ theme: Theme }>\`
  font-size: \${({ theme }) => theme.fontSizes.text.lg};
  font-weight: 500;
  color: \${({ theme }) => theme.colors.dark};
  display: block;
\`;

const StyledResultMeta = styled.span<{ theme: Theme }>\`
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  color: \${({ theme }) => theme.colors.gray};
  display: block;
  margin-top: 2px;
\`;

const StyledSnippet = styled.span<{ theme: Theme }>\`
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  color: \${({ theme }) => theme.colors.grayDark};
  display: block;
  margin-top: 4px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  & mark {
    background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.35)};
    color: inherit;
    border-radius: 4px;
    padding: 0 1px;
  }
\`;

const StyledEmpty = styled.div<{ theme: Theme }>\`
  padding: 20px 20px 12px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  color: \${({ theme }) => theme.colors.gray};
\`;

const StyledKbd = styled.kbd<{ theme: Theme }>\`
  font-size: 11px;
  font-family: inherit;
  background: \${({ theme }) => theme.colors.grayLight};
  color: \${({ theme }) => theme.colors.grayDark};
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: auto;
  font-weight: 600;
  display: none;

  \${mq("lg")} {
    display: initial;
  }
\`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightMatch(snippet: string, query: string): string {
  const escaped = escapeHtml(snippet);
  if (!query.trim()) return escaped;
  const q = escapeHtml(query.trim());
  const regex = new RegExp(
    \`(\${q.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&")})\`,
    "gi",
  );
  return escaped.replace(regex, "<mark>$1</mark>");
}

export function SearchModalContent({
  isClosing,
  closeSearch,
  onCloseAnimationEnd,
  query,
  setQuery,
  activeIndex,
  setActiveIndex,
  resultsRef,
  onKeyDown,
  merged,
  sectionLabels,
  isSearching,
  navigate,
}: SearchModalContentProps) {
  return (
    <StyledBackdrop
      $isClosing={isClosing}
      onClick={closeSearch}
      onAnimationEnd={onCloseAnimationEnd}
    >
      <StyledModal $isClosing={isClosing} onClick={(e) => e.stopPropagation()}>
        <StyledInputWrapper>
          <Search size={18} />
          <StyledInput
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search docs..."
            autoComplete="off"
            spellCheck={false}
          />
          <StyledKbd>Esc</StyledKbd>
        </StyledInputWrapper>
        {merged.length > 0 ? (
          <StyledResults ref={resultsRef}>
            {merged.map((result, index) => (
              <StyledResultItem
                key={result.page.slug + result.page.section}
                $isActive={index === activeIndex}
                onClick={() => navigate(result.page.slug)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <StyledResultTitle>{result.page.title}</StyledResultTitle>
                <StyledResultMeta>
                  {result.page.section
                    ? \`\${sectionLabels[result.page.section] || result.page.section} / \`
                    : ""}
                  {result.page.category}
                </StyledResultMeta>
                {result.snippet && (
                  <StyledSnippet
                    dangerouslySetInnerHTML={{
                      __html: highlightMatch(result.snippet, query),
                    }}
                  />
                )}
              </StyledResultItem>
            ))}
          </StyledResults>
        ) : (
          <StyledEmpty>
            {isSearching ? <Spinner size={18} /> : "No results found"}
          </StyledEmpty>
        )}
      </StyledModal>
    </StyledBackdrop>
  );
}
`;
