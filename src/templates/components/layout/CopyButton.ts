export const copyButtonTemplate = `"use client";
import { useCallback, useState } from "react";
import styled from "styled-components";
import { resetButton, interactiveStyles } from "cherry-styled-components";
import { Theme } from "@/app/theme";
import { Icon } from "@/components/layout/Icon";

/* Icon-only copy-to-clipboard button. Same look/behaviour as the copy button in
   the code block: interactiveStyles supplies the border highlight on hover plus
   the focus/active rings, and the icon swaps to a check in success green for two
   seconds after a successful copy. Theme tokens swap for dark mode on their own,
   so no :root[data-theme="dark"] override is needed. */
const StyledCopyButton = styled.button<{ theme: Theme; $copied: boolean }>\`
  \${resetButton}
  \${interactiveStyles}
  background: \${({ theme }) => theme.colors.light};
  border-color: \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  & svg.lucide {
    margin: 0;
    color: \${({ theme, $copied }) =>
      $copied ? theme.colors.success : theme.colors.grayDark};
  }
\`;

interface CopyButtonProps {
  text: string;
  size?: number;
  label?: string;
  className?: string;
}

export function CopyButton({
  text,
  size = 12,
  label = "Copy",
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [text]);

  return (
    <StyledCopyButton
      type="button"
      onClick={handleCopy}
      $copied={copied}
      aria-label={copied ? "Copied" : label}
      className={className}
    >
      <Icon name={copied ? "check" : "copy"} size={size} />
    </StyledCopyButton>
  );
}
`;
