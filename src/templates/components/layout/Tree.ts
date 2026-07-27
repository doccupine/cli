export const treeTemplate = `"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { Theme } from "@/app/theme";
import { Icon } from "@/components/layout/Icon";
import { thinScrollbar } from "@/components/layout/SharedStyled";
import type { TreeNode } from "@/components/layout/TreeData";

const TYPE_AHEAD_RESET_MS = 600;

interface FlatItem {
  node: TreeNode;
  parentId: string | null;
}

// The prose container styles every descendant "ul li" (bullet dots, padding,
// min-height) at (0,1,2)+ specificity, so the tree's own lists and items use
// && to reach (0,2,0) and win.
const StyledTree = styled.ul<{ theme: Theme }>\`
  && {
    background: \${({ theme }) => theme.colors.light};
    border: solid 1px \${({ theme }) => theme.colors.grayLight};
    border-radius: \${({ theme }) => theme.spacing.radius.lg};
    padding: 12px;
    margin: 0;
    width: 100%;
    list-style: none;
    overflow-x: auto;
    \${thinScrollbar};
  }
\`;

const StyledTreeGroup = styled.ul<{ theme: Theme }>\`
  && {
    list-style: none;
    margin: 0 0 0 13px;
    padding: 0 0 0 9px;
    border-left: solid 1px \${({ theme }) => theme.colors.grayLight};
  }
\`;

const StyledTreeRow = styled.span<{ theme: Theme; $isInteractive: boolean }>\`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  transition: background 0.2s ease;

  \${({ $isInteractive, theme }) =>
    $isInteractive &&
    css\`
      cursor: pointer;

      &:hover {
        background: \${theme.colors.grayLight};
      }
    \`}
\`;

const StyledTreeItem = styled.li<{ theme: Theme }>\`
  && {
    display: block;
    padding: 0;
    margin: 0;
    min-height: 0;
    outline: none;
  }

  &&::before {
    content: none;
  }

  &:focus-visible > \${StyledTreeRow} {
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;

const StyledTreeChevron = styled.span<{ theme: Theme; $isOpen: boolean }>\`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: \${({ theme }) => theme.colors.gray};
  transition: transform 0.2s ease;

  \${({ $isOpen }) =>
    $isOpen &&
    css\`
      transform: rotate(90deg);
    \`}
\`;

const StyledTreeSpacer = styled.span\`
  flex-shrink: 0;
  width: 16px;
  height: 16px;
\`;

const StyledTreeIcon = styled.span<{ theme: Theme }>\`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: \${({ theme }) => theme.colors.gray};
\`;

const StyledTreeName = styled.span<{ theme: Theme; $isFolder: boolean }>\`
  font-family: \${({ theme }) => theme.fonts.mono};
  font-size: 14px;
  line-height: 1.6;
  white-space: nowrap;
  color: \${({ theme, $isFolder }) =>
    $isFolder ? theme.colors.dark : theme.colors.grayDark};
\`;

interface TreeProps {
  nodes: TreeNode[];
}

// Renders the TreeNode data that the Tree compound in MDXComponents parses
// out of either authoring syntax. Receiving plain data (never elements)
// keeps the server/client boundary trivially serializable.
function Tree({ nodes }: TreeProps) {
  // Open state is stored as overrides on top of each folder's defaultOpen so
  // nodes parsed after a re-render keep their authored state until toggled.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const typeAheadBuffer = useRef("");
  const typeAheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (typeAheadTimer.current) clearTimeout(typeAheadTimer.current);
    },
    [],
  );

  const isOpen = useCallback(
    (node: TreeNode) => overrides[node.id] ?? node.defaultOpen,
    [overrides],
  );

  // The flattened list of currently visible items drives keyboard
  // navigation in document order.
  const visible = useMemo(() => {
    const out: FlatItem[] = [];
    const walk = (list: TreeNode[], parentId: string | null) => {
      list.forEach((node) => {
        out.push({ node, parentId });
        if (node.isFolder && isOpen(node)) {
          walk(node.children, node.id);
        }
      });
    };
    walk(nodes, null);
    return out;
  }, [nodes, isOpen]);

  // Roving tabindex: exactly one visible item is tabbable. Falls back to the
  // first item when focus points at a node hidden by a collapsed ancestor.
  const activeId = useMemo(() => {
    if (focusedId && visible.some((item) => item.node.id === focusedId)) {
      return focusedId;
    }
    return visible.length > 0 ? visible[0].node.id : null;
  }, [focusedId, visible]);

  const setOpen = (node: TreeNode, open: boolean) => {
    if (!node.isFolder || !node.openable) return;
    setOverrides((prev) => ({ ...prev, [node.id]: open }));
  };

  const focusItem = (id: string) => {
    setFocusedId(id);
    itemRefs.current.get(id)?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const index = visible.findIndex((item) => item.node.id === activeId);
    if (index < 0) return;
    const current = visible[index];
    const node = current.node;
    const key = event.key;

    if (key === "ArrowDown") {
      event.preventDefault();
      if (index + 1 < visible.length) focusItem(visible[index + 1].node.id);
    } else if (key === "ArrowUp") {
      event.preventDefault();
      if (index > 0) focusItem(visible[index - 1].node.id);
    } else if (key === "ArrowRight") {
      event.preventDefault();
      if (!node.isFolder) return;
      if (!isOpen(node)) setOpen(node, true);
      else if (node.children.length > 0) focusItem(node.children[0].id);
    } else if (key === "ArrowLeft") {
      event.preventDefault();
      if (node.isFolder && isOpen(node) && node.openable) {
        setOpen(node, false);
      } else if (current.parentId) {
        focusItem(current.parentId);
      }
    } else if (key === "Home") {
      event.preventDefault();
      focusItem(visible[0].node.id);
    } else if (key === "End") {
      event.preventDefault();
      focusItem(visible[visible.length - 1].node.id);
    } else if (key === "Enter" || key === " ") {
      event.preventDefault();
      setOpen(node, !isOpen(node));
    } else if (key === "*") {
      event.preventDefault();
      setOverrides((prev) => {
        const next = { ...prev };
        visible.forEach((item) => {
          if (
            item.parentId === current.parentId &&
            item.node.isFolder &&
            item.node.openable
          ) {
            next[item.node.id] = true;
          }
        });
        return next;
      });
    } else if (key.length === 1 && key !== " ") {
      // Type-ahead: buffered characters jump to the next item whose name
      // starts with what was typed.
      if (typeAheadTimer.current) clearTimeout(typeAheadTimer.current);
      typeAheadBuffer.current += key.toLowerCase();
      typeAheadTimer.current = setTimeout(() => {
        typeAheadBuffer.current = "";
      }, TYPE_AHEAD_RESET_MS);
      const query = typeAheadBuffer.current;
      const start = query.length === 1 ? index + 1 : index;
      for (let offset = 0; offset < visible.length; offset++) {
        const item = visible[(start + offset) % visible.length];
        if (item.node.name.toLowerCase().startsWith(query)) {
          focusItem(item.node.id);
          break;
        }
      }
    }
  };

  const renderItems = (list: TreeNode[], level: number) =>
    list.map((node, index) => {
      const open = node.isFolder && isOpen(node);
      const isInteractive = node.isFolder && node.openable;
      return (
        <StyledTreeItem
          key={node.id}
          role="treeitem"
          aria-level={level}
          aria-setsize={list.length}
          aria-posinset={index + 1}
          aria-expanded={node.isFolder ? open : undefined}
          tabIndex={node.id === activeId ? 0 : -1}
          ref={(element) => {
            if (element) itemRefs.current.set(node.id, element);
            else itemRefs.current.delete(node.id);
          }}
          onFocus={(event) => {
            // Focus events bubble through nested treeitems; without this a
            // child's focus would also mark every ancestor as focused.
            event.stopPropagation();
            setFocusedId(node.id);
          }}
        >
          {/* Safari does not reliably focus the item on click, so focus is
              set explicitly before toggling. */}
          <StyledTreeRow
            $isInteractive={isInteractive}
            onClick={(event) => {
              event.stopPropagation();
              focusItem(node.id);
              if (isInteractive) setOpen(node, !open);
            }}
          >
            {isInteractive ? (
              <StyledTreeChevron $isOpen={open} aria-hidden>
                <Icon name="ChevronRight" size={14} />
              </StyledTreeChevron>
            ) : (
              <StyledTreeSpacer aria-hidden />
            )}
            <StyledTreeIcon aria-hidden>
              <Icon
                name={node.isFolder ? (open ? "FolderOpen" : "Folder") : "File"}
                size={16}
              />
            </StyledTreeIcon>
            <StyledTreeName $isFolder={node.isFolder}>
              {node.name}
            </StyledTreeName>
          </StyledTreeRow>
          {node.isFolder && open && node.children.length > 0 && (
            <StyledTreeGroup role="group">
              {renderItems(node.children, level + 1)}
            </StyledTreeGroup>
          )}
        </StyledTreeItem>
      );
    });

  if (nodes.length === 0) return null;

  return (
    <StyledTree role="tree" aria-label="File tree" onKeyDown={handleKeyDown}>
      {renderItems(nodes, 1)}
    </StyledTree>
  );
}

export { Tree };
`;
