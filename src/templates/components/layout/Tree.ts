export const treeTemplate = `"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import type { TreeNode } from "@/components/layout/TreeData";

const TYPE_AHEAD_RESET_MS = 600;

interface FlatItem {
  node: TreeNode;
  parentId: string | null;
}

// Styles: .dcp-tree in app/styles/design.css.

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
        <li
          className="dcp-tree__item"
          key={node.id}
          // A file tree, not a selection widget: nothing is "selected", so
          // the items carry no aria-selected.
          // eslint-disable-next-line jsx-a11y/role-has-required-aria-props
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
              set explicitly before toggling. Keyboard users drive the tree
              through the treeitems' roving focus (handleKeyDown on the
              tree); the row's click is the pointer shortcut for the same
              toggle. */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <span
            className="dcp-tree__row"
            data-interactive={isInteractive || undefined}
            onClick={(event) => {
              event.stopPropagation();
              focusItem(node.id);
              if (isInteractive) setOpen(node, !open);
            }}
          >
            {isInteractive ? (
              <span
                className="dcp-tree__chevron"
                data-open={open || undefined}
                aria-hidden
              >
                <Icon name="ChevronRight" size={14} />
              </span>
            ) : (
              <span className="dcp-tree__spacer" aria-hidden />
            )}
            <span className="dcp-tree__icon" aria-hidden>
              <Icon
                name={node.isFolder ? (open ? "FolderOpen" : "Folder") : "File"}
                size={16}
              />
            </span>
            <span
              className="dcp-tree__name"
              data-folder={node.isFolder || undefined}
            >
              {node.name}
            </span>
          </span>
          {node.isFolder && open && node.children.length > 0 && (
            <ul className="dcp-tree__group" role="group">
              {renderItems(node.children, level + 1)}
            </ul>
          )}
        </li>
      );
    });

  if (nodes.length === 0) return null;

  return (
    <ul
      className="dcp-tree"
      role="tree"
      aria-label="File tree"
      onKeyDown={handleKeyDown}
    >
      {renderItems(nodes, 1)}
    </ul>
  );
}

export { Tree };
`;
