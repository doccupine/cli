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
        const prefersDark =
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        const shouldBe = prefersDark ? "dark" : "light";
        fetch("/api/theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: shouldBe }),
        })
          .then(() => {
            router.refresh();
          })
          .catch(() => {
            console.error("Error setting theme");
          });
      }
    } catch {}
  }, [router]);

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
