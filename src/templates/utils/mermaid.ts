export const mermaidTemplate = `import "server-only";
import { renderMermaidSVG } from "beautiful-mermaid";

const DIAGRAM_OPTIONS = {
  bg: "var(--mermaid-bg)",
  fg: "var(--mermaid-fg)",
  line: "var(--mermaid-line)",
  accent: "var(--mermaid-accent)",
  muted: "var(--mermaid-muted)",
  surface: "var(--mermaid-surface)",
  border: "var(--mermaid-border)",
  transparent: true,
};

export type MermaidResult =
  | { ok: true; svg: string; width: number | null }
  | { ok: false; error: string };

function normalizeSvg(svg: string): {
  ok: true;
  svg: string;
  width: number | null;
} {
  const openTag = /^<svg\\b[^>]*>/.exec(svg);
  if (!openTag) return { ok: true, svg, width: null };

  const widthMatch = /\\swidth="([\\d.]+)"/.exec(openTag[0]);
  const width = widthMatch ? Number.parseFloat(widthMatch[1]) : null;

  const stripped = openTag[0].replace(/\\s(?:width|height)="[^"]*"/g, "");
  return {
    ok: true,
    svg: stripped + svg.slice(openTag[0].length),
    width: width !== null && Number.isFinite(width) ? width : null,
  };
}

export function renderDiagram(code: string): MermaidResult {
  try {
    return normalizeSvg(renderMermaidSVG(code, DIAGRAM_OPTIONS));
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
`;
