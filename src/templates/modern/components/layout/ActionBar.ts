import { deriveTemplate } from "../../../../lib/derive-template.js";
import { actionBarTemplate } from "../../../components/layout/ActionBar.js";

// The classic ActionBar.tsx with the modern design's edits.
export const modernActionBarTemplate = deriveTemplate(
  "modern components/layout/ActionBar.tsx",
  actionBarTemplate,
  [
    [
      `import { Icon } from "@/components/layout/Icon";
import { SectionBarContext } from "@/components/layout/DocsComponents";
`,
      `import { Icon } from "@/components/layout/Icon";
import {
  SectionBarContext,
  useCurrentPage,
} from "@/components/layout/DocsComponents";
`,
    ],
    [
      `  const hasSectionBar = useContext(SectionBarContext);
  const pathname = usePathname();
  const t = useStrings();
`,
      `  const hasSectionBar = useContext(SectionBarContext);
  const pathname = usePathname();
  const category = useCurrentPage()?.category;
  const t = useStrings();
`,
    ],
    [
      `        data-rss={rssHref ? "" : undefined}
      >
        <div className="dcp-action-bar__group">`,
      `        data-rss={rssHref ? "" : undefined}
      >
        {category && <p className="dcp-action-bar__eyebrow">{category}</p>}
        <div className="dcp-action-bar__group">`,
    ],
  ],
);
