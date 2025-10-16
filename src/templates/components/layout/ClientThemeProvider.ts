export const clientThemeProviderTemplate = `"use client";
import React, { useEffect } from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { Theme } from "cherry-styled-components/src/lib";
import { useRouter } from "next/navigation";
import { GlobalStyles } from "@/components/layout/GlobalStyles";

function ClientThemeProvider({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: Theme;
}) {
  const router = useRouter();
  const GlobalStylesComponent = GlobalStyles(theme);
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
  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStylesComponent />
      {children}
    </StyledThemeProvider>
  );
}

export { ClientThemeProvider };`;
