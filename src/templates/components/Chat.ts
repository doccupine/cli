export const chatTemplate = `"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { IconButton } from "cherry-styled-components";
import { ArrowUp, LoaderPinwheel, RotateCcw, Sparkles, X } from "lucide-react";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { theme } from "@/app/theme";
import {
  StyledAnswer,
  StyledChat,
  StyledChatForm,
  StyledChatSurface,
  StyledChatTitle,
  StyledChatTitleIconWrapper,
  StyledError,
  StyledGlowSmallButton,
  StyledLoading,
  StyledRainbowButton,
  StyledRainbowInput,
  StyledRainbowInputWrapper,
  StyledSourceLink,
  StyledSources,
  StyledSparkle,
  StyledSparkleContainer,
} from "@/components/ChatStyles";
import { Callout } from "@/components/layout/Callout";
import { useLockBodyScroll } from "@/components/LockBodyScroll";
import { useMDXComponents as getMDXComponents } from "@/components/MDXComponents";

const mdxComponents = getMDXComponents({});

const MOBILE_CHAT_QUERY = \`(max-width: \${theme.breakpoints.lg - 1}px)\`;

function subscribeToMobileChat(callback: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_CHAT_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getMobileChatSnapshot() {
  return window.matchMedia(MOBILE_CHAT_QUERY).matches;
}

function useIsMobileChat() {
  return useSyncExternalStore(
    subscribeToMobileChat,
    getMobileChatSnapshot,
    () => false,
  );
}

type Source = {
  id: string;
  path: string;
  uri: string;
  score: number;
};

type Answer = {
  text: string;
  answer?: boolean;
  mdx?: MDXRemoteSerializeResult;
  sources?: Source[];
};

const SPARKLE_COLORS = [
  "#ff6b6b",
  "#feca57",
  "#48dbfb",
  "#ff9ff3",
  "#54a0ff",
  "#5f27cd",
];

// Deterministic sparkle positions to avoid hydration mismatch
const SPARKLE_POSITIONS = [
  { left: 8, top: 35 },
  { left: 17, top: 55 },
  { left: 26, top: 28 },
  { left: 35, top: 68 },
  { left: 44, top: 42 },
  { left: 53, top: 75 },
  { left: 62, top: 32 },
  { left: 71, top: 58 },
  { left: 80, top: 45 },
  { left: 89, top: 65 },
];

interface RainbowInputProps {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  "aria-label"?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

function RainbowInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  "aria-label": ariaLabel,
  inputRef,
}: RainbowInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isActive = isFocused || isHovered;

  const sparkles = SPARKLE_POSITIONS.map((pos, i) => ({
    color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
    left: pos.left,
    top: pos.top,
    delay: i * 0.12,
  }));

  return (
    <StyledRainbowInputWrapper
      $isActive={isActive}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <StyledSparkleContainer $isActive={isActive}>
        {sparkles.map((sparkle, i) => (
          <StyledSparkle
            key={i}
            $color={sparkle.color}
            $left={sparkle.left}
            $top={sparkle.top}
            $delay={sparkle.delay}
          />
        ))}
      </StyledSparkleContainer>
      <StyledRainbowInput
        ref={inputRef}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </StyledRainbowInputWrapper>
  );
}

function ChatButtonCTA() {
  const { toggleChat, isOpen } = useContext(ChatContext);

  return (
    <StyledGlowSmallButton
      onClick={toggleChat}
      aria-label="Ask AI Assistant"
      $hasContent={isOpen}
      type="button"
    >
      <span>
        <Sparkles size={16} />
        Ask AI
      </span>
    </StyledGlowSmallButton>
  );
}

function Chat() {
  const {
    isOpen,
    question,
    setQuestion,
    loading,
    error,
    answer,
    ask,
    closeChat,
    resetChat,
    chatInputRef,
  } = useContext(ChatContext);
  const chatSurfaceRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const loadingRef = useRef(loading);
  const isMobileChat = useIsMobileChat();
  const isMobileModal = isOpen && isMobileChat;

  useLockBodyScroll(isOpen);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useLayoutEffect(() => {
    if (isOpen) {
      shouldAutoScrollRef.current = true;
      return;
    }

    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !shouldAutoScrollRef.current) return;
    if (scrollFrameRef.current !== null) return;

    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const scrollContainer = chatScrollRef.current;
      if (!scrollContainer || !shouldAutoScrollRef.current) return;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: reduceMotion || loadingRef.current ? "auto" : "smooth",
      });
    });
  }, [answer, isOpen, loading]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMobileModal || !chatSurfaceRef.current) return;

    const surface = chatSurfaceRef.current;
    const inertSiblings: Array<{
      element: HTMLElement;
      wasInert: boolean;
    }> = [];
    let current: HTMLElement = surface;

    while (current.parentElement) {
      const parent = current.parentElement;
      for (const sibling of Array.from(parent.children)) {
        if (sibling === current || !(sibling instanceof HTMLElement)) continue;
        inertSiblings.push({ element: sibling, wasInert: sibling.inert });
        sibling.inert = true;
      }
      if (parent === document.body) break;
      current = parent;
    }

    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !surface.contains(event.target)) {
        chatInputRef.current?.focus();
      }
    };

    document.addEventListener("focusin", containFocus);
    chatInputRef.current?.focus();

    return () => {
      document.removeEventListener("focusin", containFocus);
      for (const { element, wasInert } of inertSiblings) {
        element.inert = wasInert;
      }
    };
  }, [chatInputRef, isMobileModal]);

  const handleChatScroll = () => {
    const scrollContainer = chatScrollRef.current;
    if (!scrollContainer) return;
    const distanceFromBottom =
      scrollContainer.scrollHeight -
      scrollContainer.scrollTop -
      scrollContainer.clientHeight;
    shouldAutoScrollRef.current =
      distanceFromBottom <= scrollContainer.clientHeight * 0.15;
  };

  const handleSurfaceKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && isMobileModal) {
      event.preventDefault();
      event.stopPropagation();
      closeChat();
      return;
    }

    if (event.key !== "Tab" || !isMobileModal) return;
    const focusable = Array.from(
      chatSurfaceRef.current?.querySelectorAll<HTMLElement>(
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

  return (
    <StyledChatSurface
      ref={chatSurfaceRef}
      $isVisible={isOpen}
      inert={!isOpen}
      aria-hidden={!isOpen}
      role={isMobileModal ? "dialog" : "complementary"}
      aria-modal={isMobileModal ? "true" : undefined}
      aria-label="AI Assistant"
      data-chat-surface
      data-markdown-ignore
      onKeyDownCapture={handleSurfaceKeyDown}
    >
      <StyledChat
        ref={chatScrollRef}
        $isVisible={isOpen}
        onScroll={handleChatScroll}
      >
        <StyledChatTitle>
          <StyledChatTitleIconWrapper>
            <Sparkles />
            <h3>AI Assistant</h3>
          </StyledChatTitleIconWrapper>
          <StyledChatTitleIconWrapper>
            <IconButton
              onClick={resetChat}
              aria-label="Reset chat history"
              title="Reset chat history"
            >
              <RotateCcw />
            </IconButton>
            <IconButton
              onClick={() => closeChat()}
              aria-label="Close chat"
              title="Close chat"
            >
              <X />
            </IconButton>
          </StyledChatTitleIconWrapper>
        </StyledChatTitle>
        {answer &&
          answer.map((a, i) => (
            <React.Fragment key={i}>
              <StyledAnswer $isAnswer={a.answer ?? false}>
                {a.answer && a.mdx ? (
                  <MDXRemote {...a.mdx} components={mdxComponents} />
                ) : (
                  a.text
                )}
              </StyledAnswer>
              {a.answer && a.sources && a.sources.length > 0 && (
                <StyledSources>
                  {a.sources.map((src) => {
                    const slug = src.uri
                      .replace("docs://", "")
                      .replace(/^\\/+/, "");
                    const href = slug ? \`/\${slug}/\` : "/";
                    const label = slug
                      ? slug
                          .split("/")
                          .pop()!
                          .replace(/-/g, " ")
                          .replace(/\\b\\w/g, (c: string) => c.toUpperCase())
                      : "Home";
                    return (
                      <StyledSourceLink
                        key={src.id}
                        href={href}
                        onClick={() => {
                          if (window.innerWidth <= 992) {
                            closeChat();
                          }
                        }}
                      >
                        {label}
                      </StyledSourceLink>
                    );
                  })}
                </StyledSources>
              )}
            </React.Fragment>
          ))}
        {loading && !answer[answer.length - 1]?.answer && (
          <StyledLoading>
            Answering<span>.</span>
            <span>.</span>
            <span>.</span>
          </StyledLoading>
        )}
        {error && (
          <StyledError>
            <Callout type="danger">
              <p>
                <strong>Error:</strong> {error}
              </p>
            </Callout>
          </StyledError>
        )}
      </StyledChat>

      <StyledChatForm onSubmit={ask} $isVisible={isOpen} data-markdown-ignore>
        <RainbowInput
          id="chat-bottom-input"
          inputRef={chatInputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask AI Assistant..."
          autoComplete="off"
          aria-label="Ask a follow-up question"
        />
        <StyledRainbowButton
          type="submit"
          disabled={loading || question.trim() === ""}
          $hasContent={question.trim().length > 0}
          aria-label={loading ? "Loading response" : "Submit question"}
        >
          {loading ? <LoaderPinwheel className="loading" /> : <ArrowUp />}
        </StyledRainbowButton>
      </StyledChatForm>
    </StyledChatSurface>
  );
}

const ChatContext = createContext<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleChat: () => void;
  isChatActive: boolean;
  question: string;
  setQuestion: (q: string) => void;
  loading: boolean;
  error: string | null;
  answer: Answer[];
  setAnswer: (answers: Answer[]) => void;
  ask: (e: React.FormEvent) => void;
  askAssistant: (question: string, returnFocusTo?: HTMLElement | null) => void;
  closeChat: (restoreFocus?: boolean) => HTMLElement | null;
  registerSearchClose: (
    closeSearch: (restoreFocus?: boolean) => HTMLElement | null,
  ) => () => void;
  resetChat: () => void;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
}>({
  isOpen: false,
  setIsOpen: () => {},
  toggleChat: () => {},
  isChatActive: false,
  question: "",
  setQuestion: () => {},
  loading: false,
  error: null,
  answer: [],
  setAnswer: () => {},
  ask: () => {},
  askAssistant: () => {},
  closeChat: () => null,
  registerSearchClose: () => () => {},
  resetChat: () => {},
  chatInputRef: { current: null },
});

interface ChatContextProviderProps {
  children: React.ReactNode;
  isChatActive: boolean;
}

const INITIAL_GREETING = "Hey there, how can I assist you?";

const ChtProvider = ({ children, isChatActive }: ChatContextProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pendingRestoreFocusRef = useRef<HTMLElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closeSearchRef = useRef<
    ((restoreFocus?: boolean) => HTMLElement | null) | null
  >(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const showChat = useCallback((returnFocusTo?: HTMLElement | null) => {
    const previousOverlayOpener = closeSearchRef.current?.(false) ?? null;
    const pendingChatOpener = pendingRestoreFocusRef.current;
    if (restoreFocusTimeoutRef.current) {
      clearTimeout(restoreFocusTimeoutRef.current);
      restoreFocusTimeoutRef.current = null;
    }
    pendingRestoreFocusRef.current = null;
    if (!isOpenRef.current) {
      const activeElement = document.activeElement;
      openerRef.current =
        returnFocusTo?.isConnected === true
          ? returnFocusTo
          : previousOverlayOpener?.isConnected === true
            ? previousOverlayOpener
            : pendingChatOpener?.isConnected === true
              ? pendingChatOpener
              : activeElement instanceof HTMLElement &&
                  activeElement !== document.body
                ? activeElement
                : null;
    }
    isOpenRef.current = true;
    setIsOpen(true);
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    focusTimeoutRef.current = setTimeout(() => {
      focusTimeoutRef.current = null;
      chatInputRef.current?.focus();
    }, 0);
  }, []);

  // Open the assistant and seed its greeting on the first visit. The opener is
  // captured before the mobile dialog makes the rest of the page inert.
  const openChat = useCallback(() => {
    showChat();
    setAnswer((prev) =>
      prev.length === 0 ? [{ text: INITIAL_GREETING, answer: true }] : prev,
    );
  }, [showChat]);

  const closeChat = useCallback((restoreFocus = true) => {
    const pendingOpener = pendingRestoreFocusRef.current;
    if (!restoreFocus && restoreFocusTimeoutRef.current) {
      clearTimeout(restoreFocusTimeoutRef.current);
      restoreFocusTimeoutRef.current = null;
      pendingRestoreFocusRef.current = null;
    }
    if (!isOpenRef.current) return pendingOpener;
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      activeElement.closest("[data-chat-surface]")
    ) {
      activeElement.blur();
    }
    const opener = openerRef.current;
    openerRef.current = null;
    isOpenRef.current = false;
    setIsOpen(false);
    if (restoreFocusTimeoutRef.current) {
      clearTimeout(restoreFocusTimeoutRef.current);
    }
    if (restoreFocus) {
      pendingRestoreFocusRef.current = opener;
      restoreFocusTimeoutRef.current = setTimeout(() => {
        const focusTarget = pendingRestoreFocusRef.current;
        restoreFocusTimeoutRef.current = null;
        pendingRestoreFocusRef.current = null;
        if (focusTarget?.isConnected) focusTarget.focus();
      }, 0);
    } else {
      pendingRestoreFocusRef.current = null;
    }
    return opener;
  }, []);

  const registerSearchClose = useCallback(
    (closeSearch: (restoreFocus?: boolean) => HTMLElement | null) => {
      closeSearchRef.current = closeSearch;
      return () => {
        if (closeSearchRef.current === closeSearch) {
          closeSearchRef.current = null;
        }
      };
    },
    [],
  );

  const toggleChat = useCallback(() => {
    if (isOpenRef.current) {
      closeChat();
    } else {
      openChat();
    }
  }, [closeChat, openChat]);

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      if (restoreFocusTimeoutRef.current) {
        clearTimeout(restoreFocusTimeoutRef.current);
      }
    };
  }, []);

  // Global Cmd/Ctrl+I toggles the assistant, but only when chat is enabled.
  useEffect(() => {
    if (!isChatActive) return;
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        toggleChat();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isChatActive, toggleChat]);

  async function runQuestion(
    currentQuestion: string,
    returnFocusTo?: HTMLElement | null,
  ) {
    setQuestion("");
    showChat(returnFocusTo);
    setLoading(true);
    setError(null);

    const base =
      answer.length > 0 ? answer : [{ text: INITIAL_GREETING, answer: true }];
    const mergedQuestions = [...base, { text: currentQuestion, answer: false }];

    setAnswer(mergedQuestions);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = answer
        .filter((a) => a.text.trim() !== "")
        .slice(-20)
        .map((a) => ({
          role: a.answer ? ("assistant" as const) : ("user" as const),
          content: a.text.slice(0, 4000),
        }));

      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion, history }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // The body may be a proxy/gateway HTML error page (e.g. Cloudflare
        // 524), not our JSON - never blindly JSON.parse it.
        const contentType = res.headers.get("content-type") || "";
        let message = "Request failed";
        if (contentType.includes("application/json")) {
          try {
            const errorData = await res.json();
            message = errorData.error || message;
          } catch {
            // Non-JSON despite the header - fall through to the default.
          }
        } else if ([502, 503, 504, 524].includes(res.status)) {
          message = "The assistant took too long to respond. Please try again.";
        }
        throw new Error(message);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      const contentParts: string[] = [];
      let sources: Source[] = [];
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      // Don't insert the answer bubble yet - an empty bubble renders a blank
      // gap above the "Answering..." loader. The bubble is created on the first
      // streamed token (or the done event) instead, so the loader stays put
      // until real text appears.
      const streamingAnswerIndex = mergedQuestions.length;

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\\n");
        buffer = parts.pop() ?? "";

        for (const line of parts) {
          if (!line.startsWith("data: ")) continue;

          // Guard only the parse: a malformed frame is skipped, while the
          // server's error event below must throw past this loop to the
          // outer catch so it renders in the chat's error callout instead
          // of dying in a parse-error log.
          let data;
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            console.error("Failed to parse SSE data:", line);
            continue;
          }

          if (data.type === "metadata") {
            const allSources: Source[] = data.data?.sources ?? [];
            const seen = new Set<string>();
            sources = allSources.filter((s: Source) => {
              if (s.score < 0.4 || seen.has(s.uri)) return false;
              seen.add(s.uri);
              return true;
            });
          } else if (data.type === "content") {
            contentParts.push(data.data);
            const streamedContent = contentParts.join("");

            setAnswer((prev) => {
              const newAnswers = [...prev];
              newAnswers[streamingAnswerIndex] = {
                text: streamedContent,
                answer: true,
                sources,
              };
              return newAnswers;
            });
          } else if (data.type === "error") {
            throw new Error(data.data);
          } else if (data.type === "done") {
            const streamedContent = contentParts.join("");
            let mdxSource: MDXRemoteSerializeResult | null = null;
            try {
              mdxSource = await serialize(streamedContent, {
                parseFrontmatter: false,
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [rehypeHighlight],
                  format: "md",
                  development: false,
                },
              });
            } catch (mdxError: unknown) {
              console.error("MDX serialization error:", mdxError);
            }

            setAnswer((prev) => {
              const newAnswers = [...prev];
              newAnswers[streamingAnswerIndex] = {
                text: streamedContent,
                answer: true,
                mdx: mdxSource || undefined,
                sources,
              };
              return newAnswers;
            });
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (loading || question.trim() === "") return;
    await runQuestion(question);
  }

  // Bridge from the search modal: hand the typed query to the assistant. If a
  // response is already streaming (loading), we can't submit yet - open the
  // panel and pre-fill the input so the user can send it the moment the
  // current answer finishes. Otherwise submit it right away.
  function askAssistant(
    rawQuestion: string,
    returnFocusTo?: HTMLElement | null,
  ) {
    const trimmed = rawQuestion.trim();
    if (trimmed === "") return;
    if (loading) {
      showChat(returnFocusTo);
      setQuestion(trimmed);
    } else {
      void runQuestion(trimmed, returnFocusTo);
    }
  }

  function resetChat() {
    abortRef.current?.abort();
    setLoading(false);
    setError(null);
    setAnswer([{ text: INITIAL_GREETING, answer: true }]);
  }

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleChat,
        isChatActive,
        question,
        setQuestion,
        loading,
        error,
        answer,
        setAnswer,
        ask,
        askAssistant,
        closeChat,
        registerSearchClose,
        resetChat,
        chatInputRef,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export { Chat, ChtProvider, ChatContext, ChatButtonCTA };
`;
