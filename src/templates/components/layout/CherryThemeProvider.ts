export const cherryThemeProviderTemplate = `"use client";
import React, { useEffect, useRef } from "react";
import { useTheme } from "styled-components";
import { ClientThemeProvider } from "cherry-styled-components";
import { Theme } from "@/app/theme";
import { GlobalStyles } from "@/components/layout/GlobalStyles";

/**
 * Mirrors the active mode onto the data-theme attribute that every themed
 * selector keys off (see GlobalStyles).
 *
 * The attribute is already correct before the first paint - the blocking script
 * in the root layout sets it from the theme cookie - but the provider's first
 * client render still carries the light theme the server rendered, so the
 * active theme cannot be trusted until the provider has reconciled it against
 * the cookie. The mirror therefore reads the cookie, not the theme object:
 * the blocking script seeds it pre-paint and Cherry persists it synchronously
 * before any re-render on toggles and reconciliation, so writing it is
 * idempotent. Counting effect passes instead (a "skip the first run" ref)
 * breaks under StrictMode's dev double-invocation: the second pass writes the
 * unreconciled light theme and the whole page flashes white on dark loads.
 * The theme object is only a fallback for browsers that block cookies, where
 * the first (unreconciled) pass must still be skipped.
 *
 * This effect must stay a child of ClientThemeProvider: child effects run
 * first, so the attribute is updated before the provider's own theme-color
 * sync resolves var(--color-primary) against the document's computed styles.
 */
function ThemeModeAttribute() {
  const activeTheme = useTheme() as Theme;
  const settled = useRef(false);

  useEffect(() => {
    const mode = /(?:^|;\\s*)theme=(dark|light)(?:;|$)/.exec(document.cookie);
    if (mode) {
      document.documentElement.dataset.theme = mode[1];
    } else if (settled.current) {
      document.documentElement.dataset.theme = activeTheme.isDark
        ? "dark"
        : "light";
    } else {
      settled.current = true;
    }
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
 * $globalStyles is off because this app ships its own GlobalStyles.
 * $themeColor="primary" hands the post-hydration theme-color sync to Cherry
 * with the branded chrome Cherry's own site uses: since 0.2.15 the provider
 * resolves var() color references through computed styles, so the \`primary\`
 * token yields each mode's brand hex for the active data-theme. The blocking
 * script in the root layout writes the same token's value before first
 * paint; the provider takes over from there, so the two must stay on the
 * same token.
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
      $themeColor="primary"
    >
      <GlobalStyles />
      <ThemeModeAttribute />
      {children}
    </ClientThemeProvider>
  );
}

export { CherryThemeProvider };
`;
