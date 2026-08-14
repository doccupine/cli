import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_SITE_NAME,
} from "./constants.js";
import type { FontConfig, SectionConfig } from "./types.js";

function formatObjectArray<T extends object>(items: T[]): string {
  const MAX_WIDTH = 80;
  const formatted = items.map((item) => {
    const lines: string[] = ["  {"];
    const entries = Object.entries(item) as [string, unknown][];
    for (const [key, value] of entries) {
      const valueStr = JSON.stringify(value);
      const line = `    ${key}: ${valueStr},`;
      if (line.length > MAX_WIDTH) {
        lines.push(`    ${key}:`);
        lines.push(`      ${valueStr},`);
      } else {
        lines.push(line);
      }
    }
    lines.push("  },");
    return lines.join("\n");
  });
  return "[\n" + formatted.join("\n") + "\n]";
}

interface PageData {
  slug: string;
  title: string;
  description: string;
  date: string | null;
  category: string;
  path: string;
  categoryOrder: number;
  order: number;
  section: string;
}

function isGoogleFont(
  fc: FontConfig | null,
): fc is FontConfig & { googleFont: NonNullable<FontConfig["googleFont"]> } {
  return (
    !!fc?.googleFont?.fontName &&
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(fc.googleFont.fontName)
  );
}

function isLocalFont(fc: FontConfig | null): boolean {
  if (!fc?.localFonts) return false;
  if (typeof fc.localFonts === "string") return true;
  return !!fc.localFonts.src?.length;
}

function getLocalFontSrc(fc: FontConfig): string {
  if (typeof fc.localFonts === "string") return JSON.stringify(fc.localFonts);
  return JSON.stringify(fc.localFonts?.src, null, 2);
}

function fontImportLine(fontConfig: FontConfig | null): string {
  return isGoogleFont(fontConfig)
    ? `import { ${fontConfig.googleFont.fontName} } from "next/font/google";`
    : isLocalFont(fontConfig)
      ? 'import localFont from "next/font/local";'
      : 'import { Inter } from "next/font/google";';
}

function fontDeclLine(fontConfig: FontConfig | null): string {
  if (isGoogleFont(fontConfig)) {
    const options = [
      fontConfig.googleFont.subsets?.length
        ? `subsets: [${fontConfig.googleFont.subsets
            .map((subset) => JSON.stringify(subset))
            .join(", ")}]`
        : "",
      fontConfig.googleFont.weight?.length
        ? `weight: ${
            Array.isArray(fontConfig.googleFont.weight)
              ? `[${fontConfig.googleFont.weight
                  .map((weight) => JSON.stringify(weight))
                  .join(", ")}]`
              : JSON.stringify(fontConfig.googleFont.weight)
          }`
        : "",
    ].filter(Boolean);

    return options.length
      ? `const font = ${fontConfig.googleFont.fontName}({
  ${options.join(",\n  ")},
});`
      : `const font = ${fontConfig.googleFont.fontName}({});`;
  }

  return isLocalFont(fontConfig)
    ? `const font = localFont({
  src: ${getLocalFontSrc(fontConfig!)},
});`
    : 'const font = Inter({ subsets: ["latin"] });';
}

