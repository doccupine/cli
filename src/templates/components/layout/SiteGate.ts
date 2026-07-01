export const siteGateComponentTemplate = `"use client";
import { useState, type FormEvent } from "react";
import styled from "styled-components";
import { Lock } from "lucide-react";
import { Theme } from "@/app/theme";
import { config } from "@/utils/config";

const StyledWrapper = styled.div<{ theme: Theme }>\`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: \${({ theme }) => theme.colors.surface};
\`;

const StyledCard = styled.div<{ theme: Theme }>\`
  width: 100%;
  max-width: 380px;
  padding: 40px 32px;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  box-shadow: \${({ theme }) => theme.shadows.lg};
  text-align: center;
\`;

const StyledIcon = styled.div<{ theme: Theme }>\`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 20px;
  border-radius: 50%;
  color: \${({ theme }) => theme.colors.accent};
  background: \${({ theme }) => theme.colors.grayLight};

  & svg {
    width: 22px;
    height: 22px;
  }
\`;

const StyledTitle = styled.h1<{ theme: Theme }>\`
  margin: 0 0 8px;
  font-size: 22px;
  color: \${({ theme }) => theme.colors.accent};
\`;

const StyledLede = styled.p<{ theme: Theme }>\`
  margin: 0 0 24px;
  font-size: 15px;
  color: \${({ theme }) => theme.colors.grayDark};
\`;

const StyledForm = styled.form\`
  display: flex;
  flex-direction: column;
  gap: 12px;
\`;

const StyledInput = styled.input<{ theme: Theme; $error: boolean }>\`
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  color: \${({ theme }) => theme.colors.accent};
  background: \${({ theme }) => theme.colors.surface};
  border: solid 1px
    \${({ theme, $error }) =>
      $error ? theme.colors.error : theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: \${({ theme, $error }) =>
      $error ? theme.colors.error : theme.colors.accent};
  }
\`;

const StyledButton = styled.button<{ theme: Theme }>\`
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  font-weight: 700;
  color: \${({ theme }) => theme.colors.surface};
  background: \${({ theme }) => theme.colors.accent};
  border: none;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
\`;

const StyledError = styled.p<{ theme: Theme }>\`
  margin: 4px 0 0;
  font-size: 13px;
  color: \${({ theme }) => theme.colors.error};
\`;

export function SiteGate() {
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
      <StyledCard>
        <StyledIcon>
          <Lock />
        </StyledIcon>
        <StyledTitle>{config.name || "Documentation"}</StyledTitle>
        <StyledLede>This site is password protected.</StyledLede>
        <StyledForm onSubmit={handleSubmit} noValidate>
          <StyledInput
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter password"
            aria-label="Password"
            autoFocus
            value={password}
            $error={status === "error"}
            onChange={(e) => {
              setPassword(e.target.value);
              if (status === "error") setStatus("idle");
            }}
          />
          <StyledButton
            type="submit"
            disabled={status === "loading" || !password}
          >
            {status === "loading" ? "Unlocking..." : "Enter"}
          </StyledButton>
        </StyledForm>
        {status === "error" && (
          <StyledError>Incorrect password. Try again.</StyledError>
        )}
      </StyledCard>
    </StyledWrapper>
  );
}
`;
