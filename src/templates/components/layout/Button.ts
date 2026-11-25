export const buttonTemplate = `import Link from "next/link";
import { Icon } from "@/components/layout/Icon";

type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonSize = "default" | "big" | "small";

interface LinkButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  outline?: boolean;
  fullWidth?: boolean;
  icon?: string;
  iconPosition?: "left" | "right";
  /** Accepted for compatibility; the look comes from app/styles. */
  theme?: unknown;
  // The "$"-prefixed props of the original Cherry-based Button, still
  // accepted from MDX: the plain props above win when both are set.
  $variant?: ButtonVariant;
  $size?: ButtonSize;
  $outline?: boolean;
  $fullWidth?: boolean;
  $error?: boolean;
  $icon?: React.ReactNode;
  $iconPosition?: "left" | "right";
}

/**
 * The MDX button: a <button>, or a link when it has an href. The look is
 * .dcp-button in app/styles; links also carry "button-link", which opts them
 * out of the base link focus ring so the button draws its own.
 */
function Button({
  variant,
  size,
  outline,
  fullWidth,
  icon,
  iconPosition = "left",
  theme: _theme,
  href,
  target,
  rel,
  $variant,
  $size,
  $outline,
  $fullWidth,
  $error,
  $icon: _icon,
  $iconPosition: _iconPosition,
  className,
  disabled,
  children,
  ...props
}: LinkButtonProps) {
  const isOutline = outline ?? $outline ?? false;
  const data = {
    "data-variant": disabled ? undefined : (variant ?? $variant ?? "primary"),
    "data-outline": isOutline || undefined,
    "data-error": (!disabled && $error) || undefined,
    "data-size": size ?? $size ?? "default",
    "data-full-width": (fullWidth ?? $fullWidth) || undefined,
    "data-disabled": disabled || undefined,
  };
  const content = (
    <>
      {iconPosition === "left" && icon && <Icon name={icon} size={16} />}
      {children}
      {iconPosition === "right" && icon && <Icon name={icon} size={16} />}
    </>
  );
  if (href) {
    const isExternal = /^(https?:)?\\/\\//i.test(href);
    const resolvedTarget = target ?? (isExternal ? "_blank" : undefined);
    const resolvedRel =
      rel ?? (resolvedTarget === "_blank" ? "noopener noreferrer" : undefined);
    return (
      <div>
        <Link
          {...(props as Omit<
            React.AnchorHTMLAttributes<HTMLAnchorElement>,
            "href"
          >)}
          href={href}
          target={resolvedTarget}
          rel={resolvedRel}
          aria-disabled={disabled || undefined}
          className={["dcp-button", "button-link", className]
            .filter(Boolean)
            .join(" ")}
          {...data}
        >
          {content}
        </Link>
      </div>
    );
  }
  return (
    <div>
      <button
        {...props}
        disabled={disabled}
        className={className ? \`dcp-button \${className}\` : "dcp-button"}
        {...data}
      >
        {content}
      </button>
    </div>
  );
}

export { Button };
`;