// The inline blocking script that resolves dark mode before the first paint.
// It only has to decide the mode and record it on <html>: every painted color
// in the app resolves through the CSS custom properties that GlobalStyles
// emits under :root and :root[data-theme="dark"], so that one attribute is
// enough to make a statically rendered page arrive dark. Nothing is hidden and
// nothing waits for hydration — the markup streams and paints in the right
// theme exactly like a light visit does.
//
// The mode lives on our own data-theme attribute rather than on the "dark"
// class, because that class belongs to Cherry's ClientThemeProvider, which
// syncs it from the theme object: releases before 0.2.12 strip it for a frame
// on mount, since the server render is always the light theme, and every color
// on the page would flash light with it. The class is still set here so CSS
// written against it — Cherry's own, or a user's — keeps working.
//
// The mode comes from the "theme" cookie, falling back to the OS preference
// and seeding the cookie so Cherry's ClientThemeProvider reconciles against
// the same answer on mount instead of flipping the class back.
//
// The script also emits the theme-color meta for the resolved mode through
// document.write, which hands the tag to the HTML parser itself: Safari only
// tints its chrome reliably from a parser-inserted tag - one created through
// the DOM APIs is honored inconsistently or not at all - though it does track
// content updates to such a tag, which is how Cherry's post-hydration sync
// and theme toggles keep it current. The meta cannot be rendered from the
// layout instead: pages are static, so the server would emit one mode's color
// and this script would have to correct it before paint, and React 19
// hydration treats a head meta whose attributes differ from its props as
// missing and inserts a duplicate with the stale light color beside it -
// suppressHydrationWarning does not cover hoisted metas, and a meta emitted
// through Next's viewport export hydrates the same way (both verified against
// Next 16.3; the duplicate is what broke the chrome tint on iPad Safari).
// OS-scheme-scoped SSR metas are no answer either: the site's mode is
// cookie-based, so a dark site on a light-OS device would show the wrong
// browser chrome until hydration - a visible flash on every load. Keeping the
// tag out of React leaves exactly one meta that nothing ever re-inserts. The
// \${...} palette interpolations below are escaped so they resolve in the
// generated layout, at app build time, from the imported theme palettes. The
// token must match the provider's $themeColor (primary), so the pre-paint
// chrome color equals what Cherry syncs after hydration.
const THEME_INIT_SCRIPT = `(function(){try{var c=document.cookie.split(";").map(function(s){return s.trim();}).find(function(s){return s.indexOf("theme=")===0;});var v=c?c.split("=")[1]:null;var d=v?v==="dark":(window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches);if(!v){document.cookie="theme="+(d?"dark":"light")+";path=/;max-age=31536000;SameSite=Lax";}var r=document.documentElement;r.dataset.theme=d?"dark":"light";if(d){r.classList.add("dark");}document.write('<meta name="theme-color" content="'+(d?"\${colorsDark.primary}":"\${colorsLight.primary}")+'">');}catch(e){}})();`;

/**
 * Root layout ("app/layout.tsx"). Minimal shell: html/body, fonts, the theme
 * provider stack, and (optionally) PostHog. It renders `children` directly so
 * both the docs (via the "(site)" layout) and the password gate ("app/gate")
 * share the same providers and theme without the docs chrome. Deliberately has
 * NO request-time data (cookies/headers) so pages stay statically renderable —
 * the SITE_PASSWORD gate is enforced in the middleware (proxy.ts), which
 * rewrites locked page requests to "/gate".
 */
export const rootLayoutTemplate = (
  fontConfig: FontConfig | null,
  analyticsEnabled: boolean = false,
): string => {
  return `import type { Metadata } from "next";
${fontImportLine(fontConfig)}
import { StyledComponentsRegistry } from "cherry-styled-components/next";
import { colorsDark, colorsLight, theme, themeDark } from "@/app/theme";
import { CherryThemeProvider } from "@/components/layout/CherryThemeProvider";
import { config } from "@/utils/config";
import { siteIcons } from "@/utils/icons";
${analyticsEnabled ? `import { PostHogProvider } from "@/components/PostHogProvider";\n` : ""}
${fontDeclLine(fontConfig)}

function resolveSiteUrl(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? config.url;
  if (!raw || typeof raw !== "string") return undefined;
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: config.name || "${DEFAULT_SITE_NAME}",
  description:
    config.description ||
    "${DEFAULT_DESCRIPTION}",
  icons: siteIcons,
  openGraph: {
    title: config.name || "${DEFAULT_SITE_NAME}",
    description:
      config.description ||
      "${DEFAULT_DESCRIPTION}",
    images: config.image || "${DEFAULT_OG_IMAGE}",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Resolves dark mode before the first paint by stamping data-theme
            on <html>, which flips the CSS variables in GlobalStyles.
            Inlined as a plain <script> (not next/script) so it ships in the
            SSR HTML and runs synchronously before paint — next/script with
            beforeInteractive is async in App Router and would flash.
            suppressHydrationWarning on <html> tells React the class is
            intentionally different between server (none) and client. */}
        <script
          dangerouslySetInnerHTML={{
            __html: \`${THEME_INIT_SCRIPT}\`,
          }}
        />
      </head>
      <body className={font.className}>
        <StyledComponentsRegistry>
${
  analyticsEnabled
    ? `          <PostHogProvider>
            <CherryThemeProvider theme={theme} themeDark={themeDark}>
              {children}
            </CherryThemeProvider>
          </PostHogProvider>`
    : `          <CherryThemeProvider theme={theme} themeDark={themeDark}>
            {children}
          </CherryThemeProvider>`
}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
`;
};

