export const modernCalloutStylesTemplate = `"use client";
import { Theme } from "@/app/theme";
import styled, { css } from "styled-components";

export type CalloutType = "note" | "info" | "warning" | "danger" | "success";

// Soft tinted panels without borders. A typed callout tints its fill, icon and
// text with its alert color; an untyped one sits on a neutral wash.
export const StyledCallout = styled.div<{ theme: Theme; $type?: CalloutType }>\`
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.dark} 4%, transparent)\`};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 14px 16px;
  margin: 0;
  max-width: 100%;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 1.7;
  color: \${({ theme }) => theme.colors.grayDark};
  display: flex;
  gap: 12px;

  & svg {
    flex-shrink: 0;
    min-width: min-content;
    margin: 3px 0 0;
  }

  /* Callout tints are alert-semantic (info-blue, warning-amber, danger-red,
     etc.) and intentionally independent of theme.json. Light-mode values are
     defined by default; dark-mode overrides live in :root.dark & blocks so
     the swap happens via the active <html> class with no re-render. */
  \${({ $type }) =>
    $type === "note" &&
    css\`
      background: #0ea5e914;

      & svg.lucide,
      & p {
        color: #0c4a6e;
      }

      :root.dark & {
        background: #0ea5e91f;

        & svg.lucide,
        & p {
          color: #bae6fd;
        }
      }
    \`}

  \${({ $type }) =>
    $type === "info" &&
    css\`
      background: #71717a14;

      & svg.lucide,
      & .lucide,
      & p {
        color: #18181b;
      }

      :root.dark & {
        background: #a1a1aa1f;

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
      background: #f59e0b1a;

      & svg.lucide,
      & p {
        color: #78350f;
      }

      :root.dark & {
        background: #f59e0b1f;

        & svg.lucide,
        & p {
          color: #fde68a;
        }
      }
    \`}

  \${({ $type }) =>
    $type === "danger" &&
    css\`
      background: #ef444414;

      & svg.lucide,
      & p {
        color: #7f1d1d;
      }

      :root.dark & {
        background: #ef44441f;

        & svg.lucide,
        & p {
          color: #fecaca;
        }
      }
    \`}

  \${({ $type }) =>
    $type === "success" &&
    css\`
      background: #10b98117;

      & svg.lucide,
      & p {
        color: #064e3b;
      }

      :root.dark & {
        background: #10b9811f;

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
  gap: 8px;
  min-width: 0;
\`;
`;
