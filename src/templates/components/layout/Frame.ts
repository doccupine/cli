export const frameTemplate = `"use client";
import React from "react";
import Link from "next/link";
import styled from "styled-components";
import { styledSmall } from "cherry-styled-components";
import { Theme } from "@/app/theme";

// Captions and hints accept a deliberately small slice of Markdown: links,
// bold, italic and inline code. Everything is parsed into React elements -
// never dangerouslySetInnerHTML - so author text can't inject raw markup.
const INLINE_MD =
  /\\[([^\\]]+)\\]\\(([^)\\s]+)\\)|\\*\\*([^*]+)\\*\\*|__([^_]+)__|\`([^\`]+)\`|\\*([^*]+)\\*|_([^_]+)_/g;

// Link targets are limited to schemes that can't execute script. Anything
// else (javascript:, data:, vbscript:) falls back to literal text.
const SAFE_HREF = /^(?:https?:\\/\\/|mailto:|[/#]|\\.{1,2}\\/)/i;

// Emphasis and link labels are parsed recursively, so the matcher must not
// carry state between calls - matchAll() iterates over its own clone of the
// pattern, leaving INLINE_MD.lastIndex untouched for the caller mid-loop.
function renderInline(text: string, keyPrefix = ""): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_MD)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    // RegExpExecArray types every group as string, but unmatched alternatives
    // are undefined at runtime - widen so the branch checks below are honest.
    const full = match[0];
    const groups: Array<string | undefined> = match;
    const [, linkText, href, strong, strongAlt, code, em, emAlt] = groups;
    const key = \`\${keyPrefix}\${start}\`;

    if (href !== undefined) {
      const label = renderInline(linkText as string, \`\${key}-\`);
      if (!SAFE_HREF.test(href)) {
        nodes.push(full);
      } else if (href.startsWith("/")) {
        nodes.push(
          <Link key={key} href={href}>
            {label}
          </Link>,
        );
      } else if (href.startsWith("#")) {
        nodes.push(
          <a key={key} href={href}>
            {label}
          </a>,
        );
      } else {
        nodes.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>,
        );
      }
    } else if (strong !== undefined || strongAlt !== undefined) {
      nodes.push(
        <strong key={key}>
          {renderInline((strong ?? strongAlt) as string, \`\${key}-\`)}
        </strong>,
      );
    } else if (code !== undefined) {
      nodes.push(<code key={key}>{code}</code>);
    } else {
      nodes.push(
        <em key={key}>{renderInline((em ?? emAlt) as string, \`\${key}-\`)}</em>,
      );
    }

    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

// A self-playing video only works across browsers when it is also muted and
// inline, so the frame fills those in. Explicit author values always win, and
// videos without autoPlay are left untouched. Recursion is capped and limited
// to host elements so a markdown-wrapped <p> is still traversed while author
// components are never re-cloned.
function withVideoDefaults(
  children: React.ReactNode,
  depth = 0,
): React.ReactNode {
  if (depth > 2) return children;

  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    if (child.type === "video") {
      const videoProps =
        child.props as React.VideoHTMLAttributes<HTMLVideoElement>;
      if (!videoProps.autoPlay) return child;
      return React.cloneElement(
        child as React.ReactElement<
          React.VideoHTMLAttributes<HTMLVideoElement>
        >,
        {
          playsInline: videoProps.playsInline ?? true,
          loop: videoProps.loop ?? true,
          muted: videoProps.muted ?? true,
        },
      );
    }

    if (typeof child.type !== "string") return child;

    const hostProps = child.props as { children?: React.ReactNode };
    if (hostProps.children == null) return child;

    return React.cloneElement(
      child as React.ReactElement<{ children?: React.ReactNode }>,
      { children: withVideoDefaults(hostProps.children, depth + 1) },
    );
  });
}

const StyledFrameWrapper = styled.div\`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 100%;
\`;

const StyledFrameHint = styled.p<{ theme: Theme }>\`
  \${({ theme }) => styledSmall(theme)};
  color: \${({ theme }) => theme.colors.grayDark};
  margin: 0;
\`;

const StyledFrame = styled.figure<{ theme: Theme }>\`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 8px;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.grayLight} 25%, transparent)\`};
\`;

const StyledFrameContent = styled.div<{ theme: Theme }>\`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;

  & > * {
    max-width: 100%;
  }

  & p {
    margin: 0;
  }

  & img,
  & video,
  & iframe {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
  }
\`;

const StyledFrameCaption = styled.figcaption<{ theme: Theme }>\`
  \${({ theme }) => styledSmall(theme)};
  color: \${({ theme }) => theme.colors.gray};
  text-align: center;
  margin: 0;
\`;

interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  caption?: string;
  hint?: string;
}

function Frame({ children, caption, hint, ...props }: FrameProps) {
  return (
    <StyledFrameWrapper {...props}>
      {hint && <StyledFrameHint>{renderInline(hint)}</StyledFrameHint>}
      <StyledFrame>
        <StyledFrameContent>{withVideoDefaults(children)}</StyledFrameContent>
        {caption && (
          <StyledFrameCaption>{renderInline(caption)}</StyledFrameCaption>
        )}
      </StyledFrame>
    </StyledFrameWrapper>
  );
}

export { Frame };
`;
