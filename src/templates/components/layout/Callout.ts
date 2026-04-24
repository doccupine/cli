export const calloutTemplate = `"use client";
import { Theme } from "@/app/theme";
import { styledSmall } from "cherry-styled-components";
import styled, { css } from "styled-components";
import { Icon, IconProps } from "@/components/layout/Icon";

type CalloutType = "note" | "info" | "warning" | "danger" | "success";

const StyledCallout = styled.div<{ theme: Theme; $type?: CalloutType }>\`
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 20px;
  margin: 0;
  \${({ theme }) => styledSmall(theme)}
  color: \${({ theme }) => theme.colors.grayDark};
  display: flex;

  & svg {
    vertical-align: middle;
    min-width: min-content;
    margin: 3px 10px 0 0;
  }

  /* Callout tints are alert-semantic (info-blue, warning-amber, danger-red,
     etc.) and intentionally independent of theme.json. Light-mode values are
     defined by default; dark-mode overrides live in :root.dark & blocks so
     the swap happens via the active <html> class with no re-render. */
  \${({ $type }) =>
    $type === "note" &&
    css\`
      border-color: #0ea5e933;
      background: #f0f9ff80;

      & svg.lucide,
      & p {
        color: #0c4a6e;
      }

      :root.dark & {
        border-color: #0ea5e94d;
        background: #0ea5e91a;

        & svg.lucide,
        & p {
          color: #bae6fd;
        }
      }
    \`}

  \${({ $type }) =>
    $type === "info" &&
    css\`
      border-color: #71717a33;
      background: #fafafa80;

      & svg.lucide,
      & .lucide,
      & p {
        color: #18181b;
      }

      :root.dark & {
        border-color: #71717a4d;
        background: #71717a1a;

        & svg.lucide,
        & .lucide,
        & p {
          color: #e4e4e7;
        }
      }
    \`}

  \${({ $type }) =>
    $type === "warning" &&
    css\`
      border-color: #f59e0b33;
      background: #fffbeb80;

      & svg.lucide,
      & p {
        color: #78350f;
      }

      :root.dark & {
        border-color: #f59e0b4d;
        background: #f59e0b1a;

        & svg.lucide,
        & p {
          color: #fde68a;
        }
      }
    \`}

  \${({ $type }) =>
    $type === "danger" &&
    css\`
      border-color: #ef444433;
      background: #fef2f280;

      & svg.lucide,
      & p {
        color: #7f1d1d;
      }

      :root.dark & {
        border-color: #ef44444d;
        background: #ef44441a;

        & svg.lucide,
        & p {
          color: #fecaca;
        }
      }
    \`}

  \${({ $type }) =>
    $type === "success" &&
    css\`
      border-color: #10b98133;
      background: #ecfdf580;

      & svg.lucide,
      & p {
        color: #064e3b;
      }

      :root.dark & {
        border-color: #10b9814d;
        background: #10b9811a;

        & svg.lucide,
        & p {
          color: #a7f3d0;
        }
      }
    \`}
\`;

const StyledChildren = styled.span\`
  display: flex;
  flex-direction: column;
  gap: 10px;
\`;

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
      <Icon name={iconType} size={16} />
      <StyledChildren>{children}</StyledChildren>
    </StyledCallout>
  );
}

export { Callout };
`;
