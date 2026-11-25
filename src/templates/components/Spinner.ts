export const spinnerTemplate = `import { LoaderCircle } from "lucide-react";

interface SpinnerProps {
  size?: number;
  className?: string;
}

/** A spinning loader icon; the rotation is .dcp-spinner in app/styles. */
export function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <span className={className ? \`dcp-spinner \${className}\` : "dcp-spinner"}>
      <LoaderCircle size={size} />
    </span>
  );
}
`;
