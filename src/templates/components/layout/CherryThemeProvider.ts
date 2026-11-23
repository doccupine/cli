export const cherryThemeProviderTemplate = `"use client";
import React from "react";
import { ClientThemeProvider } from "cherry-styled-components";
import { theme, themeDark } from "@/app/theme";
import { GlobalStyles } from "@/components/layout/GlobalStyles";

/**
 * Cherry's theme provider for both modes. It hands styled-components one theme
 * whose colors and shadows are CSS variables, declares the light and dark
 * values, and switches the mode by flipping the \`dark\` class on <html>, so a
 * toggle renders no styled component again. The visitor's choice (light, dark
 * or system) is stored in localStorage and mirrored to the \`theme\` cookie.
 * Read the mode with Cherry's useColorMode() where CSS cannot do the job.
 *
 * The blocking script in the root layout sets the class before the first paint
 * and writes the theme-color meta through document.write, the only form
 * Safari tints its chrome from reliably. After hydration Cherry keeps that
 * tag's content on the \`primary\` token ($themeColor), the same token the
 * script uses, and only ever rewrites its content.
 *
 * Deliberately reads NO request data (cookies/headers) so pages stay
 * statically renderable. $globalStyles is off because this app ships its own
 * GlobalStyles.
 */
function CherryThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClientThemeProvider
      theme={theme}
      themeDark={themeDark}
      $themeColor="primary"
      $globalStyles={false}
    >
      <GlobalStyles />
      {children}
    </ClientThemeProvider>
  );
}

export { CherryThemeProvider };
`;
