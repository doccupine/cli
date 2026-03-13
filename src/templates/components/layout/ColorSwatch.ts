export const colorSwatchTemplate = `"use client";
import styled from "styled-components";
import { styledText, Theme } from "cherry-styled-components";
import { mq } from "@/app/theme";

const StyledSwatchGroup = styled.div<{ theme: Theme }>\`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: \${({ theme }) => theme.spacing.gridGap.xs};

  \${mq("md")} {
    grid-template-columns: repeat(3, 1fr);
  }
\`;

const StyledSwatch = styled.div<{ theme: Theme }>\`
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  overflow: hidden;
\`;

const StyledColor = styled.div<{
  theme: Theme;
  $color: string;
  $lightText: boolean;
}>\`
  background: \${({ $color }) => $color};
  height: 80px;
  display: flex;
  align-items: flex-end;
  padding: 8px 12px;
  color: \${({ $lightText }) => ($lightText ? "#FFFFFF" : "#000000")};
  font-size: 12px;
  font-family: monospace;
  opacity: 0.8;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
\`;

const StyledLabel = styled.div<{ theme: Theme }>\`
  padding: 10px 12px;
  background: \${({ theme }) => theme.colors.light};
  \${({ theme }) => styledText(theme)};
  font-size: 13px;
  color: \${({ theme }) => theme.colors.grayDark};

  code {
    color: \${({ theme }) => theme.colors.dark};
    font-weight: 600;
    font-size: 13px;
  }
\`;

function luminance(hex: string): number {
  const rgb = hex
    .replace("#", "")
    .match(/.{2}/g)!
    .map((c) => parseInt(c, 16) / 255);

  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

interface ColorSwatchProps {
  token: string;
  value: string;
}

function ColorSwatch({ token, value }: ColorSwatchProps) {
  const useLightText = luminance(value) < 0.4;

  return (
    <StyledSwatch>
      <StyledColor $color={value} $lightText={useLightText}>
        {value}
      </StyledColor>
      <StyledLabel>
        <code className="token">{token}</code>
      </StyledLabel>
    </StyledSwatch>
  );
}

interface ColorSwatchGroupProps {
  children: React.ReactNode;
}

function ColorSwatchGroup({ children }: ColorSwatchGroupProps) {
  return <StyledSwatchGroup>{children}</StyledSwatchGroup>;
}

export { ColorSwatch, ColorSwatchGroup };
`;
