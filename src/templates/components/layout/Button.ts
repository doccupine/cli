export const buttonTemplate = `"use client";
import Link from "next/link";
import styled from "styled-components";
import {
  theme as localTheme,
  ButtonProps,
  buttonStyles,
} from "cherry-styled-components";
import { Icon } from "@/components/layout/Icon";

interface LinkButtonProps extends ButtonProps {
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
  variant?: "primary" | "secondary" | "tertiary";
  size?: "default" | "big";
  outline?: boolean;
  fullWidth?: boolean;
  icon?: string;
  iconPosition?: "left" | "right";
  theme?: typeof localTheme;
}

// Cherry's buttonStyles picks filled-button text via \`isDark ? colors.dark : colors.light\`.
// Our theme's isDark is a stub (false) because mode switching lives in CSS vars, so
// the fallback resolves to --color-light (black in dark mode). Re-pin to \`surface\`,
// which resolves to white in both modes, for the filled, non-disabled case.
const StyledLinkButton = styled(Link)<LinkButtonProps>\`
  \${({ theme, $variant, $size, $outline, $fullWidth, $error, disabled }) =>
    buttonStyles(theme, $variant, $size, $outline, $fullWidth, $error, disabled)}

  \${({ theme, $outline, disabled }) =>
    !disabled && !$outline && \`color: \${theme.colors.surface};\`}

  & p {
    color: inherit !important;
  }

  & svg.lucide {
    margin: auto 0;
    min-width: min-content;
    color: inherit;
  }
\`;

const ButtonBase = styled.button<ButtonProps>\`
  \${({ theme, $variant, $size, $outline, $fullWidth, $error, disabled }) =>
    buttonStyles(theme, $variant, $size, $outline, $fullWidth, $error, disabled)}

  \${({ theme, $outline, disabled }) =>
    !disabled && !$outline && \`color: \${theme.colors.surface};\`}

  & p {
    color: inherit !important;
  }

  & svg.lucide {
    margin: auto 0;
    min-width: min-content;
    color: inherit;
  }
\`;

function Button({
  variant = "primary",
  size,
  outline,
  fullWidth,
  icon,
  iconPosition = "left",
  theme: _theme = localTheme,
  href,
  target,
  rel,
  ...props
}: LinkButtonProps) {
  const isExternal = typeof href === "string" && /^(https?:)?\\/\\//i.test(href);
  const resolvedTarget = target ?? (isExternal ? "_blank" : undefined);
  const resolvedRel =
    rel ?? (resolvedTarget === "_blank" ? "noopener noreferrer" : undefined);
  return href ? (
    <div>
      <StyledLinkButton
        {...props}
        href={href}
        target={resolvedTarget}
        rel={resolvedRel}
        $variant={variant}
        $size={size}
        $outline={outline}
        $fullWidth={fullWidth}
      >
        {iconPosition === "left" && icon && <Icon name={icon} size={16} />}
        {props.children}
        {iconPosition === "right" && icon && <Icon name={icon} size={16} />}
      </StyledLinkButton>
    </div>
  ) : (
    <div>
      <ButtonBase
        {...props}
        $variant={variant}
        $size={size}
        $outline={outline}
        $fullWidth={fullWidth}
      >
        {iconPosition === "left" && icon && <Icon name={icon} size={16} />}
        {props.children}
        {iconPosition === "right" && icon && <Icon name={icon} size={16} />}
      </ButtonBase>
    </div>
  );
}

export { Button };
`;
