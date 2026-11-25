export const visibilityTemplate = `interface VisibilityProps {
  /** "humans": only on the rendered page; "agents": only in what AI reads. */
  for?: string;
  children?: React.ReactNode;
}

/**
 * Content for one audience. The generator already hands each audience its
 * own version of the page (src/lib/visibility.ts in the CLI): the rendered
 * page never contains a block for agents, and llms-full.txt, the .md copies,
 * the MCP server and the AI chat never contain one for humans. This is the
 * fallback for a tag that still reaches the page: a block for agents renders
 * nothing, any other block renders its children.
 */
function Visibility({ for: audience, children }: VisibilityProps) {
  if (audience === "agents") return null;
  return <>{children}</>;
}

export { Visibility };
`;
