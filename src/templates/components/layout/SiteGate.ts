export const siteGateComponentTemplate = `"use client";
import { useState, type FormEvent } from "react";
import styled from "styled-components";
import { Input, ThemeToggle } from "cherry-styled-components";
import { Lock } from "lucide-react";
import { Theme } from "@/app/theme";
import { Button } from "@/components/layout/Button";
import { Callout } from "@/components/layout/Callout";
import { config } from "@/utils/config";

const StyledWrapper = styled.div<{ theme: Theme }>\`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: \${({ theme }) => theme.colors.light};
\`;

const StyledInner = styled.div\`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 380px;
\`;

const StyledFooter = styled.div\`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
\`;

const StyledBranding = styled.p<{ theme: Theme }>\`
  margin: 0;
  font-size: 14px;
  color: \${({ theme }) => theme.colors.grayDark};

  & a {
    color: \${({ theme }) => theme.colors.accent};
    font-weight: 700;
    text-decoration: none;
    transition: all 0.3s ease;
  }

  & a:hover {
    color: \${({ theme }) => theme.colors.primary};
  }
\`;

const StyledCard = styled.div<{ theme: Theme }>\`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  padding: 40px 32px;
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  box-shadow: \${({ theme }) => theme.shadows.sm};
  text-align: center;
\`;

const StyledIcon = styled.div<{ theme: Theme }>\`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: \${({ theme }) => theme.colors.accent};
  background: \${({ theme }) => theme.colors.grayLight};

  & svg {
    width: 22px;
    height: 22px;
  }
\`;

const StyledTitle = styled.h1<{ theme: Theme }>\`
  margin: 0;
  font-size: 22px;
  color: \${({ theme }) => theme.colors.accent};
\`;

const StyledLede = styled.p<{ theme: Theme }>\`
  margin: 0;
  font-size: 15px;
  color: \${({ theme }) => theme.colors.grayDark};
\`;

const StyledForm = styled.form\`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
\`;

const StyledAlert = styled.div\`
  width: 100%;
  text-align: left;
\`;

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
    <StyledWrapper>
      <StyledInner>
        <StyledCard>
          <StyledIcon>
            <Lock />
          </StyledIcon>
          <StyledTitle>{config.name || "Documentation"}</StyledTitle>
          <StyledLede>This site is password protected.</StyledLede>
          <StyledForm onSubmit={handleSubmit} noValidate>
            <Input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter password"
              aria-label="Password"
              autoFocus
              value={password}
              $error={status === "error"}
              $fullWidth
              onChange={(e) => {
                setPassword(e.target.value);
                if (status === "error") setStatus("idle");
              }}
            />
            <Button
              type="submit"
              fullWidth
              disabled={status === "loading" || !password}
            >
              {status === "loading" ? "Unlocking..." : "Enter"}
            </Button>
          </StyledForm>
          {status === "error" && (
            <StyledAlert>
              <Callout type="danger">
                <p>Incorrect password. Try again.</p>
              </Callout>
            </StyledAlert>
          )}
        </StyledCard>
        <StyledFooter>
          <ThemeToggle />
          {!hideBranding && (
            <StyledBranding>
              Powered by{" "}
              <a
                href="https://doccupine.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Doccupine
              </a>
            </StyledBranding>
          )}
        </StyledFooter>
      </StyledInner>
    </StyledWrapper>
  );
}
`;
