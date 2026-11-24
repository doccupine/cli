import { deriveTemplate } from "../../../../lib/derive-template.js";
import { codeTemplate } from "../../../components/layout/Code.js";

// The classic Code.tsx with the modern design's edits.
export const modernCodeTemplate = deriveTemplate(
  "modern components/layout/Code.tsx",
  codeTemplate,
  [
    [
      `  CodeWrapper,
  TopBar,
  DotsContainer,
  Dot,
  CopyButton,
  TopBarTitle,`,
      `  CodeWrapper,
  TopBar,
  CopyButton,
  TopBarTitle,`,
    ],
    [
      `    >
      <TopBar theme={theme}>
        <DotsContainer>
          <Dot theme={theme} />
          <Dot theme={theme} />
          <Dot theme={theme} />
        </DotsContainer>
        {title ? <TopBarTitle theme={theme}>{title}</TopBarTitle> : null}
        <CopyButton
          onClick={handleCopy}`,
      `    >
      <TopBar theme={theme}>
        <TopBarTitle theme={theme}>{title || language}</TopBarTitle>
        <CopyButton
          onClick={handleCopy}`,
    ],
  ],
);
