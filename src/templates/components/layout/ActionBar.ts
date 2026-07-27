export const actionBarTemplate = `"use client";
import { useContext, useState } from "react";
import styled, { css } from "styled-components";
import { Icon } from "@/components/layout/Icon";
import { mq, Theme } from "@/app/theme";
import {
  interactiveStyles,
  resetButton,
  Textarea,
} from "cherry-styled-components";
import { SectionBarContext } from "@/components/layout/DocsComponents";
import { StyledSmallButton } from "@/components/layout/SharedStyled";

interface ActionBarProps {
  children: React.ReactNode;
  content: string;
  // When set, an RSS button linking to this page's feed renders next to the
  // copy pill.
  rssHref?: string;
}

const StyledActionBar = styled.div<{
  theme: Theme;
  $isChatOpen?: boolean;
}>\`
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  left: 0;
  padding: 12px 0;
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 640px;
  margin: auto;
  transition: all 0.3s ease;

  \${mq("lg")} {
    padding: 12px 0;
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

// StyledSmallButton carries a -6px right margin for edge alignment; inside
// the pill group that would eat into the gap, so it is neutralized here.
const StyledActionBarGroup = styled.div\`
  display: flex;
  gap: 12px;

  & > * {
    margin-right: 0;
  }
\`;

const StyledRssLink = styled(StyledSmallButton)<{ theme: Theme }>\`
  text-decoration: none;
  color: \${({ theme }) => theme.colors.primary};

  & svg.lucide {
    color: \${({ theme }) => theme.colors.primary};
  }
\`;

// Mirrors the geometry and interaction of Cherry's ThemeToggle so the two
// pills look identical side by side: interactiveStyles supplies the border
// highlight + focus/active rings (no scale effect), and the space-between
// layout with 6px padding puts each 16px icon's center exactly where the
// 24px knob's center sits in its resting (left: 2px) and active
// (translateX(26px)) positions.
const StyledToggle = styled.button<{ theme: Theme; $isActive?: boolean }>\`
  \${resetButton}
  \${interactiveStyles}
  width: 56px;
  height: 30px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  position: relative;
  margin: auto 0;
  background: \${({ theme }) => theme.colors.light};
  border-color: \${({ theme }) => theme.colors.grayLight};

  &::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.primaryLight} 20%, transparent)\`};
    transition: all 0.3s ease;
    z-index: 1;
    \${({ $isActive }) =>
      !$isActive &&
      css\`
        transform: translateX(26px);
      \`}
  }

  & svg {
    width: 16px;
    height: 16px;
    object-fit: contain;
    transition: all 0.3s ease;
    position: relative;
    z-index: 2;
  }

  & svg[stroke] {
    stroke: \${({ theme }) => theme.colors.primary};
  }

  &:hover svg[stroke] {
    stroke: \${({ theme }) => theme.colors.accent};
  }
\`;

// The raw-content view renders a full-viewport textarea. That rule is scoped to
// the raw view (\`$raw\`) so it never leaks into textareas rendered inside page
// content - e.g. the API playground's request-body editor, which sits inside
// this same ActionBar in the normal (view) mode.
const StyledContent = styled.div<{
  theme: Theme;
  $hasSectionBar?: boolean;
  $raw?: boolean;
}>\`
  padding-top: 20px;
  transition: all 0.3s ease;

  \${({ $raw, $hasSectionBar }) =>
    $raw &&
    css\`
      & textarea {
        max-width: 640px;
        margin: auto;
        width: 100%;
        height: 100%;
        min-height: calc(100vh - \${$hasSectionBar ? 202 : 160}px);

        \${mq("lg")} {
          min-height: calc(100vh - 159px);
        }
      }
    \`}
\`;

function ActionBar({ children, content, rssHref }: ActionBarProps) {
  const [isView, setIsView] = useState(true);
  const [copied, setCopied] = useState(false);
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
      <StyledActionBar>
        <StyledActionBarGroup>
          <StyledCopyButton onClick={handleCopyContent} $copied={copied}>
            {copied ? (
              <>
                <Icon name="check" size={16} />
                Copied!
              </>
            ) : (
              <>
                <Icon name="copy" size={16} />
                Copy content
              </>
            )}
          </StyledCopyButton>
          {rssHref && (
            <StyledRssLink as="a" href={rssHref} aria-label="RSS feed">
              <Icon name="rss" size={16} />
              RSS
            </StyledRssLink>
          )}
        </StyledActionBarGroup>
        <StyledActionBarContent>
          <StyledToggle
            onClick={() => setIsView(!isView)}
            aria-label="Toggle View"
            $isActive={isView}
          >
            <Icon name="Eye" />
            <Icon name="CodeXml" />
          </StyledToggle>
        </StyledActionBarContent>
      </StyledActionBar>
      {isView && (
        <StyledContent $hasSectionBar={hasSectionBar}>{children}</StyledContent>
      )}
      {!isView && (
        <StyledContent $hasSectionBar={hasSectionBar} $raw>
          <Textarea defaultValue={content} $fullWidth />
        </StyledContent>
      )}
    </>
  );
}

export { ActionBar };
`;
