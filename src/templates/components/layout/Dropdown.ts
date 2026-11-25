export const dropdownTemplate = `"use client";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { useOnClickOutside } from "@/components/useOnClickOutside";

// The Doccupine platform's Dropdown, ported for the generated site: a
// bordered trigger that mirrors the search trigger, a menu that scales in and
// out, and click-outside dismissal. Menus that hold a set of choices pass
// role="menu" and render DropdownItem entries; the menu then also handles
// Escape (close, refocus the trigger), ArrowUp/ArrowDown (cycle the items),
// and moves focus to the checked entry when it opens. Styles: app/styles
// (.dcp-dropdown).

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

function DropdownDivider() {
  return <div className="dcp-dropdown__divider" />;
}

// One entry of a menu: the platform's menu link, as a button. The checked
// entry of a choice menu is tinted like a hovered one and keeps its weight.
function DropdownItem({
  checked,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { checked?: boolean }) {
  return (
    <button
      {...props}
      className={
        className ? \`dcp-dropdown__item \${className}\` : "dcp-dropdown__item"
      }
      data-checked={checked || undefined}
    />
  );
}

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
    <div
      className="dcp-dropdown"
      ref={containerRef}
      data-full-width={fullWidth || undefined}
    >
      <button
        className="dcp-dropdown__trigger"
        ref={triggerRef}
        type="button"
        data-full-width={fullWidth || undefined}
        data-compact={compact || undefined}
        aria-label={triggerLabel ?? label}
        aria-haspopup={role}
        aria-expanded={role ? isOpen && !isClosing : undefined}
        aria-controls={role ? menuId : undefined}
        onClick={handleToggle}
      >
        {trigger}
      </button>
      {isVisible && (
        <div
          className="dcp-dropdown__menu"
          id={role ? menuId : undefined}
          ref={menuRef}
          role={role}
          aria-label={role ? label : undefined}
          data-align={align}
          data-placement={placement}
          data-compact={compact || undefined}
          data-closing={isClosing || undefined}
          onClick={close}
          onKeyDown={handleKeyDown}
          onAnimationEnd={handleAnimationEnd}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export { Dropdown, DropdownDivider, DropdownItem };
`;
