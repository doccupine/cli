export const tabsTemplate = `"use client";
import { Theme } from "@/app/theme";
import { styledText } from "cherry-styled-components";
import React, { useState, ReactNode } from "react";
import styled, { css } from "styled-components";
interface TabContentProps {
  title: string;
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
\`;
const TabButton = styled.button<{ theme: Theme; $isActive?: boolean }>\`
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: \${({ theme }) => theme.colors.light};
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
  min-width: fit-content;
  \${({ theme }) => styledText(theme)};
  color: \${({ theme }) => theme.colors.dark};
  font-weight: 600;
  \${({ theme, $isActive }) =>
    $isActive &&
    css\`
      color: \${theme.colors.primary};
      border-bottom: 3px solid \${theme.colors.primary};
    \`}
  position: relative;
  &:hover {
    \${({ theme, $isActive }) =>
      !$isActive &&
      css\`
        color: \${theme.colors.primary};
        background-color: color-mix(in srgb, \${theme.colors.primaryLight} 10%, transparent);
      \`}
  }
  &:focus {
    outline: none;
  }
  &:not(:last-child) {
    border-right: 1px solid \${({ theme }) => theme.colors.grayLight};
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
\`;
const TabContent: React.FC<TabContentProps> = ({ children }) => {
  return <>{children}</>;
};
const Tabs: React.FC<TabsProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);
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
  return (
    <TabsContainer>
      <TabsList>
        {tabs.map((tab, index) => (
          <TabButton
            key={index}
            $isActive={activeTab === index}
            onClick={() => setActiveTab(index)}
            type="button"
          >
            {tab.props.title}
          </TabButton>
        ))}
      </TabsList>
      <TabPanel>{tabs[activeTab]?.props.children}</TabPanel>
    </TabsContainer>
  );
};
export { Tabs, TabContent };
`;