/**
 * Docs chrome layout ("app/(site)/layout.tsx"). Wraps every documentation page
 * with the header, sidebar/section navigation, chat, and footer. Lives in the
 * URL-transparent "(site)" route group so it wraps the docs but NOT the gate
 * screen at "/gate", which renders under the root shell alone. Renders inside
 * the root layout's providers, so it needs no html/body or theme provider.
 */
export const siteLayoutTemplate = (
  pages: PageData[],
  sectionsConfig: SectionConfig[] | null = null,
): string => {
  const hasSections = sectionsConfig !== null && sectionsConfig.length > 0;
  const chtOpen = `<ChtProvider isChatActive={process.env.LLM_PROVIDER ? true : false}>`;

  return `import dynamic from "next/dynamic";
import { ChtProvider } from "@/components/Chat";
import { SearchProvider } from "@/components/SearchDocs";
${
  hasSections
    ? ""
    : `import { Footer } from "@/components/layout/Footer";
`
}import { Header } from "@/components/layout/Header";
import { DocsWrapper, LlmsDirective } from "@/components/layout/DocsComponents";
${
  hasSections
    ? ""
    : `import { SectionBarProvider } from "@/components/layout/DocsComponents";
import { SideBar } from "@/components/SideBar";
import { DocsNavigation } from "@/components/layout/DocsNavigation";
`
}import { type PagesProps } from "@/utils/orderNavItems";
${
  hasSections
    ? ""
    : `import { transformPagesToGroupedStructure } from "@/utils/orderNavItems";
`
}${
    hasSections
      ? ""
      : `import { StaticLinks } from "@/components/layout/StaticLinks";
`
  }import { verifyBrandingKey } from "@/utils/branding";
${
  hasSections
    ? ""
    : `import navigation from "@/navigation.json";
`
}
${
  hasSections
    ? `import { SectionBar } from "@/components/layout/SectionBar";
import { SectionNavProvider } from "@/components/SectionNavProvider";
`
    : ""
}const Chat = dynamic(() => import("@/components/Chat").then((mod) => mod.Chat));

const doccupinePages = ${formatObjectArray(pages)};${hasSections ? `\nconst doccupineSections = ${formatObjectArray(sectionsConfig!)};` : ""}

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hideBranding = verifyBrandingKey();
${
  hasSections
    ? `
  const pages: PagesProps[] = doccupinePages;

  return (
    ${chtOpen}
      <SearchProvider pages={pages} sections={doccupineSections}>
        <LlmsDirective />
        <Header>
          <SectionBar sections={doccupineSections} />
        </Header>
        {process.env.LLM_PROVIDER && <Chat />}
        <DocsWrapper>
          <SectionNavProvider
            sections={doccupineSections}
            allPages={pages}
            hideBranding={hideBranding}
          >
            {children}
          </SectionNavProvider>
        </DocsWrapper>
      </SearchProvider>
    </ChtProvider>
  );
}`
    : `
  const defaultPages = [
    {
      slug: "",
      title: "Getting Started",
      description:
        "${DEFAULT_DESCRIPTION}",
      date: "2025-01-15",
      category: "Introduction",
      categoryOrder: 0,
      categoryIcon: "rocket",
      order: 0,
    },
  ];

  const pages: PagesProps[] = doccupinePages;
  const result =
    Array.isArray(navigation) && navigation.length
      ? navigation
      : transformPagesToGroupedStructure(pages);
  const defaultResults = transformPagesToGroupedStructure(defaultPages);

  return (
    ${chtOpen}
      <SearchProvider pages={pages}>
        <LlmsDirective />
        <Header />
        {process.env.LLM_PROVIDER && <Chat />}
        <SectionBarProvider hasSectionBar={false}>
          <DocsWrapper>
            <SideBar result={result.length ? result : defaultResults} />
            {children}
            <DocsNavigation result={result.length ? result : defaultResults} />
            <StaticLinks />
            <Footer hideBranding={hideBranding} />
          </DocsWrapper>
        </SectionBarProvider>
      </SearchProvider>
    </ChtProvider>
  );
}`
}
`;
};
