import { deriveTemplate } from "../../../../lib/derive-template.js";
import { actionBarTemplate } from "../../../components/layout/ActionBar.js";

// The classic ActionBar.tsx with the modern design's edits.
export const modernActionBarTemplate = deriveTemplate(
  "modern components/layout/ActionBar.tsx",
  actionBarTemplate,
  [
    [
      `import { Icon } from "@/components/layout/Icon";
import { Textarea } from "cherry-styled-components";
import { SectionBarContext } from "@/components/layout/DocsComponents";
import {
  StyledActionBar,
  StyledActionBarContent,
  StyledCopyButton,
  StyledActionBarGroup,`,
      `import { Icon } from "@/components/layout/Icon";
import { Textarea } from "cherry-styled-components";
import {
  SectionBarContext,
  useCurrentPage,
} from "@/components/layout/DocsComponents";
import {
  StyledActionBar,
  StyledActionBarContent,
  StyledActionBarEyebrow,
  StyledCopyButton,
  StyledActionBarGroup,`,
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
      `    <>
      <StyledActionBar data-markdown-ignore data-rss={rssHref ? "" : undefined}>
        <StyledActionBarGroup>
          <StyledCopyButton onClick={handleCopyContent} $copied={copied}>`,
      `    <>
      <StyledActionBar data-markdown-ignore data-rss={rssHref ? "" : undefined}>
        {category && (
          <StyledActionBarEyebrow>{category}</StyledActionBarEyebrow>
        )}
        <StyledActionBarGroup>
          <StyledCopyButton onClick={handleCopyContent} $copied={copied}>`,
    ],
  ],
);
