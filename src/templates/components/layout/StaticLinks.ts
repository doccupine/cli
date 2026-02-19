export const staticLinksTemplate = `"use client";
import styled, { css } from "styled-components";
import { rgba } from "polished";
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

const StyledStaticLinks = styled.div<{ theme: Theme }>\`
  padding: 20px;
  display: flex;
  max-width: 640px;
  margin: 0 auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  \${mq("lg")} {
    padding: 20px 0;
  }
\`;

const StyledStaticLinksContent = styled.div\`
  margin: auto 0;
  display: flex;
  gap: 16px;
  flex-wrap: nowrap;
\`;

const StyledLink = styled.a<{ theme: Theme; $hasIcon?: boolean }>\`
  position: relative;
  text-decoration: none;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 1;
  color: \${({ theme }) =>
    theme.isDark ? theme.colors.primary : theme.colors.primary};
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

const StyledEmpty = styled.div\`
  width: 1px;
  max-width: 1px;
  min-width: 1px;
  overflow: hidden;
  text-indent: -9999px;
\`;

function StaticLinks() {
  if (links.length === 0) {
    return null;
  }

  return (
    <>
      <StyledStaticLinks id="static-links">
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
          <StyledEmpty />
        </StyledStaticLinksContent>
      </StyledStaticLinks>
    </>
  );
}

export { StaticLinks };
`;
