export const copyButtonTemplate = `"use client";
import { useCallback, useState } from "react";
import { Icon } from "@/components/layout/Icon";

/* Icon-only copy-to-clipboard button. Same look and behaviour as the copy
   button in the code block: the border highlights on hover with the focus and
   active rings, and the icon swaps to a check in success green for two
   seconds after a successful copy. Styles: .dcp-copy-button in
   app/styles/design.css. */
interface CopyButtonProps {
  text: string;
  size?: number;
  label?: string;
  className?: string;
}

export function CopyButton({
  text,
  size = 12,
  label = "Copy",
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      data-copied={copied || undefined}
      aria-label={copied ? "Copied" : label}
      className={\`dcp-copy-button \${className ?? ""}\`.trim()}
    >
      <Icon name={copied ? "check" : "copy"} size={size} />
    </button>
  );
}
`;
