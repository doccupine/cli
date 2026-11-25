export const footerTemplate = `"use client";
import { useStrings } from "@/components/useStrings";
import { useChat } from "@/components/chat/ChatProvider";
import { GitHubLogo } from "@/components/layout/Pictograms";
import linksData from "@/links.json";

interface LinkProps {
  title: string;
  url: string;
  icon?: string;
}

const links = linksData as LinkProps[];

function Footer({ hideBranding }: { hideBranding?: boolean }) {
  const { isOpen } = useChat();
  const t = useStrings();

  if (hideBranding) return <span className="dcp-footer-space" />;

  return (
    <footer
      className="dcp-footer"
      data-chat-open={isOpen || undefined}
      data-has-links={links.length > 0 || undefined}
    >
      <div className="dcp-footer__inner">
        <div className="dcp-footer__row">
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
        </div>
      </div>
    </footer>
  );
}

export { Footer };
`;
