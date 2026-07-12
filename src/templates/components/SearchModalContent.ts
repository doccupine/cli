export const searchModalContentTemplate = `"use client";
import React from "react";
import styled, { css, keyframes } from "styled-components";
import { Search, X } from "lucide-react";
import { IconButton } from "cherry-styled-components";
import { mq, Theme } from "@/app/theme";
import { Spinner } from "@/components/Spinner";
import {
  interactiveStyles,
  thinScrollbar,
} from "@/components/layout/SharedStyled";

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
  navigate: (
    slug: string,
    modifiers?: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean },
  ) => void;
  canAskAssistant: boolean;
  onAskAssistant: () => void;
}

const ANIMATION_MS = 300;

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
  /* Backdrop is intentionally near-black in both modes — covers everything
     behind the modal regardless of the user's theme. */
  background: rgba(0, 0, 0, 0.5);
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

// "Ask AI" affordance shown before the close button when the AI chat is
// enabled. Desktop-only (like the header's Cmd+K hint) since it advertises the
// Option+Enter shortcut; mobile users reach the assistant from the header CTA.
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
  padding: 5px 8px;
  font-family: inherit;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;

    &:hover {
      border-color: \${({ theme }) => theme.colors.grayLight};
    }
  }

  \${mq("lg")} {
    display: inline-flex;
  }
\`;

const StyledAskKeys = styled.span\`
  display: inline-flex;
  align-items: center;
  gap: 3px;
\`;

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

// The return glyph's ink sits high in its em box, so it reads top-aligned even
// when the keycap flex-centers it. Nudge just the character (not the pill) down
// a pixel so it optically centers and lines up with the option glyph.
const StyledReturnGlyph = styled.span\`
  display: inline-block;
  transform: translateY(1.5px);
\`;

const StyledResults = styled.ul<{ theme: Theme }>\`
  list-style: none;
  position: relative;
  margin: 8px 0 0 0;
  padding: 0 8px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  \${thinScrollbar};

  /* The results list is a keyboard-focusable scroll container; frame it with
     the app focus ring (inset so it hugs the visible viewport and isn't clipped
     by the scroll overflow) instead of the browser's default outline. */
  &:focus-visible {
    outline: none;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    box-shadow: inset 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;

// Single indicator that slides between result items instead of each item
// fading its own background in and out. Positioned/sized inline from the active
// item's measured offset (see the layout effect below); the transition on
// transform + height produces the up/down glide as the active item changes.
const StyledHighlight = styled.div<{ theme: Theme }>\`
  position: absolute;
  left: 8px;
  right: 8px;
  top: 0;
  z-index: 0;
  pointer-events: none;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.primaryLight} 20%, transparent)\`};
  transition:
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, height;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
\`;

const StyledResultItem = styled.li<{ theme: Theme; $isActive: boolean }>\`
  position: relative;
  z-index: 1;
  padding: 10px 12px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  cursor: pointer;

  \${({ $isActive, theme }) =>
    $isActive &&
    css\`
      & > span:first-of-type {
        color: \${theme.colors.primary};
      }
    \`}
\`;

const StyledResultTitle = styled.span<{ theme: Theme }>\`
  font-size: \${({ theme }) => theme.fontSizes.text.lg};
  font-weight: 500;
  color: \${({ theme }) => theme.colors.dark};
  display: block;
  transition: color 0.15s ease;
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
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.primaryLight} 35%, transparent)\`};
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
  canAskAssistant,
  onAskAssistant,
}: SearchModalContentProps) {
  // Measure the active item so the sliding highlight can be placed over it.
  // useLayoutEffect runs before paint, so the first position is committed
  // without a transition (no slide-in on open); later activeIndex/hover
  // changes glide because only the transform + height differ.
  const [indicator, setIndicator] = React.useState<{
    top: number;
    height: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    const list = resultsRef.current;
    if (!list) {
      setIndicator(null);
      return;
    }
    const items = list.querySelectorAll("li");
    const active = items[activeIndex] as HTMLElement | undefined;
    if (!active) {
      setIndicator(null);
      return;
    }
    setIndicator({ top: active.offsetTop, height: active.offsetHeight });

    // Keep the active row inside the scroll viewport in the SAME pre-paint pass
    // that positions the highlight, so the two never desync into a one-frame
    // flicker. merged is a dependency, so re-filtering (a new query) also
    // re-scrolls the reset active row into view even when its index is
    // unchanged. This list is flat (no group headers), so no header inclusion
    // is needed; a small margin keeps rows off the container's hard edges.
    // Adjust scrollTop directly (never scrollIntoView, which can also pan
    // ancestors).
    const margin = 8;
    const viewTop = active.offsetTop - margin;
    const viewBottom = active.offsetTop + active.offsetHeight + margin;

    if (viewTop < list.scrollTop) {
      list.scrollTop = viewTop;
    } else if (viewBottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = viewBottom - list.clientHeight;
    }
  }, [activeIndex, merged, resultsRef]);

  return (
    <StyledBackdrop
      $isClosing={isClosing}
      onClick={closeSearch}
      onAnimationEnd={(e) => {
        // animationend bubbles, so this handler also fires for animations
        // completing on descendants (the inner modal, icons, result items).
        // Only the backdrop's own exit animation should trigger the unmount -
        // otherwise a child finishing its animation first tears the modal down
        // before the close animation plays, making it vanish instantly.
        if (e.target === e.currentTarget) onCloseAnimationEnd();
      }}
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
          {canAskAssistant && (
            <StyledAskAssistant
              type="button"
              onClick={onAskAssistant}
              disabled={!query.trim()}
              aria-label="Ask AI"
              title="Ask AI"
            >
              Ask AI
              <StyledAskKeys aria-hidden="true">
                <StyledAskKbd>&#8997;</StyledAskKbd>
                <StyledAskKbd>
                  <StyledReturnGlyph>&#8629;</StyledReturnGlyph>
                </StyledAskKbd>
              </StyledAskKeys>
            </StyledAskAssistant>
          )}
          <IconButton
            onClick={closeSearch}
            aria-label="Close search"
            title="Close search"
          >
            <X />
          </IconButton>
        </StyledInputWrapper>
        {merged.length > 0 ? (
          <StyledResults ref={resultsRef}>
            {indicator && (
              <StyledHighlight
                aria-hidden="true"
                style={{
                  transform: \`translateY(\${indicator.top}px)\`,
                  height: \`\${indicator.height}px\`,
                }}
              />
            )}
            {merged.map((result, index) => (
              <StyledResultItem
                key={result.page.slug + result.page.section}
                $isActive={index === activeIndex}
                onClick={(e) => navigate(result.page.slug, e)}
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
