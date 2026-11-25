export const frameTemplate = `import React from "react";
import { renderInline } from "@/components/layout/InlineMarkdown";

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

interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  caption?: string;
  hint?: string;
}

function Frame({ children, caption, hint, className, ...props }: FrameProps) {
  return (
    <div
      {...props}
      className={className ? \`dcp-frame \${className}\` : "dcp-frame"}
    >
      {hint && <p className="dcp-frame__hint">{renderInline(hint)}</p>}
      <figure className="dcp-frame__figure">
        <div className="dcp-frame__content">{withVideoDefaults(children)}</div>
        {caption && (
          <figcaption className="dcp-frame__caption">
            {renderInline(caption)}
          </figcaption>
        )}
      </figure>
    </div>
  );
}

export { Frame };
`;
