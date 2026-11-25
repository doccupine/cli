export const chatPanelTemplate = `"use client";
// Adapted from cherry-styled-components (MIT,
// https://github.com/cherry-design-system/styled-components).
import React, {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { Sparkles, X } from "lucide-react";
import { useChat } from "@/components/chat/ChatProvider";

// Matches everything Tab can land on inside the panel.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const BELOW_QUERIES = { lg: "(max-width: 991px)" } as const;

/**
 * True while the viewport is narrower than "lg" (992px), where the panel
 * covers the page. False on the server and during hydration, then the real
 * match.
 */
export function useBelowBreakpoint(size: keyof typeof BELOW_QUERIES) {
  const query = BELOW_QUERIES[size];
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

// Module-level count so overlapping locks compose: the body is released once
// the last holder lets go, and the value it had before is restored.
let lockCount = 0;
let previousOverflow = "";

function useLockBodyScroll(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;
    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;
    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [isLocked]);
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
}

/** A round icon-only button (the panel's close and reset controls). */
export function IconButton({ className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={className ? \`dcp-icon-button \${className}\` : "dcp-icon-button"}
      {...props}
    />
  );
}

interface ChatPanelProps {
  children: React.ReactNode;
  /** Header title, also the panel's accessible name. */
  title: string;
  /** Extra header controls, placed before the close button. */
  actions?: React.ReactNode;
}

/**
 * The chat drawer: a fixed panel on the right from "lg" up that leaves the
 * page usable, and a full-screen modal dialog below it (everything around it
 * goes inert, Tab wraps, Esc closes).
 */
export function ChatPanel({ children, title, actions }: ChatPanelProps) {
  const { isOpen, close, inputRef } = useChat();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isBelowLg = useBelowBreakpoint("lg");
  const isModal = isOpen && isBelowLg;

  useLockBodyScroll(isModal);

  // Every time the panel comes into view, hand focus to the composer.
  // Retried across frames because the panel is only focusable once its
  // visibility has snapped; it stops as soon as focus lands anywhere inside
  // the panel, so it never fights the reader.
  useEffect(() => {
    if (!isOpen) return;

    let frame: number | null = null;
    let attempts = 0;

    const tryFocus = () => {
      frame = null;
      const input = inputRef.current;
      const panel = panelRef.current;
      if (!input || !panel) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && panel.contains(active)) return;
      input.focus();
      if (document.activeElement !== input && attempts++ < 30) {
        frame = requestAnimationFrame(tryFocus);
      }
    };

    frame = requestAnimationFrame(tryFocus);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [isOpen, inputRef]);

  // While modal, everything around the panel goes inert and focus that
  // escapes is pulled back to the composer.
  useEffect(() => {
    if (!isModal || !panelRef.current) return;

    const panel = panelRef.current;
    const inertSiblings: Array<{ element: HTMLElement; wasInert: boolean }> =
      [];
    let current: HTMLElement = panel;

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
      if (event.target instanceof Node && !panel.contains(event.target)) {
        inputRef.current?.focus();
      }
    };

    document.addEventListener("focusin", containFocus);

    return () => {
      document.removeEventListener("focusin", containFocus);
      for (const { element, wasInert } of inertSiblings) {
        element.inert = wasInert;
      }
    };
  }, [isModal, inputRef]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isModal) return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
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
    <div
      ref={panelRef}
      className="dcp-chat-panel"
      data-open={isOpen || undefined}
      inert={!isOpen}
      aria-hidden={!isOpen}
      role={isModal ? "dialog" : "complementary"}
      aria-modal={isModal ? "true" : undefined}
      aria-label={title}
      data-chat-panel
      onKeyDownCapture={handleKeyDown}
    >
      <div className="dcp-chat-panel__header">
        <span className="dcp-chat-panel__title">
          <Sparkles aria-hidden="true" />
          <h3>{title}</h3>
        </span>
        <span className="dcp-chat-panel__actions">
          {actions}
          <IconButton
            onClick={() => close()}
            aria-label="Close chat"
            title="Close chat"
          >
            <X aria-hidden="true" />
          </IconButton>
        </span>
      </div>
      {children}
    </div>
  );
}
`;
