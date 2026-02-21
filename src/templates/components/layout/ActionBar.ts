import { SIDEBAR_WIDTH } from "../../app/theme.js";

export const actionBarTemplate = `"use client";
import { useContext, useState } from "react";
import styled, { css } from "styled-components";
import { Icon } from "@/components/layout/Icon";
import { mq, Theme } from "@/app/theme";
import { rgba } from "polished";
import { resetButton, Textarea } from "cherry-styled-components";
import { ChatContext } from "@/components/Chat";
import { SectionBarContext } from "@/components/layout/DocsComponents";
import { StyledSmallButton } from "@/components/layout/SharedStyled";

interface ActionBarProps {
  children: React.ReactNode;
  content: string;
}

const StyledActionBar = styled.div<{
  theme: Theme;
  $isChatOpen?: boolean;
}>\`
  position: absolute;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  left: 0;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  width: 100%;
  transition: all 0.3s ease;

  \${mq("lg")} {
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100vw - ${SIDEBAR_WIDTH * 2}px);
    width: 100%;
    padding: 12px;
    margin: 0;

    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding-right: 152px;
      \`}
  }
\`;

const StyledActionBarContent = styled.div\`
  margin: auto 0;
\`;

const StyledCopyButton = styled(StyledSmallButton)<{
  theme: Theme;
  $copied: boolean;
}>\`
  border: solid 1px
    \${({ theme, $copied }) =>
      $copied ? theme.colors.success : theme.colors.grayLight};
  color: \${({ theme, $copied }) =>
    $copied ? theme.colors.success : theme.colors.primary};

  & svg.lucide {
    color: \${({ theme, $copied }) =>
      $copied ? theme.colors.success : theme.colors.primary};
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

  &:hover {
    transform: scale(1.05);
    color: \${({ theme }) =>
      theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};

    & svg[stroke] {
      stroke: \${({ theme }) =>
        theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
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
  $hasSectionBar?: boolean;
}>\`
  padding-top: 77px;
  transition: all 0.3s ease;

  & textarea {
    max-width: 640px;
    margin: auto;
    width: 100%;
    height: 100%;
    min-height: calc(
      100vh - \${({ $hasSectionBar }) => ($hasSectionBar ? 202 : 160)}px
    );

    \${mq("lg")} {
      min-height: calc(100vh - 159px);
    }
  }
\`;

function ActionBar({ children, content }: ActionBarProps) {
  const [isView, setIsView] = useState(true);
  const [copied, setCopied] = useState(false);
  const { isOpen, isChatActive } = useContext(ChatContext);
  const hasSectionBar = useContext(SectionBarContext);

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
              Copied!
            </>
          ) : (
            <>
              <Icon name="copy" size={16} />
              Copy Content
            </>
          )}
        </StyledCopyButton>
        <StyledActionBarContent>
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
          $hasSectionBar={hasSectionBar}
        >
          {children}
        </StyledContent>
      )}
      {!isView && (
        <StyledContent
          $isChatActive={isChatActive}
          $isChatOpen={isOpen}
          $hasSectionBar={hasSectionBar}
        >
          <Textarea defaultValue={content} $fullWidth />
        </StyledContent>
      )}
    </>
  );
}

export { ActionBar };
`;
