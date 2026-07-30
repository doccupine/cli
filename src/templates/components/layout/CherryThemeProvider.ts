export const cherryThemeProviderTemplate = `"use client";
import React, { useEffect, useRef } from "react";
import { useTheme } from "styled-components";
import { ClientThemeProvider } from "cherry-styled-components";
import { colorsDark, colorsLight, Theme } from "@/app/theme";
import { GlobalStyles } from "@/components/layout/GlobalStyles";

/**
 * Mirrors the active mode onto the data-theme attribute that every themed
 * selector keys off (see GlobalStyles), and keeps the theme-color meta tag in
 * step so browser chrome (the iOS Safari status bar) matches the page.
 *
 * The attribute is already correct before the first paint - the blocking script
 * in the root layout sets it from the theme cookie - and the provider's first
 * client render still carries the light theme the server rendered, so the first
 * pass leaves it alone and only later changes are written: the provider's own
 * reconciliation against the cookie, and user toggles. Writing on the first
 * pass would flip the whole page to light for a frame on every dark load.
 */
function ThemeModeAttribute() {
  const activeTheme = useTheme() as Theme;
  const settled = useRef(false);

  useEffect(() => {
    const root = document.documentElement;

    if (settled.current) {
      root.dataset.theme = activeTheme.isDark ? "dark" : "light";
    } else {
      settled.current = true;
    }

    // A meta tag cannot resolve a custom property, and every color on the theme
    // object is a var() reference, so read the palette that GlobalStyles built
    // its variables from. \`light\` is the page background in both modes.
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content =
      root.dataset.theme === "dark" ? colorsDark.light : colorsLight.light;
  }, [activeTheme.isDark]);

  return null;
}

/**
 * Wraps Cherry's ClientThemeProvider, which swaps theme/themeDark on toggle and
 * persists the choice to the \`theme\` cookie + localStorage. Deliberately reads
 * NO request data (cookies/headers) so pages stay statically renderable.
 *
 * The two theme objects hold the same CSS-variable colors and differ only in
 * \`isDark\`, so the visible mode is decided entirely by the data-theme
 * attribute on <html>, which ThemeModeAttribute keeps in step. The provider
 * also maintains a "dark" class of its own; nothing here depends on it, because
 * it is briefly out of step on mount while the provider reconciles the
 * server-rendered light theme against the cookie.
 *
 * $globalStyles is off because this app ships its own GlobalStyles, and
 * $themeColor is off because ThemeModeAttribute writes that meta tag itself
 * from resolved colors.
 */
function CherryThemeProvider({
  children,
  theme,
  themeDark,
}: {
  children: React.ReactNode;
  theme: Theme;
  themeDark: Theme;
}) {
  return (
    <ClientThemeProvider
      theme={theme}
      themeDark={themeDark}
      $globalStyles={false}
      $themeColor={false}
    >
      <GlobalStyles />
      <ThemeModeAttribute />
      {children}
    </ClientThemeProvider>
  );
}

export { CherryThemeProvider };
`;
