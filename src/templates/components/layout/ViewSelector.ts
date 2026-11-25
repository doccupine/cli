export const viewSelectorTemplate = `"use client";
import { useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Dropdown, DropdownItem } from "@/components/layout/Dropdown";
import { useChoice } from "@/components/useChoice";
import { useStrings } from "@/components/useStrings";

interface ViewSelectorProps {
  /** Every <View> title on the page, in order. */
  titles: string[];
}

/**
 * The page's view selector, in the page header. Picking a title shows that
 * title's <View> blocks everywhere on the page: the views are server
 * rendered, and CSS shows the ones matching <html data-view>, which this
 * sets. The pick is remembered under the "view" choice, so other pages (and
 * other tabs) open on it too.
 */
function ViewSelector({ titles }: ViewSelectorProps) {
  const [stored, setStored] = useChoice("view");
  const t = useStrings();
  const current = stored && titles.includes(stored) ? stored : titles[0];

  // Follows picks made here, in another selector, or in another tab.
  useEffect(() => {
    if (stored) document.documentElement.setAttribute("data-view", stored);
  }, [stored]);

  return (
    <div className="dcp-view-selector">
      <Dropdown
        role="menu"
        label={t.view}
        triggerLabel={\`\${t.view}: \${current}\`}
        align="left"
        compact
        trigger={
          <span className="dcp-view-selector__content">
            <span className="dcp-view-selector__label">{current}</span>
            <ChevronDown size={12} aria-hidden="true" />
          </span>
        }
      >
        {titles.map((title) => (
          <DropdownItem
            key={title}
            type="button"
            role="menuitemradio"
            aria-checked={title === current}
            checked={title === current}
            onClick={() => setStored(title)}
          >
            <span className="dcp-view-selector__mark" aria-hidden="true">
              {title === current && <Check size={14} />}
            </span>
            {title}
          </DropdownItem>
        ))}
      </Dropdown>
    </div>
  );
}

export { ViewSelector };
`;
