export const footerTemplate = `"use client";
import { useStrings } from "@/components/useStrings";
import { Space, useChat } from "cherry-styled-components";
import { GitHubLogo } from "@/components/layout/Pictograms";
import linksData from "@/links.json";
import {
  StyledFooter,
  StyledFooterInner,
  StyledFooterFlex,
} from "@/components/layout/Footer.styles";

interface LinkProps {
  title: string;
  url: string;
  icon?: string;
}

const links = linksData as LinkProps[];

function Footer({ hideBranding }: { hideBranding?: boolean }) {
  const { isOpen } = useChat();
  const t = useStrings();

  if (hideBranding) return <Space $xs={80} $lg="none" />;

  return (
    <StyledFooter $isChatOpen={isOpen} $hasLinks={links.length > 0}>
      <StyledFooterInner>
        <StyledFooterFlex>
          <span>
            {t.poweredBy}{" "}
            <a
              href="https://doccupine.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Doccupine
            </a>
          </span>
          <a
            href="https://github.com/doccupine/cli"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.githubLink}
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
