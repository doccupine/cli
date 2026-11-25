export const spaceTemplate = `type SpaceSize = number | "none";

const BREAKPOINTS = ["xs", "sm", "md", "lg", "xl", "xxl", "xxxl"] as const;

interface SpaceProps {
  size?: SpaceSize;
  xs?: SpaceSize;
  sm?: SpaceSize;
  md?: SpaceSize;
  lg?: SpaceSize;
  xl?: SpaceSize;
  xxl?: SpaceSize;
  xxxl?: SpaceSize;
  horizontal?: boolean;
  // The $-prefixed names are the API Space had when it was Cherry's
  // component; pages written against it still pass them, so they stay
  // accepted, with the documented plain name winning when both are present.
  $size?: SpaceSize;
  $xs?: SpaceSize;
  $sm?: SpaceSize;
  $md?: SpaceSize;
  $lg?: SpaceSize;
  $xl?: SpaceSize;
  $xxl?: SpaceSize;
  $xxxl?: SpaceSize;
  $horizontal?: boolean;
}

/**
 * An empty span that holds a gap: \`size\` pixels tall (or wide with
 * \`horizontal\`), with per-breakpoint overrides (\`md={80}\` from 768px
 * up). "none" hides it. The sizes become inline custom properties that
 * app/styles/components.css resolves per breakpoint.
 */
function Space(props: SpaceProps) {
  const horizontal = props.horizontal ?? props.$horizontal ?? false;
  const style: Record<string, string> = {};
  const set = (name: string, value: SpaceSize | undefined) => {
    if (value === undefined) return;
    style[name] = value === "none" ? "0px" : \`\${value}px\`;
    style[name + "-display"] =
      value === "none" ? "none" : horizontal ? "inline-block" : "block";
  };
  const size = props.size ?? props.$size;
  // A zero size draws nothing, as before.
  if (size) set("--dcp-space", size);
  for (const breakpoint of BREAKPOINTS) {
    set(
      \`--dcp-space-\${breakpoint}\`,
      props[breakpoint] ?? props[\`$\${breakpoint}\`],
    );
  }
  if (horizontal && Object.keys(style).length > 0) {
    style["--dcp-space-cap"] = "0px";
  }
  return (
    <span
      className="dcp-space"
      data-horizontal={horizontal || undefined}
      style={style as React.CSSProperties}
    />
  );
}

export { Space };
`;
