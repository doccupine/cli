export const chatTemplate = `"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { css, keyframes } from "styled-components";
import { rgba } from "polished";
import { Button } from "cherry-styled-components";
import { ArrowUp, LoaderPinwheel, Sparkles, X } from "lucide-react";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { mq, Theme } from "@/app/theme";
import { useMDXComponents } from "@/components/MDXComponents";
import { styledTable, stylesLists } from "@/components/layout/SharedStyled";
import links from "@/links.json";

const mdxComponents = useMDXComponents({});

const styledText = css<{ theme: Theme }>\`
  font-size: \${({ theme }) => theme.fontSizes.text.xs};
  line-height: \${({ theme }) => theme.lineHeights.text.xs};

  \${mq("lg")} {
    font-size: \${({ theme }) => theme.fontSizes.small.lg};
    line-height: \${({ theme }) => theme.lineHeights.small.lg};
  }
\`;

const StyledChat = styled.div<{ theme: Theme; $isVisible: boolean }>\`
  margin: 0;
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: calc(100vh - 90px);
  overflow-y: scroll;
  overflow-x: hidden;
  z-index: 1000;
  width: 100%;
  padding: 0 20px;
  transition: all 0.3s ease;
  transform: translateX(0);
  background: \${({ theme }) => theme.colors.light};

  \${({ $isVisible }) =>
    !$isVisible &&
    css\`
      transform: translateX(100%);
    \`}

  \${mq("lg")} {
    width: 420px;
    border-left: solid 1px \${({ theme }) => theme.colors.grayLight};
  }
\`;

const loadingAnimation = keyframes\`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
\`;

const rotateGradient = keyframes\`
  0% {
    --gradient-angle: 0deg;
  }
  100% {
    --gradient-angle: 360deg;
  }
\`;

const pulseGlow = keyframes\`
  0%, 100% {
    opacity: 0.5;
    filter: blur(16px);
  }
  50% {
    opacity: 1;
    filter: blur(22px);
  }
\`;

const sparkleFloat = keyframes\`
  0%, 100% {
    opacity: 0;
    transform: translateY(0) scale(0);
  }
  50% {
    opacity: 0.9;
    transform: translateY(-20px) scale(1);
  }
\`;

const shimmer = keyframes\`
  0% {
    background-position: 0% center;
  }
  50% {
    background-position: 100% center;
  }
  100% {
    background-position: 0% center;
  }
\`;

const StyledRainbowInputWrapper = styled.div<{
  theme: Theme;
  $isActive: boolean;
}>\`
  @property --gradient-angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  position: relative;
  flex: 1;

  &::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 14px;
    background: conic-gradient(
      from var(--gradient-angle),
      #cc5555,
      #d9a745,
      #3ab0cc,
      #cc7fc2,
      #4380cc,
      #4c1fa3,
      #cc5555
    );
    opacity: 0;
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    animation: \${rotateGradient} 3s linear infinite;
    z-index: 0;
  }

  &::after {
    content: "";
    position: absolute;
    inset: -10px;
    border-radius: 20px;
    background: conic-gradient(
      from var(--gradient-angle),
      \${rgba("#ff6b6b", 0.4)},
      \${rgba("#feca57", 0.4)},
      \${rgba("#48dbfb", 0.4)},
      \${rgba("#ff9ff3", 0.4)},
      \${rgba("#54a0ff", 0.4)},
      \${rgba("#5f27cd", 0.4)},
      \${rgba("#ff6b6b", 0.4)}
    );
    opacity: 0;
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    animation:
      \${rotateGradient} 3s linear infinite,
      \${pulseGlow} 2s ease-in-out infinite;
    z-index: -1;
    pointer-events: none;
  }

  &:hover::before,
  &:focus-within::before {
    opacity: 1;
  }

  &:hover::after,
  &:focus-within::after {
    opacity: 1;
  }

  \${({ $isActive }) =>
    $isActive &&
    css\`
      &::before {
        opacity: 1;
      }
      &::after {
        opacity: 1;
      }
    \`}
\`;

const StyledSparkleContainer = styled.div<{ $isActive: boolean }>\`
  position: absolute;
  inset: -30px;
  pointer-events: none;
  overflow: hidden;
  border-radius: 30px;
  z-index: -2;
  opacity: 0;
  transition: opacity 0.4s ease;

  \${({ $isActive }) =>
    $isActive &&
    css\`
      opacity: 1;
    \`}
\`;

const StyledSparkle = styled.div<{
  $color: string;
  $left: number;
  $top: number;
  $delay: number;
}>\`
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: \${({ $color }) => $color};
  box-shadow: 0 0 6px \${({ $color }) => $color};
  left: \${({ $left }) => $left}%;
  top: \${({ $top }) => $top}%;
  animation: \${sparkleFloat} 2s ease-in-out infinite;
  animation-delay: \${({ $delay }) => $delay}s;
\`;

const StyledRainbowInput = styled.input<{ theme: Theme }>\`
  position: relative;
  z-index: 1;
  width: 100%;
  background: \${({ theme }) => theme.colors.light};
  border: 1px solid \${({ theme }) => theme.colors.grayLight};
  border-radius: 12px;
  padding: 14px 18px;
  font-size: \${({ theme }) => theme.fontSizes.text.lg};
  font-family: inherit;
  color: \${({ theme }) => theme.colors.dark};
  outline: none;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;

  \${mq("lg")} {
    font-size: \${({ theme }) => theme.fontSizes.small.lg};
  }

  &::placeholder {
    color: \${({ theme }) => rgba(theme.colors.dark, 0.4)};
    transition: color 0.3s ease;
  }

  &:focus::placeholder {
    color: \${({ theme }) => rgba(theme.colors.dark, 0.6)};
  }

  &:focus {
    border-color: transparent;
  }
\`;

const StyledRainbowButton = styled(Button)<{
  theme: Theme;
  $hasContent: boolean;
}>\`
  padding-top: 10px;
  padding-bottom: 10px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  color: \${({ theme }) =>
    theme.isDark ? theme.colors.dark : theme.colors.light};

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      #ff6b6b,
      #feca57,
      #48dbfb,
      #ff9ff3,
      #54a0ff
    );
    background-size: 300% 300%;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
    animation: \${shimmer} 3s linear infinite;
    width: 200%;
  }

  \${({ $hasContent }) =>
    $hasContent &&
    css\`
      &::before {
        opacity: 1;
      }
    \`}

  &:hover::before {
    opacity: 1;
  }

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  & svg {
    position: relative;
    z-index: 1;
    transition: transform 0.3s ease;
  }

  &:disabled,
  &:disabled:hover {
    background: \${({ theme }) => theme.colors.primaryDark};
    transform: none;
    box-shadow: none;

    &::before {
      opacity: 0;
    }
  }
\`;

const StyledChatForm = styled.form<{ theme: Theme; $isVisible: boolean }>\`
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  background: \${({ theme }) => theme.colors.light};
  padding: 20px;
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
  border-top: solid 1px \${({ theme }) => theme.colors.grayLight};
  transition: all 0.3s ease;
  transform: translateX(100%);

  \${mq("lg")} {
    width: 420px;
    border-left: solid 1px \${({ theme }) => theme.colors.grayLight};
  }

  \${({ $isVisible }) =>
    $isVisible &&
    css\`
      transform: translateX(0);
    \`}

  & .loading {
    animation: \${loadingAnimation} 1s linear infinite;
  }
\`;

const StyledChatFixedForm = styled.form<{
  theme: Theme;
  $hide: boolean;
  $hasLinks: boolean;
}>\`
  transition: all 0.3s ease;
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: calc(100% - 115px);
  z-index: 998;

  \${mq("lg")} {
    left: 50%;
    transform: translateX(-50%) translateY(0);
    bottom: initial;
    position: absolute;
    top: 90px;
    width: calc(100% - 320px * 2 - 40px);
    opacity: 1;

    \${({ $hasLinks }) =>
      $hasLinks &&
      css\`
        top: 164px;
      \`}
  }

  \${({ $hide }) =>
    $hide &&
    css\`
      transform: translateX(-100px);

      \${mq("lg")} {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
    \`}

  & .loading {
    animation: \${loadingAnimation} 1s linear infinite;
  }
\`;

const StyledChatFixedInner = styled.div\`
  margin: auto;
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;

  \${mq("lg")} {
    max-width: 640px;
  }
\`;

const StyledError = styled.div<{ theme: Theme }>\`
  overflow-x: auto;
  background: \${({ theme }) => theme.colors.error};
  color: \${({ theme }) =>
    theme.isDark ? theme.colors.dark : theme.colors.light};
  padding: 10px;
  border-radius: 8px;
  margin: 20px 0;
  width: 100%;
  \${styledText};
\`;

const loadingDotAnimation = keyframes\`
    0% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
\`;

const StyledLoading = styled.div<{ theme: Theme }>\`
  overflow-x: auto;
  margin: 20px 0;
  width: 100%;
  font-weight: 600;
  \${styledText};
  color: \${({ theme }) => theme.colors.dark};

  & span {
    &:nth-child(1) {
      animation: \${loadingDotAnimation} 1s ease infinite;
    }
    &:nth-child(2) {
      animation: \${loadingDotAnimation} 1s ease infinite;
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation: \${loadingDotAnimation} 1s ease infinite;
      animation-delay: 0.4s;
    }
  }
\`;

const StyledAnswer = styled.div<{ theme: Theme; $isAnswer: boolean }>\`
  overflow-x: auto;
  background: \${({ theme }) => theme.colors.primary};
  color: \${({ theme }) =>
    theme.isDark ? theme.colors.dark : theme.colors.light};
  padding: 10px;
  border-radius: 8px;
  margin: 20px 0;
  width: 100%;
  \${styledText};

  & p {
    \${styledText};
  }

  \${({ $isAnswer }) =>
    $isAnswer &&
    css\`
      background: transparent;
      color: \${({ theme }) => theme.colors.dark};
      padding: 0;
    \`}

  & code:not([class]) {
    background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.2)};
    color: \${({ theme }) => theme.colors.dark};
    padding: 2px 4px;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    white-space: pre;
  }

  \${stylesLists};
  \${styledTable};

  & pre,
  & .hljs {
    margin: 10px 0;
  }

  & .code-wrapper pre {
    margin: 0;
    \${styledText};
  }

  & > *:first-child {
    margin-top: 0;
  }

  & > *:last-child {
    margin-bottom: 0;

    & > *:last-child {
      margin-bottom: 0;
    }
  }

  & ul,
  & ol {
    & li {
      \${styledText};
    }
  }

  & ol {
    & > li {
      padding-left: 20px;

      &::before {
        position: absolute;
        top: 0;
        left: 0;
      }
    }
  }

  & img,
  & video,
  & iframe {
    max-width: 100%;
    border-radius: \${({ theme }) => theme.spacing.radius.lg};
    margin: 10px 0;
    display: block;
  }

  & h1,
  & h2,
  & h3,
  & h4,
  & h5,
  & h6 {
    margin: 10px 0;
    padding: 0;
  }
\`;

const StyledChatTitle = styled.div<{ theme: Theme }>\`
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  position: sticky;
  margin: 0 -20px;
  padding: 25px 20px;
  height: 73px;
  top: 0;
  background: \${({ theme }) => theme.colors.light};
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  z-index: 1000;
\`;

const StyledChatTitleIconWrapper = styled.span<{ theme: Theme }>\`
  display: flex;
  align-items: center;
  gap: 5px;
  color: \${({ theme }) => theme.colors.dark};
\`;

const StyledChatCloseButton = styled.button<{ theme: Theme }>\`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
  color: \${({ theme }) => theme.colors.primary};

  &:hover {
    color: \${({ theme }) => theme.colors.primaryDark};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
\`;

type Answer = {
  text: string;
  answer?: boolean;
  mdx?: MDXRemoteSerializeResult;
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
}

function RainbowInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  "aria-label": ariaLabel,
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

function Chat() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { isOpen, setIsOpen } = useContext(ChatContext);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [answer]);

  useEffect(() => {
    if (answer?.length > 0) {
      const el = document.getElementById(
        "chat-bottom-input",
      ) as HTMLInputElement | null;
      el?.focus();
    }
  }, [answer]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (loading || question.trim() === "") return;
    const currentQuestion = question;
    setQuestion("");
    setIsOpen(true);
    setLoading(true);
    setError(null);

    const mergedQuestions =
      answer.length > 0
        ? [...answer, { text: currentQuestion, answer: false }]
        : [{ text: currentQuestion, answer: false }];

    setAnswer(mergedQuestions);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Request failed");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      const contentParts: string[] = [];
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      // Add a placeholder for the streaming answer
      const streamingAnswerIndex = mergedQuestions.length;
      setAnswer([...mergedQuestions, { text: "", answer: true }]);

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\\n");
        // Keep the last (potentially incomplete) part in the buffer
        buffer = parts.pop() ?? "";

        for (const line of parts) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "content") {
                contentParts.push(data.data);
                const streamedContent = contentParts.join("");

                setAnswer((prev) => {
                  const newAnswers = [...prev];
                  newAnswers[streamingAnswerIndex] = {
                    text: streamedContent,
                    answer: true,
                  };
                  return newAnswers;
                });
              } else if (data.type === "error") {
                throw new Error(data.data);
              } else if (data.type === "done") {
                const streamedContent = contentParts.join("");
                // Finalize with MDX serialization
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
                  };
                  return newAnswers;
                });
              }
            } catch (parseError) {
              if (parseError instanceof Error && parseError.message !== "Unknown error") {
                console.error("Failed to parse SSE data:", parseError);
              }
            }
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

  return (
    <>
      <StyledChatFixedForm
        onSubmit={ask}
        $hide={answer?.length > 0}
        $hasLinks={links.length > 0}
      >
        <StyledChatFixedInner>
          <RainbowInput
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask AI Assistant..."
            autoComplete="off"
            aria-label="Ask a question about the documentation"
          />
          <StyledRainbowButton
            type="submit"
            disabled={loading}
            $hasContent={question.trim().length > 0}
            aria-label={loading ? "Loading response" : "Submit question"}
          >
            {loading ? <LoaderPinwheel className="loading" /> : <ArrowUp />}
          </StyledRainbowButton>
        </StyledChatFixedInner>
      </StyledChatFixedForm>

      <StyledChat $isVisible={isOpen}>
        <StyledChatTitle>
          <StyledChatTitleIconWrapper>
            <Sparkles />
            <h3>AI Assistant</h3>
          </StyledChatTitleIconWrapper>
          <StyledChatCloseButton
            onClick={() => {
              abortRef.current?.abort();
              setAnswer([]);
              setIsOpen(false);
            }}
            aria-label="Close chat"
          >
            <X />
          </StyledChatCloseButton>
        </StyledChatTitle>
        {answer &&
          answer.map((a, i) => (
            <StyledAnswer key={i} $isAnswer={a.answer ?? false}>
              {a.answer && a.mdx ? (
                <MDXRemote {...a.mdx} components={mdxComponents} />
              ) : (
                a.text
              )}
            </StyledAnswer>
          ))}
        {loading && (
          <StyledLoading>
            Answering<span>.</span>
            <span>.</span>
            <span>.</span>
          </StyledLoading>
        )}
        {error && (
          <StyledError>
            <strong>Error:</strong> {error}
          </StyledError>
        )}
        <div ref={endRef} />
      </StyledChat>

      <StyledChatForm onSubmit={ask} $isVisible={isOpen}>
        <RainbowInput
          id="chat-bottom-input"
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
    </>
  );
}

const ChatContext = createContext<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isChatActive: boolean;
}>({
  isOpen: false,
  setIsOpen: () => {},
  isChatActive: false,
});

interface ChatContextProviderProps {
  children: React.ReactNode;
  isChatActive: boolean;
}

const ChtProvider = ({ children, isChatActive }: ChatContextProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        isChatActive,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export { Chat, ChtProvider, ChatContext };
`;
