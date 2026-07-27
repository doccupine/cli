export const focusModeToggleTemplate = `"use client";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { resetButton } from "cherry-styled-components";
import { Icon } from "@/components/layout/Icon";
import { mq, Theme } from "@/app/theme";
import { interactiveStyles } from "@/components/layout/SharedStyled";

// Desktop-only affordance that collapses both rails for distraction-free
// reading. The button is fixed rather than living in the sidebar footer next
// to the ThemeToggle: the footer slides away with the sidebar, and the way
// back out of focus mode has to stay on screen.
const StyledFocusToggle = styled.button<{ theme: Theme }>\`
  display: none;

  \${mq("lg")} {
    \${resetButton};
    \${interactiveStyles};
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    /* Above the sidebar (99) so it stays clickable once the rails are out,
       below the chat panel (1000). */
    z-index: 100;
    /* Sidebar footer row, flush with the footer's left padding (the
       ThemeToggle holds the right end of the same row). */
    left: 20px;
    bottom: 16px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: \${({ theme }) => theme.colors.light};
    border-color: \${({ theme }) => theme.colors.grayLight};

    & svg {
      width: 16px;
      height: 16px;
    }

    & svg[stroke] {
      stroke: \${({ theme }) => theme.colors.primary};
    }

    &:hover svg[stroke] {
      stroke: \${({ theme }) => theme.colors.accent};
    }
  }
\`;

function FocusModeToggle() {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cmd/Ctrl+B, the editor convention for collapsing the side columns. Sits
  // alongside the app's other chords (Cmd+K search, Cmd+I chat,
  // Cmd+Shift+L theme) and stays out of the way while the reader is typing.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      if (e.key.toLowerCase() !== "b") return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      // The button is display:none below "lg" and focus mode is a desktop
      // layout, so the shortcut is live exactly when the button is.
      const button = buttonRef.current;
      if (!button || getComputedStyle(button).display === "none") return;
      e.preventDefault();
      setIsFocusMode((value) => !value);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // The nav sidebar, the right rail and the content columns sit in separate
  // subtrees, so the state rides on the root element and each of them reacts
  // in CSS (see focusModeHide / focusModeColumn in SharedStyled).
  useEffect(() => {
    const root = document.documentElement;
    if (isFocusMode) {
      root.setAttribute("data-focus-mode", "");
    } else {
      root.removeAttribute("data-focus-mode");
    }
    return () => root.removeAttribute("data-focus-mode");
  }, [isFocusMode]);

  return (
    <StyledFocusToggle
      ref={buttonRef}
      type="button"
      onClick={() => setIsFocusMode((value) => !value)}
      aria-pressed={isFocusMode}
      aria-label={isFocusMode ? "Exit focus mode" : "Enter focus mode"}
      title={isFocusMode ? "Exit focus mode (⌘B)" : "Focus mode (⌘B)"}
    >
      <Icon name={isFocusMode ? "minimize" : "maximize"} size={16} />
    </StyledFocusToggle>
  );
}

export { FocusModeToggle };
`;
