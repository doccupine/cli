import { CHAT_WIDTH, SIDEBAR_WIDTH } from "../../app/theme.js";

export const sidePanelTemplate = `"use client";
import React from "react";
import styled from "styled-components";
import { mq, Theme } from "@/app/theme";
import { focusModeHide } from "@/components/layout/SharedStyled";

// Below "lg" the panel stays in the document flow, rendering inline exactly
// where it sits in the MDX source. From "lg" up it is lifted out of the flow
// into the fixed right rail, at the ${SIDEBAR_WIDTH}px width the table of
// contents it replaces would have used - the content column already reserves
// exactly that much, so nothing has to move. Only from "xl", where there is
// room to spare, does it widen to the chat panel's ${CHAT_WIDTH}px and pull
// the other columns left with it (see sidePanelOffset, keyed off the data
// attribute below).
const StyledSidePanel = styled.aside<{ theme: Theme }>\`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.primaryLight} 10%, transparent)\`};

  \${mq("lg")} {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 1;
    width: ${SIDEBAR_WIDTH}px;
    height: 100dvh;
    overflow-y: auto;
    gap: 15px;
    padding: 82px 20px 20px 20px;
    border-left: solid 1px \${({ theme }) => theme.colors.grayLight};
    border-radius: 0;
    background: \${({ theme }) => theme.colors.light};
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  \${mq("xl")} {
    width: ${CHAT_WIDTH}px;
  }

  \${focusModeHide("right")};
\`;

interface SidePanelProps {
  children?: React.ReactNode;
}

function SidePanel({ children }: SidePanelProps) {
  return (
    <StyledSidePanel aria-label="Page panel" data-side-panel>
      {children}
    </StyledSidePanel>
  );
}

export { SidePanel };
`;
