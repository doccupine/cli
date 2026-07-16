export const rehypeCodeMetaTemplate = `interface MetaNode {
  type: string;
  tagName?: string;
  data?: { meta?: string };
  properties?: Record<string, unknown>;
  children?: MetaNode[];
}

export function rehypeCodeMeta() {
  return (tree: MetaNode) => {
    const visit = (node: MetaNode) => {
      if (node.type === "element" && node.tagName === "code") {
        const meta = node.data?.meta;
        if (typeof meta === "string" && meta.length > 0) {
          node.properties = { ...node.properties, meta };
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
`;
