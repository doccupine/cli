import { deriveTemplate } from "../../../lib/derive-template.js";
import { sideBarTemplate } from "../../components/SideBar.js";

// The classic SideBar.tsx with the modern design's edits. Rows still indent
// 14px per nesting level, but their base inset comes from the stylesheet
// (--sidebar-row-inset), so the modern styles can line the links up with the
// group label's text.
export const modernSideBarTemplate = deriveTemplate(
  "modern components/SideBar.tsx",
  sideBarTemplate,
  [
    [
      "const indent = { paddingLeft: `${20 + depth * 14}px` };",
      "const indent = {\n    paddingLeft: `calc(var(--sidebar-row-inset, 20px) + ${depth * 14}px)`,\n  };",
    ],
  ],
);
