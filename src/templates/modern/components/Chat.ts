import { deriveTemplate } from "../../../lib/derive-template.js";
import { chatTemplate } from "../../components/Chat.js";

// The classic Chat.tsx with the modern design's edits.
export const modernChatTemplate = deriveTemplate(
  "modern components/Chat.tsx",
  chatTemplate,
  [
    [
      `"use client";
import React, { createContext, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {`,
      `"use client";
import React, { createContext, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {`,
    ],
    [
      `import { useStrings } from "@/components/useStrings";
import { useVariant } from "@/components/useVariant";

const mdxComponents = getMDXComponents({});

/** The language/version the reader is looking at; retrieval stays inside it. */
interface ChatScope {`,
      `import { useStrings } from "@/components/useStrings";
import { useVariant } from "@/components/useVariant";
import styled from "styled-components";
import { Theme } from "@/app/theme";
import { HEADER_HEIGHT } from "@/components/layout/designTokens";

const mdxComponents = getMDXComponents({});

// Fits Cherry's chat panel to the modern chrome. A layout-free wrapper
// (display: contents) restyles the panel through its stable class names:
// the header bar matches the site header's height and hairline, its
// controls are ghost squares, and the composer uses the header's pill
// geometry. Cherry's glow on the composer stays.
const StyledChatShell = styled.div<{ theme: Theme }>\`
  display: contents;

  && .chat-header {
    min-height: \${HEADER_HEIGHT + 1}px;
    padding: 0 12px 0 20px;
    border-bottom-color: \${({ theme }) => theme.colors.grayLight};
  }

  && .chat-header-title {
    gap: 8px;

    & h3 {
      font-size: \${({ theme }) => theme.fontSizes.small.lg};
      line-height: 20px;
      font-weight: 600;
    }

    & svg {
      width: 16px;
      height: 16px;
      color: \${({ theme }) => theme.colors.grayDark};
    }
  }

  && .chat-header-actions {
    gap: 4px;

    & button {
      /* An exact 32px square whatever Cherry's IconButton sizing says; the
         hover fill and focus ring take the sidebar row's rounded square. */
      box-sizing: border-box;
      width: 32px;
      height: 32px;
      min-width: 32px;
      max-width: 32px;
      min-height: 32px;
      max-height: 32px;
      padding: 0;
      border: solid 1px transparent;
      border-radius: \${({ theme }) => theme.spacing.radius.xs};
      background: transparent;
      color: \${({ theme }) => theme.colors.grayDark};
      box-shadow: none;
      transition:
        color 0.2s ease,
        background-color 0.2s ease;

      & svg {
        width: 16px;
        height: 16px;
        color: inherit;
      }

      &:hover {
        color: \${({ theme }) => theme.colors.dark};
        border-color: transparent;
        background: \${({ theme }) =>
          \`color-mix(in srgb, \${theme.colors.dark} 6%, transparent)\`};
      }

      &:focus,
      &:active {
        border-color: transparent;
        box-shadow: none;
      }

      &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
      }
    }
  }

  /* The panel opens under a still cursor (the header Ask AI pill sits where
     these buttons land), which would show one of them hovered before the
     reader touches anything. Their hover waits for a real pointer move. */
  &&[data-pointer-moved="false"] .chat-header-actions button:hover {
    color: \${({ theme }) => theme.colors.grayDark};
    background: transparent;
  }

  && .chat-composer {
    gap: 8px;
    align-items: flex-end;
    padding: 12px 16px 16px;
    border-top-color: \${({ theme }) => theme.colors.grayLight};

    /* The input and its glow layers: a pill at one row (24px line + 14px
       padding + 2px border = 40px), softening to a rounded box as it grows. */
    & > div::before,
    & > div::after,
    & textarea {
      border-radius: 20px;
    }

    & > div:focus-within::after {
      border-radius: 24px;
    }

    & > div:active::after {
      border-radius: 22px;
    }

    /* Cherry's radiating glow behind the input (its first layer), rounded
       to follow the pill. */
    & > div > div:first-child {
      border-radius: 30px;
    }

    & textarea {
      border-width: 1px;
      padding: 7px 16px;
      font-size: \${({ theme }) => theme.fontSizes.small.lg};
      line-height: 24px;
    }

    & button[type="submit"] {
      width: 40px;
      height: 40px;
      min-width: 40px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: \${({ theme }) => theme.colors.dark};
      color: \${({ theme }) => theme.colors.light};
      box-shadow: none;
      transition:
        background-color 0.2s ease,
        color 0.2s ease;

      & svg {
        width: 18px;
        height: 18px;
        color: inherit;
      }

      &:hover:not(:disabled) {
        background: \${({ theme }) =>
          \`color-mix(in srgb, \${theme.colors.dark} 82%, \${theme.colors.light})\`};
      }

      &:focus,
      &:active {
        box-shadow: none;
      }

      &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
      }

      &:disabled {
        background: \${({ theme }) =>
          \`color-mix(in srgb, \${theme.colors.dark} 8%, transparent)\`};
        color: \${({ theme }) => theme.colors.gray};
      }
    }
  }
\`;

/** The language/version the reader is looking at; retrieval stays inside it. */
interface ChatScope {`,
    ],
    [
      `function Chat() {
  const t = useStrings();

  return (
    <ChatPanel $title={t.aiAssistant} $actions={<ChatActions />}>
      <ChatTranscript />
      <ChatInput
        $glow
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
    <StyledChatShell
      data-pointer-moved={pointerMoved}
      onPointerMove={pointerMoved ? undefined : () => setPointerMoved(true)}
    >
      <ChatPanel $title={t.aiAssistant} $actions={<ChatActions />}>
        <ChatTranscript />
        <ChatInput
          $glow
          placeholder={t.chatPlaceholder}
          aria-label={t.chatInputLabel}
        />
      </ChatPanel>
    </StyledChatShell>
  );
}`,
    ],
  ],
);
