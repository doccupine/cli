export const searchModalContentTemplate = `"use client";
import React from "react";
import { Search, X } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { useStrings } from "@/components/useStrings";
import { withCount } from "@/utils/strings";

export interface PageItem {
  slug: string;
  title: string;
  description?: string;
  category: string;
  section?: string;
  locale?: string;
  version?: string;
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
  shouldRestoreFocus: () => boolean;
  returnFocusTo: HTMLElement | null;
}

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

/**
 * The search window: a native modal <dialog> (styled in app/styles, see
 * .dcp-search) covering the page, with the panel inside it. The browser keeps
 * the rest of the page inert and the dialog on top; this component adds the
 * exit animation (data-closing, unmounted by SearchDocs when it ends), the combobox keyboard model, and focus
 * handling: the input takes focus on open, Tab cycles inside the window, and
 * focus returns to the opener on close.
 */
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
  shouldRestoreFocus,
  returnFocusTo,
}: SearchModalContentProps) {
  const dialogRef = React.useRef<HTMLDialogElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(
    returnFocusTo?.isConnected === true
      ? returnFocusTo
      : typeof document === "undefined"
        ? null
        : (document.activeElement as HTMLElement | null),
  );
  const listboxId = React.useId();
  const optionId = (index: number) => listboxId + "-option-" + index;
  const t = useStrings();

  // Open as a modal before the first paint, so the layout effect below
  // measures the rows of a rendered window.
  React.useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = previouslyFocusedRef.current;
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog?.contains(event.target)) {
        inputRef.current?.focus();
      }
    };

    document.addEventListener("focusin", containFocus);
    inputRef.current?.focus();

    return () => {
      document.removeEventListener("focusin", containFocus);
      if (shouldRestoreFocus() && previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [shouldRestoreFocus]);

  const handleDialogKeyDown = (
    event: React.KeyboardEvent<HTMLDialogElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeSearch();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter(
      (element) =>
        element.offsetParent !== null &&
        element.getAttribute("aria-hidden") !== "true",
    );

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

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
    // The click handler only closes on the dimmed layer around the panel;
    // the keyboard closes the window with Esc (handleDialogKeyDown).
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      className="dcp-search"
      data-closing={isClosing || undefined}
      aria-modal="true"
      aria-label={t.searchDialog}
      data-search-dialog
      onKeyDownCapture={handleDialogKeyDown}
      onClick={(e) => {
        // A click on the dimmed layer around the panel.
        if (e.target === e.currentTarget) closeSearch();
      }}
      onCancel={(e) => {
        // Esc: run the animated close instead of the browser's instant one.
        e.preventDefault();
        closeSearch();
      }}
      onClose={() => {
        // The browser closed the dialog without the animation (a repeated
        // Esc it would not let us cancel): finish closing right away.
        if (!isClosing) closeSearch();
        onCloseAnimationEnd();
      }}
      onAnimationEnd={(e) => {
        // animationend bubbles, so this also fires for animations ending on
        // descendants. Only the dialog's own exit animation unmounts it;
        // otherwise a child finishing first would tear the window down
        // before the close animation plays.
        if (e.target === e.currentTarget && isClosing) onCloseAnimationEnd();
      }}
    >
      <div className="dcp-search__panel">
        <div className="dcp-search__input-row">
          <Search size={18} />
          <input
            ref={inputRef}
            className="dcp-search__input"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={t.searchPlaceholder}
            autoComplete="off"
            spellCheck={false}
            aria-label={t.searchDialog}
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={
              merged[activeIndex] ? optionId(activeIndex) : undefined
            }
          />
          {canAskAssistant && (
            <button
              type="button"
              className="dcp-search__ask"
              onClick={onAskAssistant}
              disabled={!query.trim()}
              aria-label={t.askAi}
              title={t.askAi}
            >
              {t.askAi}
              <span className="dcp-search__ask-keys" aria-hidden="true">
                <kbd className="dcp-search__kbd">&#8997;</kbd>
                <kbd className="dcp-search__kbd">
                  <span className="dcp-search__return-glyph">&#8629;</span>
                </kbd>
              </span>
            </button>
          )}
          <button
            type="button"
            className="dcp-search__close"
            onClick={closeSearch}
            aria-label={t.closeSearch}
            title={t.closeSearch}
          >
            <X />
          </button>
        </div>
        <div
          className="dcp-visually-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {isSearching
            ? t.searching
            : merged.length === 0
              ? t.noResults
              : merged.length === 1
                ? t.resultAvailable
                : withCount(t.resultsAvailable, merged.length)}
        </div>
        <ul
          ref={resultsRef}
          className="dcp-search__results dcp-thin-scrollbar"
          id={listboxId}
          role="listbox"
          aria-label={t.searchResults}
          aria-busy={isSearching}
          hidden={merged.length === 0}
        >
          {indicator && (
            <div
              className="dcp-search__highlight"
              aria-hidden="true"
              style={
                {
                  "--dcp-highlight-top": \`\${indicator.top}px\`,
                  "--dcp-highlight-height": \`\${indicator.height}px\`,
                } as React.CSSProperties
              }
            />
          )}
          {merged.map((result, index) => (
            // The combobox input drives the keyboard (aria-activedescendant).
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <li
              key={result.page.slug + result.page.section}
              className="dcp-search__result"
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              data-active={index === activeIndex || undefined}
              onClick={(e) => navigate(result.page.slug, e)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className="dcp-search__result-title">
                {result.page.title}
              </span>
              <span className="dcp-search__result-meta">
                {result.page.section
                  ? \`\${sectionLabels[result.page.section] || result.page.section} / \`
                  : ""}
                {result.page.category}
              </span>
              {result.snippet && (
                <span
                  className="dcp-search__snippet"
                  dangerouslySetInnerHTML={{
                    __html: highlightMatch(result.snippet, query),
                  }}
                />
              )}
            </li>
          ))}
        </ul>
        {merged.length === 0 && (
          <div className="dcp-search__empty" aria-hidden="true">
            {isSearching ? (
              <>
                <Spinner size={18} /> {t.searching}...
              </>
            ) : (
              t.noResults
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
`;
