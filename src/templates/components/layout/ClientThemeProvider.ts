export const clientThemeProviderTemplate = `"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { Theme } from "@/app/theme";
import { GlobalStyles } from "@/components/layout/GlobalStyles";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  /** The styled-components theme object — same reference in both modes;
      the values it points to are CSS variables that flip per active class. */
  theme: Theme;
  /** Active mode, derived from the "dark" class on <html>. */
  mode: ThemeMode;
  /** Update the active mode: flips the class and persists the cookie. */
  setMode: (m: ThemeMode) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function useThemeOverride() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeOverride must be used within ClientThemeProvider");
  }
  return ctx;
}

function readMode(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function ClientThemeProvider({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: Theme;
}) {
  // Mode lives in React state so consumers (e.g. ThemeToggle) re-render when
  // the user toggles. The visual swap itself is driven entirely by the
  // "dark" class on <html> + CSS variables — React doesn't drive paint.
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    // Sync with the class set by the theme-init blocking script. Also
    // backfill the cookie if the script didn't get to write one (rare).
    setModeState(readMode());
    try {
      const has = document.cookie
        .split(";")
        .some((c) => c.trim().startsWith("theme="));
      if (!has) {
        const m = readMode();
        document.cookie = \`theme=\${m};path=/;max-age=31536000;SameSite=Lax\`;
      }
    } catch {}
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.style.colorScheme = next;
      try {
        document.cookie = \`theme=\${next};path=/;max-age=31536000;SameSite=Lax\`;
      } catch {}
    }
    setModeState(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      <StyledThemeProvider theme={theme}>
        <GlobalStyles />
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
}

export { ClientThemeProvider, useThemeOverride };
`;
