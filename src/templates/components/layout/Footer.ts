export const footerTemplate = `"use client";
import { useContext } from "react";
import styled, { css } from "styled-components";
import { styledSmall } from "cherry-styled-components";
import { ChatContext } from "@/components/Chat";
import { mq, Theme } from "@/app/theme";
import { GitHubLogo } from "@/components/layout/Pictograms";

const StyledFooter = styled.footer<{ theme: Theme; $isChatOpen?: boolean }>\`
  padding: 20px;
  transition: all 0.3s ease;

  \${mq("lg")} {
    padding: 0 340px 0 340px;
    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding: 0 440px 0 340px;
      \`}
  }
\`;

const StyledFooterInner = styled.div<{ theme: Theme }>\`
  border-top: solid 1px \${({ theme }) => theme.colors.grayLight};
  max-width: 640px;
  margin: 0 auto;
  padding: 33px 0 90px 0;
  color: \${({ theme }) => theme.colors.gray};
  \${({ theme }) => styledSmall(theme)};

  \${mq("lg")} {
    padding: 32px 0;
  }

  & a {
    font-weight: 700;
    color: \${({ theme }) => theme.colors.primary};
    text-decoration: none;
    transition: all 0.3s ease;

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
  justify-content: space-between;
  align-items: center;
\`;

function Footer() {
  const { isOpen } = useContext(ChatContext);
  return (
    <StyledFooter $isChatOpen={isOpen}>
      <StyledFooterInner>
        <StyledFooterFlex>
          <span>
            Powered by <a href="https://doccupine.com">Doccupine</a>
          </span>
          <a href="https://github.com/doccupine/" target="_blank">
            <GitHubLogo />
          </a>
        </StyledFooterFlex>
      </StyledFooterInner>
    </StyledFooter>
  );
}

export { Footer };
`;
