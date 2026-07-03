export const cherryThemeProviderTemplate = `import React from "react";
import { ClientThemeProvider } from "cherry-styled-components";
import { Theme } from "@/app/theme";
import { GlobalStyles } from "@/components/layout/GlobalStyles";

/**
 * Wraps Cherry's ClientThemeProvider, which swaps theme/themeDark on toggle,
 * persists the choice to the \`theme\` cookie + localStorage, and keeps the
 * "dark" class on <html> in sync. Deliberately reads NO request data
 * (cookies/headers) so pages stay statically renderable — the blocking
 * theme-init script in the root layout sets the "dark" class before paint
 * and hides the body on dark visits; the provider reconciles against the
 * cookie on mount and removes the hiding style. $globalStyles is off because
 * this app ships its own GlobalStyles; $themeColor tracks "light", the
 * html/body background.
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
      $themeColor="light"
    >
      <GlobalStyles />
      {children}
    </ClientThemeProvider>
  );
}

export { CherryThemeProvider };
`;
