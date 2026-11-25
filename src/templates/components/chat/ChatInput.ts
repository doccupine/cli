export const chatInputTemplate = `"use client";
// Adapted from cherry-styled-components (MIT,
// https://github.com/cherry-design-system/styled-components).
import React, { useEffect, useLayoutEffect, useState } from "react";
import { ArrowUp, LoaderCircle } from "lucide-react";
import { useChat } from "@/components/chat/ChatProvider";

const SPARKLE_COLORS = [
  "#ff6b6b",
  "#feca57",
  "#48dbfb",
  "#ff9ff3",
  "#54a0ff",
  "#5f27cd",
];

// Deterministic sparkle positions, so the server and client render agree.
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

const SPARKLES = SPARKLE_POSITIONS.map((position, index) => ({
  "--dcp-sparkle-color": SPARKLE_COLORS[index % SPARKLE_COLORS.length],
  "--dcp-sparkle-left": \`\${position.left}%\`,
  "--dcp-sparkle-top": \`\${position.top}%\`,
  "--dcp-sparkle-delay": \`\${index * 0.12}s\`,
})) as React.CSSProperties[];

const MAX_TEXTAREA_HEIGHT = 160;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface ChatInputProps {
  placeholder: string;
  "aria-label": string;
}

/**
 * The composer: an auto-growing textarea inside the rotating rainbow glow,
 * and the send button. Enter sends, Shift+Enter adds a line.
 */
export function ChatInput({
  placeholder,
  "aria-label": ariaLabel,
}: ChatInputProps) {
  // inputRef is the provider's, so open() and the panel can focus the
  // composer.
  const { input: value, setInput, loading, send, inputRef } = useChat();
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hasContent = value.trim().length > 0;
  const isActive = isFocused || isHovered;

  // Auto-grow: collapse, then take the scroll height up to the cap.
  useIsomorphicLayoutEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    // scrollHeight is content + padding only; with border-box sizing the
    // borders must be added back or the box comes out short.
    const borders = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = \`\${Math.min(
      textarea.scrollHeight + borders,
      MAX_TEXTAREA_HEIGHT,
    )}px\`;
  }, [value, inputRef]);

  const submit = () => {
    if (loading || !hasContent) return;
    send(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter submits; Shift+Enter inserts a newline. A composition session
    // (IME) owns Enter until it commits.
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form
      className="dcp-chat-composer"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      data-chat-composer
    >
      <div
        className="dcp-chat-input"
        data-active={isActive || undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="dcp-chat-input__radiant" />
        <div className="dcp-chat-input__sparkles">
          {SPARKLES.map((style, index) => (
            <div
              key={index}
              className="dcp-chat-input__sparkle"
              style={style}
            />
          ))}
        </div>
        <textarea
          className="dcp-chat-input__textarea"
          rows={1}
          autoComplete="off"
          placeholder={placeholder}
          aria-label={ariaLabel}
          value={value}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          ref={inputRef}
        />
      </div>
      <button
        type="submit"
        className="dcp-chat-send"
        disabled={loading || !hasContent}
        aria-label={loading ? "Loading response" : "Submit question"}
      >
        {loading ? (
          <LoaderCircle className="dcp-chat-send__spinner" aria-hidden="true" />
        ) : (
          <ArrowUp aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
`;
