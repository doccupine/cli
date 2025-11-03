export const copyButtonTemplate = `"use client";
import { useState } from "react";
import styled from "styled-components";
import { Icon } from "@/components/layout/Icon";
import { mq, Theme } from "@/app/theme";

interface CopyButtonProps {
  content: string;
}

const StyledCopyWrapper = styled.div\`
  position: relative;
  padding-top: 70px;

  \${mq("lg")} {
    padding-top: 80px;
  }
\`;

const StyledCopyButton = styled.button<{ theme: Theme; $copied: boolean }>\`
  background: transparent;
  border: solid 1px
    \${({ theme, $copied }) =>
      $copied ? theme.colors.success : theme.colors.grayLight};
  color: \${({ theme, $copied }) =>
    $copied ? theme.colors.success : theme.colors.primary};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  padding: 4px 8px;
  font-size: 12px;
  font-family: \${({ theme }) => theme.fonts.mono};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: -6px;

  & svg.lucide {
    color: \${({ theme, $copied }) =>
      $copied ? theme.colors.success : theme.colors.primary};
  }

  &:hover {
    border-color: \${({ theme, $copied }) =>
      $copied ? theme.colors.success : theme.colors.primary};
  }

  &:active {
    transform: scale(0.95);
  }
\`;

function CopyButton({ content }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <StyledCopyWrapper>
      <StyledCopyButton onClick={handleCopyContent} $copied={copied}>
        {copied ? (
          <>
            <Icon name="check" size={12} />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Icon name="copy" size={12} />
            <span>Copy Content</span>
          </>
        )}
      </StyledCopyButton>
    </StyledCopyWrapper>
  );
}

export { CopyButton };`;
