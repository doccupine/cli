export const promptTemplate = `"use client";
import React from "react";
import styled from "styled-components";
import { interactiveStyles, styledText } from "cherry-styled-components";
import { Theme } from "@/app/theme";
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

const StyledPrompt = styled.div<{ theme: Theme }>\`
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 20px;
  width: 100%;
\`;

const StyledPromptHeader = styled.div<{ theme: Theme }>\`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0 0 15px;
  \${({ theme }) => styledText(theme)};
  font-weight: 700;
  color: \${({ theme }) => theme.colors.dark};

  & > svg.lucide {
    flex-shrink: 0;
    margin-top: 4px;
    color: inherit;
  }
\`;

const StyledPromptDescription = styled.span\`
  flex: 1;
  min-width: 0;
\`;

const StyledPromptActions = styled.span\`
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
\`;

// Matches the CopyButton chrome so the two actions read as one control
// group; a link rather than a button because it navigates to the Cursor
// deeplink.
const StyledCursorLink = styled.a<{ theme: Theme }>\`
  \${interactiveStyles}
  display: flex;
  align-items: center;
  gap: 5px;
  background: \${({ theme }) => theme.colors.light};
  border-color: \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  padding: 4px 8px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  color: \${({ theme }) => theme.colors.grayDark};
  text-decoration: none;

  & svg.lucide {
    margin: 0;
    color: inherit;
  }
\`;

const StyledPromptBody = styled.div<{ theme: Theme }>\`
  \${({ theme }) => styledText(theme)};
  color: \${({ theme }) => theme.colors.grayDark};
  display: flex;
  flex-direction: column;
  gap: 20px;
\`;

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
    <StyledPrompt>
      <StyledPromptHeader>
        {icon ? <Icon name={icon} size={16} /> : null}
        <StyledPromptDescription>{description}</StyledPromptDescription>
        <StyledPromptActions>
          {actions.includes("copy") && (
            <CopyButton text={text} label="Copy prompt" size={16} />
          )}
          {actions.includes("cursor") && (
            <StyledCursorLink
              href={CURSOR_DEEPLINK + encodeURIComponent(text)}
              aria-label="Open prompt in Cursor"
            >
              Cursor
              <Icon name="arrow-up-right" size={12} />
            </StyledCursorLink>
          )}
        </StyledPromptActions>
      </StyledPromptHeader>
      <StyledPromptBody>{children}</StyledPromptBody>
    </StyledPrompt>
  );
}

export { Prompt };
`;
