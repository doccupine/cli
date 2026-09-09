export const dropdownTemplate = `"use client";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { interactiveStyles, useOnClickOutside } from "cherry-styled-components";
import { Theme } from "@/app/theme";

// The Doccupine platform's Dropdown, ported for the generated site: a
// bordered trigger that mirrors the search trigger, a menu that scales in and
// out, and click-outside dismissal. Menus that hold a set of choices pass
// role="menu" and render DropdownItem entries; the menu then also handles
// Escape (close, refocus the trigger), ArrowUp/ArrowDown (cycle the items),
// and moves focus to the checked entry when it opens.

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  /** Open below the trigger (default) or above it (sidebar footer). */
  placement?: "bottom" | "top";
  /** Stretch the trigger to its container's width. */
  fullWidth?: boolean;
  /** 30px pill trigger, for rows of icon buttons (the sidebar footer). */
  compact?: boolean;
  /** Accessible name of the menu, and of the trigger unless overridden. */
  label?: string;
  /** Accessible name of the trigger when its content does not say enough. */
  triggerLabel?: string;
  /** A menu of choices gets role="menu" and keyboard handling. */
  role?: "menu";
}

const DropdownContainer = styled.div<{ $fullWidth: boolean }>\`
  position: relative;
  display: \${({ $fullWidth }) => ($fullWidth ? "flex" : "inline-block")};
  \${({ $fullWidth }) =>
    $fullWidth &&
    css\`
      flex: 1;
      min-width: 0;
    \`}
\`;

// Mirrors the header's search trigger: the same bordered pill with Cherry's
// interactiveStyles for hover, focus, and active, applied to the focusable
// button itself so keyboard focus shows the rounded ring.
const DropdownTrigger = styled.button<{
  theme: Theme;
  $fullWidth: boolean;
  $compact: boolean;
}>\`
  \${interactiveStyles};
  display: flex;
  align-items: center;
  gap: 8px;
  width: \${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  min-width: 0;
  padding: 5px 10px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  border: 1px solid
    var(--border-color, \${({ theme }) => theme.colors.grayLight});
  background: transparent;
  color: inherit;
  font-family: inherit;
  cursor: pointer;

  /* Standing in a row of icon buttons: the same 30px pill, filled surface and
     border as the toggles beside it, so the whole row shares one rhythm. */
  \${({ $compact, theme }) =>
    $compact &&
    css\`
      gap: 6px;
      height: 30px;
      min-height: 0;
      padding: 0 10px;
      border-radius: \${theme.spacing.radius.xl};
      background: \${theme.colors.light};
    \`}
\`;

const DropdownMenu = styled.div<{
  theme: Theme;
  $align: "left" | "right";
  $placement: "bottom" | "top";
  $compact: boolean;
  $closing: boolean;
}>\`
  position: absolute;
  \${({ $placement }) =>
    $placement === "top"
      ? "bottom: calc(100% + 8px);"
      : "top: calc(100% + 8px);"}
  \${({ $align }) => ($align === "right" ? "right: 0;" : "left: 0;")}
  /* A compact trigger sits in a narrow rail, so its menu starts narrower too
     and still clears both edges of that rail whichever way it is aligned. */
  min-width: \${({ $compact }) => ($compact ? "160px" : "200px")};
  max-height: 280px;
  overflow-y: auto;
  background: \${({ theme }) => theme.colors.light};
  border: 1px solid \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  box-shadow: \${({ theme }) => theme.shadows.xs};
  z-index: 1000;
  transform-origin: \${({ $align, $placement }) =>
    \`\${$placement === "top" ? "bottom" : "top"} \${$align}\`};
  animation: \${({ $closing }) => ($closing ? "dropdownOut" : "dropdownIn")}
    0.15s ease forwards;

  @keyframes dropdownIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes dropdownOut {
    from {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to {
      opacity: 0;
      transform: scale(0.95) translateY(-4px);
    }
  }
\`;

const DropdownDivider = styled.div<{ theme: Theme }>\`
  height: 1px;
  background: \${({ theme }) => theme.colors.grayLight};
  margin: 0;
\`;

// One entry of a menu: the platform's menu link, as a button. The checked
// entry of a choice menu is tinted like a hovered one and keeps its weight.
const DropdownItem = styled.button<{ theme: Theme; $checked?: boolean }>\`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: none;
  border: none;
  text-align: left;
  font-family: inherit;
  font-size: \${({ theme }) => theme.fontSizes.small.xs};
  color: \${({ theme }) => theme.colors.primary};
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.3s ease;

  & svg {
    flex-shrink: 0;
    transition: color 0.3s;
  }

  /* A hairline between neighbours only: the first entry meets the menu's own
     border, and no entry draws a line on both edges. */
  & + & {
    border-top: 1px solid \${({ theme }) => theme.colors.grayLight};
  }

  &:hover {
    background: color-mix(
      in srgb,
      \${({ theme }) => theme.colors.primaryLight} 10%,
      transparent
    );
    color: \${({ theme }) =>
      theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
  }

  /* Inset so the menu's overflow does not clip it, square so the menu's own
     rounded corners shape it. */
  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }

  \${({ $checked, theme }) =>
    $checked &&
    css\`
      background: color-mix(
        in srgb,
        \${theme.colors.primaryLight} 10%,
        transparent
      );
    \`}
\`;

function Dropdown({
  trigger,
  children,
  align = "right",
  placement = "bottom",
  fullWidth = false,
  compact = false,
  label,
  triggerLabel,
  role,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => {
    setIsClosing(true);
  }, []);

  const open = useCallback(() => {
    setIsVisible(true);
    setIsOpen(true);
    setIsClosing(false);
  }, []);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, close, open]);

  const handleAnimationEnd = useCallback(() => {
    if (isClosing) {
      setIsOpen(false);
      setIsVisible(false);
      setIsClosing(false);
    }
  }, [isClosing]);

  useOnClickOutside([containerRef], isOpen && !isClosing ? close : () => {});

  // A choice menu lands focus on the checked entry (or the first one).
  useEffect(() => {
    if (!isOpen || isClosing || role !== "menu") return;
    const menu = menuRef.current;
    if (!menu) return;
    const checked = menu.querySelector<HTMLElement>('[aria-checked="true"]');
    (checked ?? menu.querySelector<HTMLElement>("button, a"))?.focus();
  }, [isOpen, isClosing, role]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
      return;
    }
    if (role !== "menu") return;
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>("button, a"),
    );
    if (items.length === 0) return;
    const step = event.key === "ArrowDown" ? 1 : -1;
    const index = items.indexOf(document.activeElement as HTMLElement);
    items[(index + step + items.length) % items.length]?.focus();
  };

  return (
    <DropdownContainer ref={containerRef} $fullWidth={fullWidth}>
      <DropdownTrigger
        ref={triggerRef}
        type="button"
        $fullWidth={fullWidth}
        $compact={compact}
        aria-label={triggerLabel ?? label}
        aria-haspopup={role}
        aria-expanded={role ? isOpen && !isClosing : undefined}
        aria-controls={role ? menuId : undefined}
        onClick={handleToggle}
      >
        {trigger}
      </DropdownTrigger>
      {isVisible && (
        <DropdownMenu
          id={role ? menuId : undefined}
          ref={menuRef}
          role={role}
          aria-label={role ? label : undefined}
          $align={align}
          $placement={placement}
          $compact={compact}
          $closing={isClosing}
          onClick={close}
          onKeyDown={handleKeyDown}
          onAnimationEnd={handleAnimationEnd}
        >
          {children}
        </DropdownMenu>
      )}
    </DropdownContainer>
  );
}

export { Dropdown, DropdownDivider, DropdownItem };
`;
