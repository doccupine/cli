export const promptTemplate = `import React from "react";
import { Icon } from "@/components/layout/Icon";
import { CopyButton } from "@/components/layout/CopyButton";

type PromptAction = "copy" | "cursor";

const CURSOR_DEEPLINK = "cursor://anysphere.cursor-deeplink/prompt?text=";

// The prompt body arrives as rendered MDX elements, but the copy and Cursor
// actions need plain text. Paragraphs and lists become separate lines and
// list items keep a "- " marker so the copied prompt stays readable.
function promptText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) return node.map(promptText).join("");
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    const inner = promptText(element.props.children);
    if (element.type === "p") return inner + "\\n\\n";
    if (element.type === "ul" || element.type === "ol") return inner + "\\n";
    if (element.type === "li") return "- " + inner + "\\n";
    return inner;
  }
  return "";
}

interface PromptProps {
  children: React.ReactNode;
  description: string;
  icon?: string;
  actions?: PromptAction[];
}

function Prompt({
  children,
  description,
  icon,
  actions = ["copy"],
}: PromptProps) {
  const text = promptText(children)
    .replace(/\\n{3,}/g, "\\n\\n")
    .trim();

  return (
    <div className="dcp-prompt">
      <div className="dcp-prompt__header">
        {icon ? <Icon name={icon} size={16} /> : null}
        <span className="dcp-prompt__description">{description}</span>
        <span className="dcp-prompt__actions">
          {actions.includes("copy") && (
            <CopyButton text={text} label="Copy prompt" size={16} />
          )}
          {actions.includes("cursor") && (
            <a
              className="dcp-prompt__cursor"
              href={CURSOR_DEEPLINK + encodeURIComponent(text)}
              aria-label="Open prompt in Cursor"
            >
              Cursor
              <Icon name="arrow-up-right" size={12} />
            </a>
          )}
        </span>
      </div>
      <div className="dcp-prompt__body">{children}</div>
    </div>
  );
}

export { Prompt };
`;
