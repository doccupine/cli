export const actionBarTemplate = `"use client";
import { useState } from "react";
import styled, { css } from "styled-components";
import { Icon } from "@/components/layout/Icon";
import { mq, Theme } from "@/app/theme";
import { rgba } from "polished";
import { resetButton, Textarea } from "cherry-styled-components/src/lib";

interface ActionBarProps {
  children: React.ReactNode;
  content: string;
}

const StyledActionBar = styled.div<{ theme: Theme }>\`
  position: absolute;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  left: 0;
  padding: 70px 0 20px 0;
  display: flex;
  justify-content: space-between;
  width: 100%;

  \${mq("lg")} {
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100vw - 640px);
    width: 100%;
    padding: 0 20px 20px 20px;
    margin: 0;
  }
\`;

const StyledActionBarContent = styled.div\`
  margin: auto 0;
\`;

const StyledCopyButton = styled.button<{ theme: Theme; $copied: boolean }>\`
  background: transparent;
  border: solid 1px
    \${({ theme, $copied }) =>
      $copied ? theme.colors.success : theme.colors.grayLight};
  color: \${({ theme, $copied }) =>
    $copied ? theme.colors.success : theme.colors.primary};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  padding: 6px 8px;
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

const StyledToggle = styled.button<{ theme: Theme; $isActive?: boolean }>\`
  \${resetButton}
  width: 56px;
  height: 32px;
  border-radius: 30px;
  display: flex;
  position: relative;
  margin: auto 0;
  transform: scale(1);
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.2)};
    transition: all 0.3s ease;
    z-index: 1;
    \${({ $isActive }) =>
      !$isActive &&
      css\`
        transform: translateX(24px);
      \`}
  }

  & svg {
    width: 16px;
    height: 16px;
    object-fit: contain;
    margin: auto;
    transition: all 0.3s ease;
    position: relative;
    z-index: 2;
  }

  & .lucide-eye {
    transform: translateX(1px);
  }

  & .lucide-code-xml {
    transform: translateX(-1px);
  }

  & svg[stroke] {
    stroke: \${({ theme }) => theme.colors.primary};
  }

  @media (hover: hover) {
    &:hover {
      transform: scale(1.05);
      color: \${({ theme }) =>
        theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
      Toggle & svg[stroke] {
        stroke: \${({ theme }) =>
          theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
      }
    }
  }

  &:active {
    transform: scale(0.97);
  }
\`;

const StyledContent = styled.div\`
  padding-top: 140px;

  \${mq("lg")} {
    padding-top: 70px;
  }

  & textarea {
    width: 100%;
    height: 100%;
    min-height: calc(100vh - 180px);

    \${mq("lg")} {
      min-height: calc(100vh - 110px);
    }
  }
\`;

function ActionBar({ children, content }: ActionBarProps) {
  const [isView, setIsView] = useState(true);
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
    <>
      <StyledActionBar>
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
        <StyledActionBarContent>
          {" "}
          <StyledToggle
            onClick={() => setIsView(!isView)}
            aria-label="Toggle Theme"
            $isActive={isView}
          >
            <Icon name="Eye" />
            <Icon name="CodeXml" />
          </StyledToggle>
        </StyledActionBarContent>
      </StyledActionBar>
      {isView && <StyledContent>{children}</StyledContent>}
      {!isView && (
        <StyledContent>
          <Textarea defaultValue={content} $fullWidth />
        </StyledContent>
      )}
    </>
  );
}

export { ActionBar };`;
