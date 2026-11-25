export const chatLauncherTemplate = `"use client";
// Adapted from cherry-styled-components (MIT,
// https://github.com/cherry-design-system/styled-components).
import React from "react";
import { useChat } from "@/components/chat/ChatProvider";

interface ChatLauncherProps {
  children: React.ReactNode;
  "aria-label": string;
}

/**
 * The header's "Ask AI" button: toggles the chat panel, with a rotating
 * rainbow band on hover, focus and press and a soft radiating glow that
 * strengthens while the panel is open.
 */
export function ChatLauncher({
  children,
  "aria-label": ariaLabel,
}: ChatLauncherProps) {
  const { toggle, isOpen } = useChat();

  return (
    <button
      type="button"
      className="dcp-chat-launcher"
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      onClick={toggle}
    >
      <span className="dcp-chat-launcher__glow" aria-hidden="true" />
      <span className="dcp-chat-launcher__ring" aria-hidden="true" />
      <span className="dcp-chat-launcher__inner">{children}</span>
    </button>
  );
}
`;
