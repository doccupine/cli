export const staticLinksTemplate = `"use client";
import { useChat } from "cherry-styled-components";
import { Icon } from "@/components/layout/Icon";
import linksData from "@/links.json";
import {
  StyledStaticLinks,
  StyledStaticLinksContent,
  StyledLink,
} from "@/components/layout/StaticLinks.styles";

interface LinkProps {
  title: string;
  url: string;
  icon?: string;
}

const links = linksData as LinkProps[];

function StaticLinks() {
  const { isOpen } = useChat();

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
