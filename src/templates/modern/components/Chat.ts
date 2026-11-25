import { deriveTemplate } from "../../../lib/derive-template.js";
import { chatTemplate } from "../../components/Chat.js";

// The classic Chat.tsx with the modern design's edits: the panel sits in a
// layout-free shell (display: contents, styled in the modern design.css)
// that records whether the pointer moved since the panel opened, so the
// header buttons under a still cursor do not show hovered.
export const modernChatTemplate = deriveTemplate(
  "modern components/Chat.tsx",
  chatTemplate,
  [
    [
      `"use client";
import React, { createContext, useCallback, useMemo } from "react";`,
      `"use client";
import React, { createContext, useCallback, useMemo, useState } from "react";`,
    ],
    [
      `function Chat() {
  const t = useStrings();

  return (
    <ChatPanel title={t.aiAssistant} actions={<ChatActions />}>
      <ChatTranscript />
      <ChatInput
        placeholder={t.chatPlaceholder}
        aria-label={t.chatInputLabel}
      />
    </ChatPanel>
  );
}`,
      `function Chat() {
  const t = useStrings();
  const { isOpen } = useChat();
  // Whether the pointer has moved since the panel last opened; reset during
  // render when it opens, so no effect has to run.
  const [pointerMoved, setPointerMoved] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) setPointerMoved(false);
  }

  return (
    <div
      className="dcp-chat-shell"
      data-pointer-moved={pointerMoved}
      onPointerMove={pointerMoved ? undefined : () => setPointerMoved(true)}
    >
      <ChatPanel title={t.aiAssistant} actions={<ChatActions />}>
        <ChatTranscript />
        <ChatInput
          placeholder={t.chatPlaceholder}
          aria-label={t.chatInputLabel}
        />
      </ChatPanel>
    </div>
  );
}`,
    ],
  ],
);
