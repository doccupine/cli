export const chatMessagesTemplate = `"use client";
// Adapted from cherry-styled-components (MIT,
// https://github.com/cherry-design-system/styled-components).
import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useChat, type ChatRole } from "@/components/chat/ChatProvider";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The transcript's scroll area. It follows new content (smoothly for whole
 * messages, instantly while streaming or under reduced motion) until the
 * reader scrolls up, and re-engages when they return near the bottom or send.
 */
export function ChatMessageList({ children }: { children: React.ReactNode }) {
  const { isOpen, loading } = useChat();
  const streaming = loading;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const streamingRef = useRef(streaming);

  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);

  // Re-arm auto-scroll each time the panel opens, and jump (not smooth) on
  // the next scroll so the panel comes into view at the last message. Cancel
  // any queued scroll when it closes.
  const jumpNextScrollRef = useRef(false);
  useIsomorphicLayoutEffect(() => {
    if (isOpen) {
      shouldAutoScrollRef.current = true;
      jumpNextScrollRef.current = true;
      return;
    }

    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
  }, [isOpen]);

  // Sending always re-engages the follow, even if the reader had scrolled up.
  const prevLoadingRef = useRef(loading);
  useIsomorphicLayoutEffect(() => {
    if (loading && !prevLoadingRef.current) {
      shouldAutoScrollRef.current = true;
    }
    prevLoadingRef.current = loading;
  }, [loading]);

  // Follow new content, coalesced to one scroll per frame.
  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    if (scrollFrameRef.current !== null) return;

    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const scrollContainer = scrollRef.current;
      if (!scrollContainer || !shouldAutoScrollRef.current) return;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const jump = jumpNextScrollRef.current;
      jumpNextScrollRef.current = false;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior:
          reduceMotion || streamingRef.current || jump ? "auto" : "smooth",
      });
    });
  }, [children, isOpen, streaming]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  // Scrolling up more than 15% of a viewport releases the follow; returning
  // near the bottom re-engages it.
  const handleScroll = () => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    const distanceFromBottom =
      scrollContainer.scrollHeight -
      scrollContainer.scrollTop -
      scrollContainer.clientHeight;
    shouldAutoScrollRef.current =
      distanceFromBottom <= scrollContainer.clientHeight * 0.15;
  };

  return (
    <div
      role="log"
      className="dcp-chat-messages"
      onScroll={handleScroll}
      ref={scrollRef}
    >
      {children}
    </div>
  );
}

/** One message: the reader's question pill, or the assistant's reply. */
export function ChatMessage({
  children,
  role,
}: {
  children: React.ReactNode;
  role: ChatRole;
}) {
  return (
    <div className="dcp-chat-message" data-role={role}>
      <div className="dcp-chat-message__content">{children}</div>
    </div>
  );
}

/**
 * Markdown styling for an assistant reply: a 10px rhythm between elements,
 * headings two steps smaller than the docs, inline-code chips, lists and
 * tables.
 */
export function ChatProse({ children }: { children: React.ReactNode }) {
  return <div className="dcp-chat-prose">{children}</div>;
}

/** The row of source links under a reply. */
export function ChatSources({ children }: { children: React.ReactNode }) {
  return <div className="dcp-chat-sources">{children}</div>;
}

/** One source link; a plain anchor, so the caller routes the click. */
export function ChatSource({
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className="dcp-chat-source" {...props}>
      {children}
    </a>
  );
}

/** The "Answering..." status shown until the first reply token arrives. */
export function ChatTyping({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="dcp-chat-typing">
      {children}
      {/* Decorative; the label alone is the announcement. */}
      <span aria-hidden="true">
        <span className="dcp-chat-typing__dot">.</span>
        <span className="dcp-chat-typing__dot">.</span>
        <span className="dcp-chat-typing__dot">.</span>
      </span>
    </div>
  );
}
`;
