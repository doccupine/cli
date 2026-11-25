export const bannerTemplate = `import { config } from "@/utils/config";
import { renderInline } from "@/components/layout/InlineMarkdown";
import { BannerControls } from "@/components/layout/BannerControls";

// Styles: app/styles/design.css (.dcp-banner, see
// src/templates/styles/banner.ts in the CLI).

// FNV-1a of the text: a dismissal is remembered for this exact content, so
// changing the announcement shows it again to readers who closed the old one.
function contentId(text: string): string {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

// Runs as the parser reaches it, before the first paint: hides a banner the
// reader dismissed, then records its height for the header and the fixed
// rails (--dcp-banner-height, and --dcp-banner-offset for the part still on
// screen). It reads only the element above it, so it carries no data.
const BANNER_INIT_SCRIPT = \`(function(){try{var b=document.getElementById("dcp-banner");if(!b)return;var r=document.documentElement;try{if(b.hasAttribute("data-dismissible")&&localStorage.getItem("doccupine:banner-dismissed")===b.getAttribute("data-banner-id"))b.hidden=true;}catch(e){}var h=b.hidden?0:b.offsetHeight;r.style.setProperty("--dcp-banner-height",h+"px");r.style.setProperty("--dcp-banner-offset",Math.max(0,h-window.scrollY)+"px");}catch(e){}})();\`;

/**
 * The site-wide announcement from config.json's "banner", above the header.
 * The text accepts links, bold, italic and inline code (renderInline), never
 * raw HTML. It scrolls away with the page; the header pins once it is gone.
 */
function Banner() {
  const banner = config.banner;
  if (!banner) return null;
  const id = contentId(banner.content);
  return (
    <>
      <div
        id="dcp-banner"
        className="dcp-banner"
        data-banner-id={id}
        data-dismissible={banner.dismissible || undefined}
        suppressHydrationWarning
      >
        {/* The bar sits in a one-row grid, so dismissing can animate the
            row from its height to nothing (banner.ts). */}
        <div className="dcp-banner__clip">
          <div className="dcp-banner__bar">
            <p className="dcp-banner__content">
              {renderInline(banner.content)}
            </p>
            <BannerControls id={id} dismissible={banner.dismissible ?? false} />
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: BANNER_INIT_SCRIPT }} />
    </>
  );
}

export { Banner };
`;
