import type { DesignStyles } from "./index.js";

// <Space> (components/layout/Space.tsx): an empty span that holds a gap.
// The component writes each size it is given as inline custom properties:
// --dcp-space (size) and --dcp-space-<bp> (xs ... xxxl), each with a
// --dcp-space[-<bp>]-display ("block", "inline-block" or "none"). From each
// breakpoint up the largest one given wins, falling back to the smaller ones
// and then to size, which is what --dcp-space-at-<bp> resolves. data-horizontal
// turns the gap into a width.

const BREAKPOINTS: [string, number][] = [
  ["xs", 0],
  ["sm", 576],
  ["md", 768],
  ["lg", 992],
  ["xl", 1200],
  ["xxl", 1440],
  ["xxxl", 1920],
];

// One declaration as Prettier prints it inside the layer (4 spaces deep):
// a var() that overflows the line breaks its arguments onto their own lines.
function declaration(name: string, value: string): string {
  if (`    ${name}: ${value};`.length <= 80) return `  ${name}: ${value};`;
  const [, first, rest] = value.match(/^var\(([^,]+), (.*)\)$/)!;
  return `  ${name}: var(\n    ${first},\n    ${rest}\n  );`;
}

function chain(): string {
  const lines: string[] = [];
  let previous = "";
  for (const [bp] of BREAKPOINTS) {
    const size = previous
      ? `var(--dcp-space-${bp}, var(--dcp-space-at-${previous}))`
      : `var(--dcp-space-${bp}, var(--dcp-space))`;
    const display = previous
      ? `var(--dcp-space-${bp}-display, var(--dcp-space-at-${previous}-display))`
      : `var(--dcp-space-${bp}-display, var(--dcp-space-display, inline))`;
    lines.push(declaration(`--dcp-space-at-${bp}`, size));
    lines.push(declaration(`--dcp-space-at-${bp}-display`, display));
    previous = bp;
  }
  return lines.join("\n");
}

function sizing(bp: string, indent: string): string {
  return `${indent}.dcp-space {
${indent}  display: var(--dcp-space-at-${bp}-display);
${indent}  min-height: var(--dcp-space-at-${bp}, auto);
${indent}  max-height: var(--dcp-space-at-${bp}, none);
${indent}}

${indent}.dcp-space[data-horizontal] {
${indent}  min-height: auto;
${indent}  max-height: var(--dcp-space-cap, none);
${indent}  min-width: var(--dcp-space-at-${bp}, auto);
${indent}  max-width: var(--dcp-space-at-${bp}, none);
${indent}}`;
}

const css = [
  `.dcp-space {\n${chain()}\n}`,
  sizing("xs", ""),
  ...BREAKPOINTS.slice(1).map(
    ([bp, width]) =>
      `@media screen and (min-width: ${width}px) {\n${sizing(bp, "  ")}\n}`,
  ),
].join("\n\n");

export const spaceStyles: DesignStyles = { shared: css };
