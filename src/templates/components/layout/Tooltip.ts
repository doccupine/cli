export const tooltipTemplate = `"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";

// Layout cannot be measured during SSR; fall back to useEffect there so
// prerendering stays warning-free while the browser still measures before
// paint.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const VIEWPORT_MARGIN = 8;

interface TooltipProps {
  children: React.ReactNode;
  tip: string;
  headline?: string;
  cta?: string;
  href?: string;
}

function Tooltip({ children, tip, headline, cta, href }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("top");
  const [shift, setShift] = useState(0);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  // Keep the bubble inside the viewport: shift it horizontally when the
  // trigger sits near a screen edge, and flip it below the trigger when
  // there is no room above. The hidden bubble still has layout, so it can
  // be measured the moment it opens.
  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;
    const wrapper = wrapperRef.current;
    const bubble = bubbleRef.current;
    if (!wrapper || !bubble) return;
    const triggerRect = wrapper.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    setPlacement(
      triggerRect.top - bubbleRect.height - VIEWPORT_MARGIN < 0
        ? "bottom"
        : "top",
    );
    const center = triggerRect.left + triggerRect.width / 2;
    const half = bubbleRect.width / 2;
    if (center - half < VIEWPORT_MARGIN) {
      setShift(VIEWPORT_MARGIN - (center - half));
    } else if (center + half > window.innerWidth - VIEWPORT_MARGIN) {
      setShift(window.innerWidth - VIEWPORT_MARGIN - (center + half));
    } else {
      setShift(0);
    }
  }, [isOpen]);

  // Touch devices have no hover and fire blur unreliably, so a tap anywhere
  // outside must close the tooltip explicitly.
  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const wrapper = wrapperRef.current;
      if (
        wrapper &&
        event.target instanceof Node &&
        !wrapper.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [isOpen]);

  // The wrapper only listens for hover and focus moving within it, and the
  // trigger is a focusable phrase whose role comes from aria-describedby;
  // keyboard users open it by focusing it, so neither needs a widget role.
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      className="dcp-tooltip"
      ref={wrapperRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={(e) =>
        !e.currentTarget.contains(e.relatedTarget) && setIsOpen(false)
      }
      onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
    >
      {/* Click opens but never toggles closed: on touch, a tap can fire
          focus and click in the same gesture, and a toggle would close the
          tooltip the instant it opened. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <span
        className="dcp-tooltip__trigger"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-describedby={tooltipId}
        onClick={() => setIsOpen(true)}
      >
        {children}
      </span>
      <span
        className="dcp-tooltip__bubble"
        ref={bubbleRef}
        id={tooltipId}
        role="tooltip"
        data-open={isOpen || undefined}
        data-placement={placement}
        style={{ "--dcp-tooltip-shift": \`\${shift}px\` } as React.CSSProperties}
      >
        <span className="dcp-tooltip__content">
          {headline && (
            <span className="dcp-tooltip__headline">{headline}</span>
          )}
          {tip}
          {cta &&
            href &&
            (href.startsWith("/") ? (
              <Link className="dcp-tooltip__cta" href={href}>
                {cta}
              </Link>
            ) : (
              <a
                className="dcp-tooltip__cta"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {cta}
              </a>
            ))}
        </span>
      </span>
    </span>
  );
}

export { Tooltip };
`;
