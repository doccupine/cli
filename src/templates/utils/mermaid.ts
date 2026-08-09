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

function parseColor(value: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3,8})$/i.exec(value.trim());
  if (hex) {
    let channels = hex[1];
    if (channels.length === 3 || channels.length === 4) {
      channels = channels
        .slice(0, 3)
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (channels.length !== 6 && channels.length !== 8) return null;
    return [
      Number.parseInt(channels.slice(0, 2), 16),
      Number.parseInt(channels.slice(2, 4), 16),
      Number.parseInt(channels.slice(4, 6), 16),
    ];
  }
  const rgb = /^rgba?\\(\\s*(\\d+)[\\s,]+(\\d+)[\\s,]+(\\d+)/i.exec(value.trim());
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

// beautiful-mermaid labels nodes with the theme foreground (white in dark
// mode) even when the diagram sets an explicit fill via classDef/style, which
// leaves white text on light colored boxes. The SVG renders once and is shared
// by both modes, so bake a literal contrast color into the labels of nodes
// whose shape has a literal fill.
function contrastNodeLabels(svg: string): string {
  return svg.replace(/<g class="node"[^>]*>[\\s\\S]*?<\\/g>/g, (group) => {
    const shapeFill = /fill="([^"]*)"/.exec(group)?.[1] ?? "";
    if (shapeFill.startsWith("var(") || shapeFill === "none") return group;
    const rgb = parseColor(shapeFill);
    // YIQ perceived brightness. Unparseable literals (named colors) default
    // to black text — classDef fills are overwhelmingly light pastels.
    const yiq = rgb ? (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 : 255;
    const label = yiq >= 128 ? "#000000" : "#ffffff";
    return group.replace(
      /(<text[^>]*fill=")var\\(--_text\\)(")/g,
      "$1" + label + "$2",
    );
  });
}

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
    return normalizeSvg(
      contrastNodeLabels(renderMermaidSVG(code, DIAGRAM_OPTIONS)),
    );
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
`;
