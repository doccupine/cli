import { BADGE_SOLID_COLORS } from "../../styles/badge.js";

export const badgeTemplate = `import { Icon } from "@/components/layout/Icon";

type BadgeColor =
  | "gray"
  | "blue"
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "purple"
  | "white"
  | "surface"
  | "white-destructive"
  | "surface-destructive"
  | "info"
  | "success"
  | "warning"
  | "error";

type BadgeSize = "xs" | "sm" | "md" | "lg";

type BadgeShape = "rounded" | "pill";

// The semantic colors read theme tokens instead of the fixed palette, so
// they follow theme.json and the light/dark toggle. They are also what the
// HTTP method chips use.
const THEME_TOKEN_COLORS = ["info", "success", "warning", "error"] as const;

type ThemeTokenColor = (typeof THEME_TOKEN_COLORS)[number];

function isThemeTokenColor(color: BadgeColor): color is ThemeTokenColor {
  return (THEME_TOKEN_COLORS as readonly string[]).includes(color);
}

// Single source for verb -> badge color, shared by the sidebar method tags
// and the API playground so every surface colors HTTP verbs identically.
const HTTP_METHOD_COLORS: Record<string, BadgeColor> = {
  get: "info",
  post: "success",
  put: "warning",
  patch: "warning",
  delete: "error",
  head: "gray",
  options: "gray",
  trace: "gray",
};

function httpMethodBadgeColor(method: string): BadgeColor {
  return HTTP_METHOD_COLORS[method.toLowerCase()] ?? "gray";
}

// Hex colors with a solid form; white and surface stay filled when solid.
const SOLID_COLORS: readonly BadgeColor[] = [
${BADGE_SOLID_COLORS.map((color) => `  "${color}",`).join("\n")}
];

// Which palette a badge draws: solid wins over stroke; a color without a
// solid form keeps its filled look. The colors themselves are in
// app/styles/components.css (.dcp-badge[data-color][data-variant]).
function badgeVariant(
  color: BadgeColor,
  stroke: boolean,
  solid: boolean,
): "solid" | "stroke" | "filled" {
  if (solid && (isThemeTokenColor(color) || SOLID_COLORS.includes(color))) {
    return "solid";
  }
  if (stroke && !solid) return "stroke";
  return "filled";
}

const badgeIconSizes: Record<BadgeSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
  shape?: BadgeShape;
  icon?: string;
  stroke?: boolean;
  solid?: boolean;
  mono?: boolean;
  disabled?: boolean;
}

function Badge({
  children,
  color = "gray",
  size = "md",
  shape = "rounded",
  icon,
  stroke = false,
  solid = false,
  mono = false,
  disabled = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={className ? \`dcp-badge \${className}\` : "dcp-badge"}
      data-size={size}
      data-shape={shape}
      data-color={color}
      data-variant={badgeVariant(color, stroke, solid)}
      data-mono={mono || undefined}
      data-disabled={disabled || undefined}
    >
      {icon ? <Icon name={icon} size={badgeIconSizes[size]} /> : null}
      {children}
    </span>
  );
}

export { Badge, httpMethodBadgeColor };
`;
