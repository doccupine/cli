export const tabsTemplate = `"use client";
import React, { ReactNode, useId, useRef, useState } from "react";
import { Icon } from "@/components/layout/Icon";

interface TabContentProps {
  title: string;
  icon?: string;
  children: ReactNode;
}

interface TabsProps {
  children: React.ReactElement<TabContentProps>[];
}

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
    <div className="dcp-tabs">
      <div
        className="dcp-tabs__list"
        role="tablist"
        aria-label="Content tabs"
        aria-orientation="horizontal"
      >
        {tabs.map((tab, index) => {
          const tabId = tabsId + "-tab-" + index;
          const panelId = tabsId + "-panel-" + index;
          return (
            <button
              key={tabId}
              className="dcp-tabs__tab"
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={tabId}
              role="tab"
              aria-selected={activeTab === index}
              aria-controls={panelId}
              tabIndex={activeTab === index ? 0 : -1}
              onClick={() => setActiveTab(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              type="button"
            >
              {tab.props.icon && <Icon name={tab.props.icon} size={18} />}
              {tab.props.title}
            </button>
          );
        })}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tabsId + "-panel-" + index}
          id={tabsId + "-panel-" + index}
          className="dcp-tabs__panel"
          role="tabpanel"
          aria-labelledby={tabsId + "-tab-" + index}
          tabIndex={activeTab === index ? 0 : -1}
          hidden={activeTab !== index}
        >
          {tab.props.children}
        </div>
      ))}
    </div>
  );
};

export { Tabs, TabContent };
`;
