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
import styled, { css, keyframes } from "styled-components";
import { rgba } from "polished";
import { Search } from "lucide-react";
import { mq, Theme } from "@/app/theme";
import { interactiveStyles } from "@/components/layout/SharedStyled";

interface PageItem {
  slug: string;
  title: string;
  description?: string;
  category: string;
  section?: string;
}

interface SearchContextValue {
  openSearch: () => void;
}

const SearchContext = createContext<SearchContextValue>({
  openSearch: () => {},
});

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

const StyledEmpty = styled.div<{ theme: Theme }>\`
  padding: 20px;
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
  children,
}: {
  pages: PageItem[];
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const closingTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const router = useRouter();

  const openSearch = useCallback(() => {
    if (closingTimer.current) clearTimeout(closingTimer.current);
    setIsClosing(false);
    setIsVisible(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsClosing(true);
    closingTimer.current = setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setQuery("");
      setActiveIndex(0);
    }, ANIMATION_MS);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return pages;
    const q = query.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    );
  }, [pages, query]);

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

  // Focus input on open
  useEffect(() => {
    if (isVisible && !isClosing) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isVisible, isClosing]);

  // Scroll active item into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const active = resultsRef.current.children[activeIndex] as HTMLElement;
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) {
        navigate(filtered[activeIndex].slug);
      }
    } else if (e.key === "Escape") {
      closeSearch();
    }
  }

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      {isVisible && (
        <StyledBackdrop $isClosing={isClosing} onClick={closeSearch}>
          <StyledModal
            $isClosing={isClosing}
            onClick={(e) => e.stopPropagation()}
          >
            <StyledInputWrapper>
              <Search size={18} />
              <StyledInput
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search docs..."
                autoComplete="off"
                spellCheck={false}
              />
              <StyledKbd>Esc</StyledKbd>
            </StyledInputWrapper>
            {filtered.length > 0 ? (
              <StyledResults ref={resultsRef}>
                {filtered.map((page, index) => (
                  <StyledResultItem
                    key={page.slug + page.section}
                    $isActive={index === activeIndex}
                    onClick={() => navigate(page.slug)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <StyledResultTitle>{page.title}</StyledResultTitle>
                    <StyledResultMeta>
                      {page.section ? \`\${page.section} / \` : ""}
                      {page.category}
                    </StyledResultMeta>
                  </StyledResultItem>
                ))}
              </StyledResults>
            ) : (
              <StyledEmpty>No results found</StyledEmpty>
            )}
          </StyledModal>
        </StyledBackdrop>
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
