export const clientThemeProviderTemplate = `"use client";
import React from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { Theme } from "cherry-styled-components/src/lib";
import { GlobalStyles } from "@/components/layout/GlobalStyles";

function ClientThemeProvider({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: Theme;
}) {
  const GlobalStylesComponent = GlobalStyles(theme);
  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStylesComponent />
      {children}
    </StyledThemeProvider>
  );
}

export { ClientThemeProvider };`;
