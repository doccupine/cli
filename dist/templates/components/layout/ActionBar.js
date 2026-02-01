export const actionBarTemplate = `"use client";
import { useContext, useState } from "react";
import styled, { css } from "styled-components";
import { Icon } from "@/components/layout/Icon";
import { mq, Theme } from "@/app/theme";
import { rgba } from "polished";
import { resetButton, Textarea } from "cherry-styled-components/src/lib";
import { ChatContext } from "@/components/Chat";
import links from "@/links.json";

interface ActionBarProps {
  children: React.ReactNode;
  content: string;
}

const StyledActionBar = styled.div<{ theme: Theme; $isChatOpen?: boolean }>\`
  position: absolute;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  left: 0;
  padding: 70px 20px 20px 20px;
  display: flex;
  justify-content: space-between;
  width: 100%;
  transition: all 0.3s ease;

  \${mq("lg")} {
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100vw - 640px);
    width: 100%;
    padding: 0 20px 20px 20px;
    margin: 0;

    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding: 0 120px 20px 20px;
      \`}
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
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
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

const StyledContent = styled.div<{
  theme: Theme;
  $isChatActive?: boolean;
  $isChatOpen?: boolean;
  $hasLinks?: boolean;
}>\`
  padding-top: 140px;
  transition: all 0.3s ease;

  \${mq("lg")} {
    \${({ $isChatActive }) =>
      $isChatActive ? \`padding-top: 140px;\` : \`padding-top: 70px;\`}

    \${({ $isChatOpen, $isChatActive }) =>
      $isChatOpen &&
      $isChatActive &&
      css\`
        padding-top: 70px;
      \`}
  }

  & textarea {
    max-width: 640px;
    margin: auto;
    width: 100%;
    height: 100%;
    min-height: calc(100vh - 180px);

    \${({ $hasLinks }) =>
      $hasLinks &&
      css\`
        min-height: calc(100vh - 253px);
      \`}

    \${({ $isChatOpen, $isChatActive, $hasLinks }) =>
      !$isChatOpen &&
      $isChatActive &&
      css\`
        min-height: calc(100vh - 250px);

        \${$hasLinks &&
        css\`
          min-height: calc(100vh - 323px);
        \`}
      \`}

    \${mq("lg")} {
      min-height: calc(100vh - 110px);

      \${({ $hasLinks }) =>
        $hasLinks &&
        css\`
          min-height: calc(100vh - 183px);
        \`}

      \${({ $isChatOpen, $isChatActive, $hasLinks }) =>
        !$isChatOpen &&
        $isChatActive &&
        css\`
          min-height: calc(100vh - 180px);

          \${$hasLinks &&
          css\`
            min-height: calc(100vh - 253px);
          \`}
        \`}
    }
  }
\`;

function ActionBar({ children, content }: ActionBarProps) {
  const [isView, setIsView] = useState(true);
  const [copied, setCopied] = useState(false);
  const { isOpen, isChatActive } = useContext(ChatContext);

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
      <StyledActionBar $isChatOpen={isOpen}>
        <StyledCopyButton onClick={handleCopyContent} $copied={copied}>
          {copied ? (
            <>
              <Icon name="check" size={16} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Icon name="copy" size={16} />
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
      {isView && (
        <StyledContent
          $isChatActive={isChatActive}
          $isChatOpen={isOpen}
          $hasLinks={links.length > 0}
        >
          {children}
        </StyledContent>
      )}
      {!isView && (
        <StyledContent
          $isChatActive={isChatActive}
          $isChatOpen={isOpen}
          $hasLinks={links.length > 0}
        >
          <Textarea defaultValue={content} $fullWidth />
        </StyledContent>
      )}
    </>
  );
}

export { ActionBar };
`;
