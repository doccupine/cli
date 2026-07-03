export const searchDocsTemplate = `"use client";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styled from "styled-components";
import { mq, Theme } from "@/app/theme";
import { interactiveStyles } from "@/components/layout/SharedStyled";
import type { PageItem, MergedResult } from "@/components/SearchModalContent";

const SearchModalContent = dynamic(
  () =>
    import("@/components/SearchModalContent").then(
      (mod) => mod.SearchModalContent,
    ),
  { ssr: false },
);

interface SectionItem {
  label: string;
  slug: string;
}

// Stable empty array so the derived contentResults keeps the same identity
// across renders when there are no hits (memo deps stay stable).
const EMPTY_RESULTS: ContentHit[] = [];

interface ContentHit {
  slug: string;
  snippet: string;
}

interface SearchContextValue {
  openSearch: () => void;
}

const SearchContext = createContext<SearchContextValue>({
  openSearch: () => {},
});

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

const StyledSearchButton = styled.button<{ theme: Theme }>\`
  \${interactiveStyles};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  display: flex;
  align-items: center;
  gap: 6px;
  background: \${({ theme }) => theme.colors.light};
  color: \${({ theme }) => theme.colors.primary};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  padding: 7px 8px;
  font-family: inherit;
  cursor: pointer;

  \${mq("lg")} {
    padding: 5px 8px;
  }

  & svg.lucide {
    color: inherit;
  }
\`;

function SearchProvider({
  pages,
  sections,
  children,
}: {
  pages: PageItem[];
  sections?: SectionItem[];
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  // Latest completed content search, keyed by the query that produced it.
  // contentResults and isSearching are derived from it at render time, so
  // the debounced-search effect never sets state synchronously (which would
  // trigger cascading renders — react-hooks/set-state-in-effect).
  const [fetched, setFetched] = useState<{
    q: string;
    results: ContentHit[];
  } | null>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const closingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const router = useRouter();

  const sectionLabels = useMemo(() => {
    const map: Record<string, string> = {};
    sections?.forEach((s) => {
      map[s.slug] = s.label;
    });
    return map;
  }, [sections]);

  const openSearch = useCallback(() => {
    closingRef.current = false;
    setIsClosing(false);
    setIsVisible(true);
  }, []);

  const closeSearch = useCallback(() => {
    closingRef.current = true;
    setIsClosing(true);
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const handleCloseAnimationEnd = useCallback(() => {
    if (!closingRef.current) return;
    closingRef.current = false;
    setIsVisible(false);
    setIsClosing(false);
    setQuery("");
    setActiveIndex(0);
    setFetched(null);
  }, []);

  const trimmedQuery = query.trim();
  const contentResults =
    trimmedQuery.length >= 2 && fetched?.q === trimmedQuery
      ? fetched.results
      : EMPTY_RESULTS;
  const isSearching = trimmedQuery.length >= 2 && fetched?.q !== trimmedQuery;

  // Instant title/description filtering
  const titleFiltered = useMemo(() => {
    if (!query.trim()) return pages;
    const q = query.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    );
  }, [pages, query]);

  // Merge title matches with content matches
  const merged = useMemo<MergedResult[]>(() => {
    if (!query.trim()) {
      return pages.map((p) => ({ page: p }));
    }

    const titleMatchSlugs = new Set(titleFiltered.map((p) => p.slug));
    const titleMatches: MergedResult[] = titleFiltered.map((p) => {
      const hit = contentResults.find((cr) => cr.slug === p.slug);
      return { page: p, snippet: hit?.snippet };
    });

    const pageMap = new Map(pages.map((p) => [p.slug, p]));
    const contentOnly: MergedResult[] = [];
    for (const cr of contentResults) {
      if (!titleMatchSlugs.has(cr.slug)) {
        const page = pageMap.get(cr.slug);
        if (page) {
          contentOnly.push({ page, snippet: cr.snippet });
        }
      }
    }

    return [...titleMatches, ...contentOnly];
  }, [pages, query, titleFiltered, contentResults]);

  // Debounced content search. State updates happen only inside the timeout's
  // async callback; short queries need no reset because the derived values
  // above ignore results whose query no longer matches.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const q = query.trim();
    if (q.length < 2) return;

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          \`/api/search?q=\${encodeURIComponent(q)}&limit=15\`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setFetched({ q, results: data.results ?? [] });
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setFetched({ q, results: [] });
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const navigate = useCallback(
    (slug: string) => {
      closeSearch();
      router.push(\`/\${slug}\`);
    },
    [closeSearch, router],
  );

  // Global Cmd+K / Ctrl+K listener
  const isVisibleRef = useRef(false);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isVisibleRef.current) {
          closeSearch();
        } else {
          openSearch();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeSearch, openSearch]);

  // Scroll active item into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const active = resultsRef.current.children[activeIndex] as HTMLElement;
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < merged.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : merged.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (merged[activeIndex]) {
        navigate(merged[activeIndex].page.slug);
      }
    } else if (e.key === "Escape") {
      closeSearch();
    }
  }

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      {isVisible && (
        <SearchModalContent
          isClosing={isClosing}
          closeSearch={closeSearch}
          onCloseAnimationEnd={handleCloseAnimationEnd}
          query={query}
          setQuery={setQuery}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          resultsRef={resultsRef}
          onKeyDown={handleKeyDown}
          merged={merged}
          sectionLabels={sectionLabels}
          isSearching={isSearching}
          navigate={navigate}
        />
      )}
    </SearchContext.Provider>
  );
}

export {
  SearchProvider,
  SearchContext,
  StyledKbd as SearchKbd,
  StyledSearchButton,
};
`;
