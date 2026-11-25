import { deriveTemplate } from "../../../../lib/derive-template.js";
import { codeTemplate } from "../../../components/layout/Code.js";

// The classic Code.tsx with the modern design's edits: a label (the file name,
// else the language) instead of the window dots.
export const modernCodeTemplate = deriveTemplate(
  "modern components/layout/Code.tsx",
  codeTemplate,
  [
    [
      `      <div className="dcp-code__bar">
        <div className="dcp-code__dots">
          <span className="dcp-code__dot" />
          <span className="dcp-code__dot" />
          <span className="dcp-code__dot" />
        </div>
        {title ? <span className="dcp-code__title">{title}</span> : null}`,
      `      <div className="dcp-code__bar">
        <span className="dcp-code__title">{title || language}</span>`,
    ],
  ],
);
