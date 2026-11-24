// Look of <Callout>. The type-to-icon mapping stays in Callout.tsx.
export const calloutStylesTemplate = `"use client";
import { Theme } from "@/app/theme";
import { styledSmall } from "cherry-styled-components";
import styled, { css } from "styled-components";

export type CalloutType = "note" | "info" | "warning" | "danger" | "success";

export const StyledCallout = styled.div<{ theme: Theme; $type?: CalloutType }>\`
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 20px;
  margin: 0;
  max-width: 100%;
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

export const StyledChildren = styled.span\`
  display: flex;
  flex-direction: column;
  gap: 10px;
\`;
`;
