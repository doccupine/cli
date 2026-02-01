export const staticLinksTemplate = `"use client";
import { useContext } from "react";
import styled, { css } from "styled-components";
import { mq, Theme } from "@/app/theme";
import { ChatContext } from "@/components/Chat";
import linksData from "@/links.json";

interface LinkProps {
  title: string;
  url: string;
}

const links = linksData as LinkProps[];

const StyledStaticLinks = styled.div<{ theme: Theme; $isChatOpen?: boolean }>\`
  position: sticky;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  top: 70px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  width: 100%;
  z-index: 999;
  transition: all 0.3s ease;
  margin: auto;
  height: 73px;
  background: \${({ theme }) => theme.colors.light};
  overflow-x: auto;

  \${mq("lg")} {
    top: 0;
    max-width: calc(100vw - 640px);
    width: 100%;
    margin: auto;

    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding: 20px 120px 20px 20px;
      \`}
  }
\`;

const StyledStaticLinksContent = styled.div\`
  margin: auto 0;
  display: flex;
  gap: 16px;
  flex-wrap: nowrap;
\`;

const StyledLink = styled.a<{ theme: Theme }>\`
  text-decoration: none;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 1;
  color: \${({ theme }) =>
    theme.isDark ? theme.colors.primary : theme.colors.primary};
  padding: 0;
  display: flex;
  transition: all 0.3s ease;
  font-weight: 600;
  white-space: nowrap;
  min-width: fit-content;

  &:last-of-type {
    padding-right: 20px;
  }

  @media (hover: hover) {
    &:hover {
      color: \${({ theme }) =>
        theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
    }
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
            >
              {link.title}
            </StyledLink>
          ))}
        </StyledStaticLinksContent>
      </StyledStaticLinks>
    </>
  );
}

export { StaticLinks };
`;
