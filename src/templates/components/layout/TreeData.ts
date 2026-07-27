export const treeDataTemplate = `import React from "react";

export interface TreeNode {
  id: string;
  name: string;
  isFolder: boolean;
  defaultOpen: boolean;
  openable: boolean;
  children: TreeNode[];
}

export interface TreeFolderProps {
  name: string;
  defaultOpen?: boolean;
  openable?: boolean;
  children?: React.ReactNode;
}

export interface TreeFileProps {
  name: string;
}

// Tree.Folder and Tree.File are declarative markers: the Tree compound in
// MDXComponents parses them into TreeNode data before anything renders, so
// they never render on their own. This module must stay free of
// "use client" - parsing runs where MDX creates the elements (server
// components included), and only there is comparing an element's type
// against these markers guaranteed to work. Client modules would turn the
// markers into reference proxies whose identity does not survive the
// server boundary.
export function TreeFolder(_props: TreeFolderProps) {
  return null;
}

export function TreeFile(_props: TreeFileProps) {
  return null;
}

function extractText(children: React.ReactNode): string {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (React.isValidElement(children)) {
    const element = children as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    return extractText(element.props.children);
  }
  return "";
}

type ListElement = React.ReactElement<{ children?: React.ReactNode }>;

function isListElement(child: React.ReactNode): child is ListElement {
  return (
    React.isValidElement(child) && (child.type === "ul" || child.type === "ol")
  );
}

// Markdown list syntax: a trailing slash or nested items mark a folder, and
// folders that contain items expand by default. Names strip inline
// formatting because only the text content is extracted. Ids derive from
// position and name so open state survives re-renders.
function parseListItems(list: ListElement, parentId: string): TreeNode[] {
  const nodes: TreeNode[] = [];
  React.Children.forEach(list.props.children, (item) => {
    if (!React.isValidElement(item) || item.type !== "li") return;
    const li = item as React.ReactElement<{ children?: React.ReactNode }>;
    const labelParts: React.ReactNode[] = [];
    const nestedLists: ListElement[] = [];
    React.Children.forEach(li.props.children, (child) => {
      if (isListElement(child)) nestedLists.push(child);
      else labelParts.push(child);
    });
    const raw = extractText(labelParts).trim();
    const name = raw.endsWith("/") ? raw.slice(0, -1) : raw;
    if (!name) return;
    const id = parentId + "/" + nodes.length + "-" + name;
    nodes.push({
      id,
      name,
      isFolder: raw.endsWith("/") || nestedLists.length > 0,
      defaultOpen: nestedLists.length > 0,
      openable: true,
      children: nestedLists.flatMap((nested) => parseListItems(nested, id)),
    });
  });
  return nodes;
}

// Both authoring syntaxes (Tree.Folder/Tree.File elements and markdown
// lists) normalize into the same node model, so they can be mixed freely.
export function parseTreeChildren(
  children: React.ReactNode,
  parentId: string,
): TreeNode[] {
  const nodes: TreeNode[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === TreeFolder) {
      const props = child.props as TreeFolderProps;
      if (!props.name) return;
      const id = parentId + "/" + nodes.length + "-" + props.name;
      nodes.push({
        id,
        name: props.name,
        isFolder: true,
        defaultOpen: props.defaultOpen === true,
        openable: props.openable !== false,
        children: parseTreeChildren(props.children, id),
      });
    } else if (child.type === TreeFile) {
      const props = child.props as TreeFileProps;
      if (!props.name) return;
      nodes.push({
        id: parentId + "/" + nodes.length + "-" + props.name,
        name: props.name,
        isFolder: false,
        defaultOpen: false,
        openable: false,
        children: [],
      });
    } else if (isListElement(child)) {
      nodes.push(...parseListItems(child, parentId + "/" + nodes.length));
    }
  });
  return nodes;
}
`;
