export const tooltipTemplate = `"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import styled, { css } from "styled-components";
import { styledSmall } from "cherry-styled-components";
import { Theme } from "@/app/theme";

// Layout cannot be measured during SSR; fall back to useEffect there so
// prerendering stays warning-free while the browser still measures before
// paint.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const VIEWPORT_MARGIN = 8;

const StyledTooltip = styled.span\`
  position: relative;
  display: inline-block;
\`;

const StyledTooltipTrigger = styled.span<{ theme: Theme }>\`
  cursor: help;
  text-decoration: underline dotted 1.5px;
  text-decoration-color: \${({ theme }) => theme.colors.gray};
  text-underline-offset: 4px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;

// The gap between trigger and bubble is padding on the positioner (not a
// margin) so the pointer never crosses empty space on its way to the CTA
// link, which would fire mouseleave and close the tooltip early.
const StyledTooltipBubble = styled.span<{
  theme: Theme;
  $isOpen: boolean;
  $placement: "top" | "bottom";
  $shift: number;
}>\`
  position: absolute;
  left: 50%;
  transform: translateX(calc(-50% + \${({ $shift }) => $shift}px));
  width: max-content;
  max-width: min(260px, calc(100vw - 16px));
  z-index: 10;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;

  \${({ $placement }) =>
    $placement === "top"
      ? css\`
          bottom: 100%;
          padding-bottom: 8px;
        \`
      : css\`
          top: 100%;
          padding-top: 8px;
        \`}

  \${({ $isOpen }) =>
    $isOpen &&
    css\`
      opacity: 1;
      visibility: visible;
    \`}
\`;

const StyledTooltipContent = styled.span<{ theme: Theme }>\`
  display: block;
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 10px 14px;
  \${({ theme }) => styledSmall(theme)};
  color: \${({ theme }) => theme.colors.grayDark};
  text-align: left;
\`;

const StyledTooltipHeadline = styled.span<{ theme: Theme }>\`
  display: block;
  font-weight: 700;
  color: \${({ theme }) => theme.colors.dark};
\`;

const StyledTooltipCta = styled.a<{ theme: Theme }>\`
  display: block;
  margin-top: 5px;
  font-weight: 700;
  color: \${({ theme }) => theme.colors.primary};
  text-decoration: none;
  transition: color 0.3s ease;

  &:hover {
    color: \${({ theme }) => theme.colors.primaryDark};
  }
\`;

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

  return (
    <StyledTooltip
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
      <StyledTooltipTrigger
        tabIndex={0}
        aria-describedby={tooltipId}
        onClick={() => setIsOpen(true)}
      >
        {children}
      </StyledTooltipTrigger>
      <StyledTooltipBubble
        ref={bubbleRef}
        id={tooltipId}
        role="tooltip"
        $isOpen={isOpen}
        $placement={placement}
        $shift={shift}
      >
        <StyledTooltipContent>
          {headline && (
            <StyledTooltipHeadline>{headline}</StyledTooltipHeadline>
          )}
          {tip}
          {cta &&
            href &&
            (href.startsWith("/") ? (
              <StyledTooltipCta as={Link} href={href}>
                {cta}
              </StyledTooltipCta>
            ) : (
              <StyledTooltipCta
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {cta}
              </StyledTooltipCta>
            ))}
        </StyledTooltipContent>
      </StyledTooltipBubble>
    </StyledTooltip>
  );
}

export { Tooltip };
`;
