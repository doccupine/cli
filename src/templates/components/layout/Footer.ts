import { SIDEBAR_WIDTH, CHAT_WIDTH } from "../../app/theme.js";

export const footerTemplate = `"use client";
import { useContext } from "react";
import styled, { css } from "styled-components";
import { Space, styledSmall } from "cherry-styled-components";
import { ChatContext } from "@/components/Chat";
import { mq, Theme } from "@/app/theme";
import { GitHubLogo } from "@/components/layout/Pictograms";
import linksData from "@/links.json";

interface LinkProps {
  title: string;
  url: string;
  icon?: string;
}

const links = linksData as LinkProps[];

const StyledFooter = styled.footer<{
  theme: Theme;
  $isChatOpen?: boolean;
  $hasLinks?: boolean;
}>\`
  padding: 0 20px;
  transition: all 0.3s ease;

  \${({ $hasLinks }) =>
    $hasLinks &&
    css\`
      margin-top: 20px;
    \`}

  \${mq("lg")} {
    margin: 0;
    padding: 0 ${SIDEBAR_WIDTH + 20}px 0 ${SIDEBAR_WIDTH + 20}px;

    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding: 0 ${CHAT_WIDTH + 20}px 0 ${SIDEBAR_WIDTH + 20}px;
      \`}
  }
\`;

const StyledFooterInner = styled.div<{ theme: Theme }>\`
  border-top: solid 1px \${({ theme }) => theme.colors.grayLight};
  max-width: 640px;
  margin: 0 auto;
  padding: 28px 0;
  color: \${({ theme }) => theme.colors.grayDark};
  \${({ theme }) => styledSmall(theme)};

  \${mq("lg")} {
    padding: 20px 0;
  }

  & a {
    font-weight: 700;
    color: \${({ theme }) => theme.colors.accent};
    text-decoration: none;
    transition: all 0.3s ease;
    display: inline-flex;

    &:hover {
      color: \${({ theme }) => theme.colors.primaryDark};
    }

    & svg {
      width: 18px;
      height: 18px;
    }
  }
\`;

const StyledFooterFlex = styled.div\`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 20px;

  \${mq("lg")} {
    justify-content: space-between;
  }
\`;

function Footer({ hideBranding }: { hideBranding?: boolean }) {
  const { isOpen } = useContext(ChatContext);

  if (hideBranding) return <Space $xs={80} $lg="none" />;

  return (
    <StyledFooter $isChatOpen={isOpen} $hasLinks={links.length > 0}>
      <StyledFooterInner>
        <StyledFooterFlex>
          <span>
            Powered by <a href="https://doccupine.com">Doccupine</a>
          </span>
          <a
            href="https://github.com/doccupine/cli"
            target="_blank"
            aria-label="Doccupine on GitHub"
          >
            <GitHubLogo />
          </a>
        </StyledFooterFlex>
      </StyledFooterInner>
    </StyledFooter>
  );
}

export { Footer };
`;
