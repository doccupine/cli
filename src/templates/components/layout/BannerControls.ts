export const bannerControlsTemplate = `"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useStrings } from "@/components/useStrings";

interface BannerControlsProps {
  /** The banner's content id, remembered when the reader dismisses it. */
  id: string;
  dismissible: boolean;
}

const DISMISSED_KEY = "doccupine:banner-dismissed";

function setBannerHeight(height: number) {
  const root = document.documentElement;
  root.style.setProperty("--dcp-banner-height", \`\${height}px\`);
  root.style.setProperty(
    "--dcp-banner-offset",
    \`\${Math.max(0, height - window.scrollY)}px\`,
  );
}

/**
 * Keeps the banner's measurements current after the pre-paint script took
 * the first ones: its height when the text rewraps, and how much of it is
 * still on screen as the page scrolls (the fixed rails start below that).
 * And, when the banner is dismissible, its close button.
 */
function BannerControls({ id, dismissible }: BannerControlsProps) {
  const t = useStrings();

  useEffect(() => {
    const banner = document.getElementById("dcp-banner");
    if (!banner) return;
    const measure = () =>
      setBannerHeight(banner.hidden ? 0 : banner.offsetHeight);
    const observer = new ResizeObserver(measure);
    observer.observe(banner);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure);
    };
  }, []);

  if (!dismissible) return null;

  // The banner collapses and fades out (banner.ts), and the page below
  // slides up with it: the ResizeObserver above hands every frame's height
  // to the header and the rails. Once the collapse ends it leaves the flow.
  // Under reduced motion there is no transition, so it goes at once.
  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, id);
    } catch {
      // Storage is blocked: the banner stays closed for this page view.
    }
    // Focus would be lost with the button: it moves to the main content,
    // where the skip link leads, without scrolling the page.
    document.getElementById("content")?.focus({ preventScroll: true });
    const banner = document.getElementById("dcp-banner");
    if (!banner) return;
    const remove = () => {
      banner.hidden = true;
      setBannerHeight(0);
    };
    const animated =
      parseFloat(getComputedStyle(banner).transitionDuration) > 0 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animated) {
      remove();
      return;
    }
    banner.addEventListener("transitionend", (event) => {
      if (event.target === banner) remove();
    });
    // In case the transition never ends (a background tab, say).
    window.setTimeout(remove, 600);
    banner.setAttribute("data-dismissing", "");
  };

  return (
    <button
      type="button"
      className="dcp-reset-button dcp-banner__dismiss"
      aria-label={t.dismissBanner}
      onClick={dismiss}
    >
      <X size={16} aria-hidden="true" />
    </button>
  );
}

export { BannerControls };
`;
