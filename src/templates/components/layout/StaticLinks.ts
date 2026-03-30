import { SIDEBAR_WIDTH, CHAT_WIDTH } from "../../app/theme.js";

export const staticLinksTemplate = `"use client";
import styled, { css } from "styled-components";
import { rgba } from "polished";
import { useContext } from "react";
import { ChatContext } from "@/components/Chat";
import { mq, Theme } from "@/app/theme";
import { interactiveStyles } from "@/components/layout/SharedStyled";
import { Icon } from "@/components/layout/Icon";
import linksData from "@/links.json";

interface LinkProps {
  title: string;
  url: string;
  icon?: string;
}

const links = linksData as LinkProps[];

const StyledStaticLinks = styled.div<{ theme: Theme; $isChatOpen: boolean }>\`
  display: flex;
  margin: 0 auto;
  transition: all 0.3s ease;
  padding: 0 20px;
  margin-bottom: 20px;

  \${mq("lg")} {
    margin: 0;
    padding: 0 ${SIDEBAR_WIDTH + 20}px 20px ${SIDEBAR_WIDTH + 20}px;

    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding: 0 ${CHAT_WIDTH + 20}px 20px ${SIDEBAR_WIDTH + 20}px;
      \`}
  }
\`;

const StyledStaticLinksContent = styled.div\`
  max-width: 640px;
  margin: auto 0;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
  margin: 0 auto;
\`;

const StyledLink = styled.a<{ theme: Theme; $hasIcon?: boolean }>\`
  position: relative;
  text-decoration: none;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 1;
  color: \${({ theme }) =>
    theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
  padding: 0;
  display: flex;
  gap: 6px;
  transition: all 0.3s ease;
  font-weight: 600;
  white-space: nowrap;
  min-width: fit-content;
  background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.1)};
  padding: 6px 8px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  \${interactiveStyles};

  \${({ $hasIcon }) =>
    $hasIcon &&
    css\`
      padding-left: 30px;
    \`}

  & * {
    margin: auto 0;
  }

  & svg {
    position: absolute;
    top: 50%;
    left: 8px;
    transform: translateY(-50%);
  }

  &:hover {
    color: \${({ theme }) =>
      theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
  }
\`;

function StaticLinks() {
  const { isOpen } = useContext(ChatContext);

  if (links.length === 0) {
    return null;
  }

  return (
    <>
      <StyledStaticLinks $isChatOpen={isOpen}>
        <StyledStaticLinksContent>
          {links.map((link, index) => (
            <StyledLink
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              $hasIcon={link.icon ? true : false}
            >
              {link.icon && <Icon name={link.icon} size={16} />}
              <span>{link.title}</span>
            </StyledLink>
          ))}
        </StyledStaticLinksContent>
      </StyledStaticLinks>
    </>
  );
}

export { StaticLinks };
`;
