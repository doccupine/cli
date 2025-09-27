export const calloutTemplate = `"use client";
import { Theme } from "@/app/theme";
import { styledText } from "cherry-styled-components/src/lib";
import styled, { css } from "styled-components";
import { Icon, IconProps } from "@/components/layout/Icon";

type CalloutType = "note" | "info" | "warning" | "danger" | "success";

const StyledCallout = styled.div<{ theme: Theme; $type?: CalloutType }>\`
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 20px;
  margin: 0;
  \${({ theme }) => styledText(theme)}
  color: \${({ theme }) => theme.colors.grayDark};

  & svg {
    vertical-align: middle;
    margin-right: 5px;
  }

  \${({ theme, $type }) =>
    $type === "note" &&
    css\`
      border-color: \${theme.isDark ? "#0ea5e94d" : "#0ea5e933"};
      background: \${theme.isDark ? "#0ea5e91a" : "#f0f9ff80"};
      color: \${theme.isDark ? "#bae6fd" : "#0c4a6e"};
    \`}

  \${({ theme, $type }) =>
    $type === "info" &&
    css\`
      border-color: \${theme.isDark ? "#71717a4d" : "#71717a33"};
      background: \${theme.isDark ? "#71717a1a" : "#fafafa80"};
      color: \${theme.isDark ? "#e4e4e7" : "#18181b"};
    \`}

  \${({ theme, $type }) =>
    $type === "warning" &&
    css\`
      border-color: \${theme.isDark ? "#f59e0b4d" : "#f59e0b33"};
      background: \${theme.isDark ? "#f59e0b1a" : "#fffbeb80"};
      color: \${theme.isDark ? "#fde68a" : "#78350f"};
    \`}

  \${({ theme, $type }) =>
    $type === "danger" &&
    css\`
      border-color: \${theme.isDark ? "#ef44444d" : "#ef444433"};
      background: \${theme.isDark ? "#ef44441a" : "#fef2f280"};
      color: \${theme.isDark ? "#fecaca" : "#7f1d1d"};
    \`}

  \${({ theme, $type }) =>
    $type === "success" &&
    css\`
      border-color: \${theme.isDark ? "#10b9814d" : "#10b98133"};
      background: \${theme.isDark ? "#10b9811a" : "#ecfdf580"};
      color: \${theme.isDark ? "#a7f3d0" : "#064e3b"};
    \`}
\`;

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
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
      <Icon name={iconType} size={16} />
      {children}
    </StyledCallout>
  );
}

export { Callout };
`;
