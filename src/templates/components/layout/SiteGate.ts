export const siteGateComponentTemplate = `"use client";
import { useState, type FormEvent } from "react";
import styled from "styled-components";
import { Input } from "cherry-styled-components";
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

const StyledCard = styled.div<{ theme: Theme }>\`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 380px;
  padding: 40px 32px;
  background: \${({ theme }) => theme.colors.light};
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
    </StyledWrapper>
  );
}
`;
