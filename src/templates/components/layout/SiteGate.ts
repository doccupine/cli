export const siteGateComponentTemplate = `"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Lock, MoonStar, Sun } from "lucide-react";
import { useColorMode } from "@/components/useColorMode";
import { Button } from "@/components/layout/Button";
import { Callout } from "@/components/layout/Callout";
import { config } from "@/utils/config";

// The light/dark toggle under the card. Cmd/Ctrl+Shift+L flips the mode
// too. Adapted from cherry-styled-components (MIT).
function GateThemeToggle() {
  const { toggleTheme } = useColorMode();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd on macOS, Ctrl elsewhere. Shift steps out of Cmd/Ctrl+L, which
      // focuses the address bar.
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey || e.altKey) return;
      if (e.key.toLowerCase() !== "l") return;
      e.preventDefault();
      toggleTheme();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  return (
    <button
      type="button"
      className="dcp-gate__theme-toggle"
      aria-label="Toggle Theme"
      onClick={toggleTheme}
    >
      <Sun aria-hidden="true" />
      <MoonStar aria-hidden="true" />
    </button>
  );
}

// The password screen. Styles: app/styles (.dcp-gate).
export function SiteGate({ hideBranding }: { hideBranding?: boolean }) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || status === "loading") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="dcp-gate">
      <div className="dcp-gate__inner">
        <div className="dcp-gate__card">
          <div className="dcp-gate__icon">
            <Lock />
          </div>
          <h1 className="dcp-gate__title">{config.name || "Documentation"}</h1>
          <p className="dcp-gate__lede">This site is password protected.</p>
          <form className="dcp-gate__form" onSubmit={handleSubmit} noValidate>
            <span className="dcp-gate__field">
              <input
                className="dcp-gate__input"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Enter password"
                aria-label="Password"
                // The screen exists to take this one field.
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                value={password}
                aria-invalid={status === "error" || undefined}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
              />
            </span>
            <Button
              type="submit"
              fullWidth
              disabled={status === "loading" || !password}
            >
              {status === "loading" ? "Unlocking..." : "Enter"}
            </Button>
          </form>
          {status === "error" && (
            <div className="dcp-gate__alert">
              <Callout type="danger">
                <p>Incorrect password. Try again.</p>
              </Callout>
            </div>
          )}
        </div>
        <div className="dcp-gate__footer">
          <GateThemeToggle />
          {!hideBranding && (
            <p className="dcp-gate__branding">
              Powered by{" "}
              <a
                href="https://doccupine.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Doccupine
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
`;
