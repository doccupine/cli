export const clientThemeProviderTemplate = `"use client";
import React, { useEffect, useMemo, useState, useContext } from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { Theme } from "@/app/theme";
import { useRouter } from "next/navigation";
import { GlobalStyles } from "@/components/layout/GlobalStyles";

type ThemeOverrideContextValue = {
  theme: Theme;
  setTheme: (t: Theme | null) => void;
};

const ThemeOverrideContext =
  React.createContext<ThemeOverrideContextValue | null>(null);

function useThemeOverride() {
  const ctx = useContext(ThemeOverrideContext);
  if (!ctx) {
    throw new Error("useThemeOverride must be used within ClientThemeProvider");
  }
  return ctx;
}

function ClientThemeProvider({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: Theme;
}) {
  const router = useRouter();
  const [overrideTheme, setOverrideTheme] = useState<Theme | null>(null);
  useEffect(() => {
    try {
      const cookie = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("theme="));
      const cookieValue = cookie ? cookie.split("=")[1] : undefined;
      if (!cookieValue) {
        // Fallback: blocking script should have set this, but handle edge cases
        const prefersDark =
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        const shouldBe = prefersDark ? "dark" : "light";
        document.cookie = \`theme=\${shouldBe};path=/;max-age=31536000;SameSite=Lax\`;
        router.refresh();
      } else if (theme.isDark !== (cookieValue === "dark")) {
        // Server-rendered theme doesn't match cookie (e.g., cookie was set
        // by the blocking script after SSR already committed to light theme)
        router.refresh();
      } else {
        // Theme matches cookie - remove the flash-prevention style injected
        // by the blocking script so styled-components takes over
        const el = document.getElementById("__theme-init");
        if (el) el.remove();
      }
    } catch {}
  }, [router, theme.isDark]);

  const effectiveTheme = useMemo(
    () => overrideTheme ?? theme,
    [overrideTheme, theme],
  );
  return (
    <ThemeOverrideContext.Provider
      value={{ theme: effectiveTheme, setTheme: setOverrideTheme }}
    >
      <StyledThemeProvider theme={effectiveTheme}>
        <GlobalStyles />
        {children}
      </StyledThemeProvider>
    </ThemeOverrideContext.Provider>
  );
}

export { ClientThemeProvider, useThemeOverride };
`;
