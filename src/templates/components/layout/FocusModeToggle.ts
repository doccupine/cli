export const focusModeToggleTemplate = `"use client";
import { useEffect, useRef, useState } from "react";
import { useStrings } from "@/components/useStrings";
import { Icon } from "@/components/layout/Icon";

// Desktop-only affordance that collapses both rails for distraction-free
// reading. The button is fixed rather than living in the sidebar footer next
// to the theme control: the footer slides away with the sidebar, and the way
// back out of focus mode has to stay on screen. Styles: app/styles
// (.dcp-focus-toggle).
function FocusModeToggle() {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const t = useStrings();

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
  // in CSS (the html[data-focus-mode] rules in app/styles).
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
    <button
      ref={buttonRef}
      type="button"
      className="dcp-reset-button dcp-pill dcp-pill-round dcp-focus-toggle"
      onClick={() => setIsFocusMode((value) => !value)}
      aria-pressed={isFocusMode}
      aria-label={isFocusMode ? t.exitFocusMode : t.enterFocusMode}
      title={(isFocusMode ? t.exitFocusMode : t.focusMode) + " (⌘B)"}
    >
      <Icon name={isFocusMode ? "minimize" : "maximize"} size={16} />
    </button>
  );
}

export { FocusModeToggle };
`;
