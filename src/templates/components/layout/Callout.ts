export const calloutTemplate = `"use client";
import { Icon, IconProps } from "@/components/layout/Icon";
import {
  StyledCallout,
  StyledChildren,
} from "@/components/layout/Callout.styles";
import type { CalloutType } from "@/components/layout/Callout.styles";

interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  icon?: IconProps;
  type?: CalloutType;
}

function Callout({ children, type, icon }: CalloutProps) {
  const iconType =
    type === "note"
      ? "CircleAlert"
      : type === "info"
        ? "Info"
        : type === "warning"
          ? "TriangleAlert"
          : type === "danger"
            ? "OctagonAlert"
            : type === "success"
              ? "Check"
              : (icon as IconProps);
  return (
    <StyledCallout $type={type}>
      {iconType ? <Icon name={iconType} size={16} /> : null}
      <StyledChildren>{children}</StyledChildren>
    </StyledCallout>
  );
}

export { Callout };
`;
