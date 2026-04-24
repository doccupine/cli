export const cherryThemeProviderTemplate = `import React from "react";
import { Theme } from "@/app/theme";
import { ClientThemeProvider } from "@/components/layout/ClientThemeProvider";

// Light vs dark is decided by the "dark" class on <html>, set before paint
// by the theme-init blocking script in the root layout. The theme object
// itself references CSS variables that flip per :root vs :root.dark, so
// no per-request server data is needed and pages stay statically renderable.
function CherryThemeProvider({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: Theme;
}) {
  return <ClientThemeProvider theme={theme}>{children}</ClientThemeProvider>;
}

export { CherryThemeProvider };
`;
