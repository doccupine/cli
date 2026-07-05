export const notFoundComponentTemplate = `"use client";
import styled from "styled-components";
import { Compass } from "lucide-react";
import { Theme } from "@/app/theme";
import { Button } from "@/components/layout/Button";

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
  max-width: 420px;
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
  font-size: 24px;
  font-weight: 700;
  color: \${({ theme }) => theme.colors.accent};
\`;

const StyledText = styled.p<{ theme: Theme }>\`
  margin: 0;
  font-size: 15px;
  color: \${({ theme }) => theme.colors.grayDark};
\`;

export function NotFound() {
  return (
    <StyledWrapper>
      <StyledCard>
        <StyledIcon>
          <Compass />
        </StyledIcon>
        <StyledTitle>Error 404</StyledTitle>
        <StyledText>This page could not be found.</StyledText>
        <Button href="/" icon="house">
          Home
        </Button>
      </StyledCard>
    </StyledWrapper>
  );
}
`;
