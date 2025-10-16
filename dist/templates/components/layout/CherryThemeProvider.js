export const cherryThemeProviderTemplate = `import React from "react";
import { cookies } from "next/headers";
import { Theme } from "@/app/theme";
import { ClientThemeProvider } from "@/components/layout/ClientThemeProvider";

async function CherryThemeProvider({
  children,
  theme,
  themeDark,
}: {
  children: React.ReactNode;
  theme: Theme;
  themeDark?: Theme;
}) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("theme")?.value;
  const useDark = cookieTheme === "dark";
  const currentTheme = useDark && themeDark ? themeDark : theme;

  return (
    <ClientThemeProvider theme={currentTheme}>{children}</ClientThemeProvider>
  );
}

export { CherryThemeProvider };`;
