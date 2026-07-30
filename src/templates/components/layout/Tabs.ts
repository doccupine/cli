export const tabsTemplate = `"use client";
import { Theme } from "@/app/theme";
import { Button, resetButton, styledText } from "cherry-styled-components";
import React, { ReactNode, useId, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { thinScrollbar } from "@/components/layout/SharedStyled";
import { Icon } from "@/components/layout/Icon";

interface TabContentProps {
  title: string;
  icon?: string;
  children: ReactNode;
}

interface TabsProps {
  children: React.ReactElement<TabContentProps>[];
}

const TabsContainer = styled.div\`
  width: 100%;
  margin: 0 auto;
\`;

const TabsList = styled.div<{ theme: Theme }>\`
  display: flex;
  overflow: hidden;
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background-color: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  overflow-x: auto;
  \${thinScrollbar};
\`;

const TabButton = styled(Button)<{ theme: Theme; $isActive?: boolean }>\`
  \${resetButton};
  appearance: none;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 0;
  background: \${({ theme }) => theme.colors.light};
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
  min-width: fit-content;
  height: auto;
  min-height: 0;
  \${({ theme }) => styledText(theme)};
  color: \${({ theme }) => theme.colors.dark};
  font-weight: 600;
  position: relative;

  & svg {
    flex-shrink: 0;
  }

  \${({ theme, $isActive }) =>
    $isActive &&
    css\`
      color: \${theme.colors.primary};
      border-bottom-color: \${theme.colors.primary};
    \`}

  &:hover {
    \${({ theme, $isActive }) =>
      !$isActive &&
      css\`
        color: \${theme.colors.primary};
        background-color: color-mix(
          in srgb,
          \${theme.colors.primaryLight} 10%,
          transparent
        );
      \`}
  }

  &:focus-visible {
    outline: none;
    z-index: 1;
    box-shadow: inset 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }

  &:not(:last-child) {
    border-right: 1px solid \${({ theme }) => theme.colors.grayLight};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
\`;

const TabPanel = styled.div<{ theme: Theme }>\`
  background-color: \${({ theme }) => theme.colors.light};
  padding: 20px;
  border-radius: 0 0 \${({ theme }) => theme.spacing.radius.lg}
    \${({ theme }) => theme.spacing.radius.lg};
  color: \${({ theme }) => theme.colors.grayDark};
  \${({ theme }) => styledText(theme)}
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-top: none;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-wrap: wrap;
  flex: 1;

  &[hidden] {
    display: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;

const TabContent: React.FC<TabContentProps> = ({ children }) => {
  return <>{children}</>;
};

const Tabs: React.FC<TabsProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabsId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tabs = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<TabContentProps> =>
      Boolean(
        React.isValidElement(child) &&
        child.props &&
        typeof child.props === "object" &&
        "title" in child.props &&
        typeof child.props.title === "string" &&
        child.props.title.trim() !== "",
      ),
  );

  const selectTab = (index: number) => {
    setActiveTab(index);
    tabRefs.current[index]?.focus();
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = index === tabs.length - 1 ? 0 : index + 1;
    } else if (event.key === "ArrowLeft") {
      nextIndex = index === 0 ? tabs.length - 1 : index - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    selectTab(nextIndex);
  };

  return (
    <TabsContainer>
      <TabsList
        role="tablist"
        aria-label="Content tabs"
        aria-orientation="horizontal"
      >
        {tabs.map((tab, index) => {
          const tabId = tabsId + "-tab-" + index;
          const panelId = tabsId + "-panel-" + index;
          return (
            <TabButton
              key={tabId}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={tabId}
              role="tab"
              aria-selected={activeTab === index}
              aria-controls={panelId}
              tabIndex={activeTab === index ? 0 : -1}
              $isActive={activeTab === index}
              onClick={() => setActiveTab(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              type="button"
            >
              {tab.props.icon && <Icon name={tab.props.icon} size={18} />}
              {tab.props.title}
            </TabButton>
          );
        })}
      </TabsList>
      {tabs.map((tab, index) => (
        <TabPanel
          key={tabsId + "-panel-" + index}
          id={tabsId + "-panel-" + index}
          role="tabpanel"
          aria-labelledby={tabsId + "-tab-" + index}
          tabIndex={activeTab === index ? 0 : -1}
          hidden={activeTab !== index}
        >
          {tab.props.children}
        </TabPanel>
      ))}
    </TabsContainer>
  );
};

export { Tabs, TabContent };
`;
