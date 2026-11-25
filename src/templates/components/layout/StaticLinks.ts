export const staticLinksTemplate = `"use client";
import { useChat } from "@/components/chat/ChatProvider";
import { Icon } from "@/components/layout/Icon";
import linksData from "@/links.json";

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
      <div className="dcp-links" data-chat-open={isOpen || undefined}>
        <div className="dcp-links__content">
          {links.map((link, index) => (
            <a
              key={index}
              className="dcp-links__link"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              data-has-icon={link.icon ? true : undefined}
            >
              {link.icon && <Icon name={link.icon} size={16} />}
              <span>{link.title}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

export { StaticLinks };
`;
