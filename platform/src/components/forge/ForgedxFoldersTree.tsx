"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LockGlyph, TreeTone } from "./widgets";

/**
 * ForgedxFoldersTree — the reference explorer's `sidebar-tree` custom element ported
 * to React with its accessibility model intact: role=tree/treeitem/group,
 * aria-level / aria-setsize / aria-posinset, aria-expanded + aria-owns,
 * aria-current="page", roving tabindex, Arrow/Home/End/* keyboard nav,
 * first-char typeahead, and the "/" search hotkey with the reference's
 * match / related / filtered filter states (min 3 chars).
 *
 * Per FORGED-FILE-STANDARD §7 the geometry and interaction model stay intact;
 * entries are the real ForgedxFolders folders (F0..F3, RocksDB, DuckDB, vendor,
 * quarantine, curation) with dynamic children from the engine.
 */

export interface TreeEntry {
  id: string;
  name: string;
  meta?: string;
  locked?: boolean;
}

export interface TreeNode {
  id: string;
  label: string;
  tone: TreeTone;
  count?: number;
  locked?: boolean;
  children?: TreeEntry[];
}

interface FlatItem {
  id: string;
  level: number;
  hasChildren: boolean;
  parentId: string | null;
  label: string;
  element: HTMLElement;
}

export function ForgedxFoldersTree({
  groups,
  activeId,
  onSelect,
}: {
  groups: TreeNode[][];
  activeId: string;
  onSelect: (node: { id: string; entryId?: string; locked?: boolean }) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [filtering, setFiltering] = useState(false);
  const currentFocus = useRef<HTMLElement | null>(null);

  const isExpanded = useCallback(
    (id: string) => {
      // effective expansion = user toggles + the active entry's folder path
      // (derived, no cascading setState effect needed)
      if (activeId.includes(":") && activeId.split(":")[0] === id) return true;
      return expanded.has(id);
    },
    [expanded, activeId],
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const ensureVisible = useCallback(
    (item: HTMLElement) => {
      let el: HTMLElement | null = item.parentElement;
      while (el && el !== rootRef.current) {
        if (el.matches("div[inert]")) {
          const wrapper = el;
          const owner = rootRef.current?.querySelector(`[aria-owns="${wrapper.querySelector("ul")?.id}"]`);
          if (owner instanceof HTMLElement) {
            const id = owner.dataset.nodeId;
            if (id) toggleExpanded(id);
          }
        }
        el = el.parentElement;
      }
    },
    [toggleExpanded],
  );

  const getVisibleItems = useCallback((): HTMLElement[] => {
    const root = rootRef.current;
    if (!root) return [];
    const out: HTMLElement[] = [];
    const walk = (container: Element) => {
      container.querySelectorAll(":scope > li > [role='treeitem']").forEach((item) => {
        out.push(item as HTMLElement);
        const id = (item as HTMLElement).dataset.nodeId;
        if (id && isExpanded(id)) {
          const group = root.querySelector(`#${CSS.escape(`tree-group-${id}`)}`);
          if (group) walk(group);
        }
      });
    };
    root.querySelectorAll("ul[role='tree']").forEach((t) => walk(t));
    return out;
  }, [isExpanded]);

  const focusItem = useCallback(
    (item: HTMLElement | null | undefined, updateTabindex = true) => {
      if (!item || !rootRef.current) return;
      if (updateTabindex) {
        rootRef.current.querySelectorAll("[role='treeitem']").forEach((el) => el.setAttribute("tabindex", "-1"));
      }
      item.setAttribute("tabindex", "0");
      item.focus();
      currentFocus.current = item;
    },
    [],
  );

  const activate = useCallback(
    (item: HTMLElement) => {
      rootRef.current?.querySelectorAll("[aria-current='page']").forEach((el) => el.removeAttribute("aria-current"));
      item.setAttribute("aria-current", "page");
      const id = item.dataset.nodeId;
      const entryId = item.dataset.entryId;
      const locked = item.dataset.locked === "true";
      if (id) onSelect({ id: entryId ? entryId.split(":")[0] : id, entryId, locked });
    },
    [onSelect],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const item = target.closest("[role='treeitem']") as HTMLElement | null;
      if (!item) return;
      const visible = getVisibleItems();
      const idx = visible.indexOf(item);
      const id = item.dataset.nodeId;
      const expandable = item.hasAttribute("aria-expanded");
      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          activate(item);
          break;
        case "ArrowDown":
          e.preventDefault();
          focusItem(visible[idx + 1]);
          break;
        case "ArrowUp":
          e.preventDefault();
          focusItem(visible[idx - 1]);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (expandable && id && !isExpanded(id)) toggleExpanded(id);
          else {
            const group = rootRef.current?.querySelector(`#${CSS.escape(`tree-group-${id}`)}`);
            const first = group?.querySelector("[role='treeitem']");
            if (first) focusItem(first as HTMLElement);
          }
          break;
        case "ArrowLeft": {
          e.preventDefault();
          if (expandable && id && isExpanded(id)) toggleExpanded(id);
          else {
            const parentGroup = item.closest("ul[role='group']") as HTMLElement | null;
            const owner = parentGroup?.id
              ? (rootRef.current?.querySelector(`[aria-owns="${CSS.escape(parentGroup.id)}"]`) as HTMLElement | null)
              : null;
            if (owner) focusItem(owner);
          }
          break;
        }
        case "Home":
          e.preventDefault();
          focusItem(visible[0]);
          break;
        case "End":
          e.preventDefault();
          focusItem(visible[visible.length - 1]);
          break;
        case "*":
          e.preventDefault();
          if (id) {
            const li = item.closest("li");
            const parent = li?.parentElement?.closest("li") ?? rootRef.current;
            parent?.querySelectorAll(":scope > li > [role='treeitem'][aria-expanded]").forEach((sib) => {
              const sid = (sib as HTMLElement).dataset.nodeId;
              if (sid && !isExpanded(sid)) toggleExpanded(sid);
            });
          }
          break;
        default:
          if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
            e.preventDefault();
            const ch = e.key.toLowerCase();
            for (let i = idx + 1; i < visible.length; i++) {
              if (visible[i].textContent?.toLowerCase().trim().startsWith(ch)) return focusItem(visible[i]);
            }
            for (let i = 0; i <= idx; i++) {
              if (visible[i].textContent?.toLowerCase().trim().startsWith(ch)) return focusItem(visible[i]);
            }
          }
      }
    },
    [activate, focusItem, getVisibleItems, isExpanded, toggleExpanded],
  );

  // "/" hotkey focuses search (reference behavior), Escape clears
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const editable = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable;
      if (e.key === "/" && !editable) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // filter: min 3 chars → match / related / filtered (reference semantics)
  const applyFilter = useCallback(
    (value: string) => {
      const root = rootRef.current;
      if (!root) return 0;
      const all = Array.from(root.querySelectorAll("[role='treeitem']")) as HTMLElement[];
      if (value.trim().length < 3) {
        all.forEach((el) => {
          el.removeAttribute("data-search-match");
          el.removeAttribute("data-search-related");
          el.removeAttribute("data-filtered");
        });
        root.removeAttribute("data-filtering");
        setFiltering(false);
        return 0;
      }
      root.setAttribute("data-filtering", "true");
      setFiltering(true);
      const term = value.toLowerCase();
      const matches = new Set<HTMLElement>();
      const related = new Set<HTMLElement>();
      all.forEach((el) => {
        if (el.textContent?.toLowerCase().includes(term)) {
          matches.add(el);
          el.setAttribute("data-search-match", "true");
          // ancestors related + expanded
          let p: HTMLElement | null = el.parentElement;
          while (p && p !== root) {
            if (p.matches("ul[role='group']")) {
              const owner = root.querySelector(`[aria-owns="${CSS.escape(p.id)}"]`) as HTMLElement | null;
              if (owner) {
                related.add(owner);
                const oid = owner.dataset.nodeId;
                if (oid && !isExpanded(oid)) toggleExpanded(oid);
              }
            }
            p = p.parentElement;
          }
          // descendants related + expanded
          const oid = el.dataset.nodeId;
          if (oid) {
            const group = root.querySelector(`#${CSS.escape(`tree-group-${oid}`)}`);
            if (group) {
              group.querySelectorAll("[role='treeitem']").forEach((d) => related.add(d as HTMLElement));
              if (!isExpanded(oid)) toggleExpanded(oid);
            }
          }
        }
      });
      all.forEach((el) => {
        if (matches.has(el)) {
          el.removeAttribute("data-filtered");
          el.removeAttribute("data-search-related");
        } else if (related.has(el)) {
          el.removeAttribute("data-filtered");
          el.removeAttribute("data-search-match");
          el.setAttribute("data-search-related", "true");
        } else {
          el.removeAttribute("data-search-match");
          el.removeAttribute("data-search-related");
          el.setAttribute("data-filtered", "true");
        }
      });
      return matches.size;
    },
    [isExpanded, toggleExpanded],
  );

  const onSearchChange = (v: string) => {
    setSearch(v);
    applyFilter(v);
  };

  const itemsIndex = useMemo(() => {
    // aria-setsize/posinset computed per level
    return groups;
  }, [groups]);

  function row(props: {
    nodeId: string;
    label: string;
    tone: TreeTone;
    count?: number;
    locked?: boolean;
    isEntry: boolean;
    hasChildren: boolean;
    isActive: boolean;
    expandedNow: boolean;
    level: number;
    setSize: number;
    posInSet: number;
    groupId?: string;
    metaText?: string;
    childRows?: React.ReactNode;
  }) {
    const { nodeId, label, tone, count, locked, isEntry, hasChildren, isActive, expandedNow, level, setSize, posInSet, groupId, metaText, childRows } = props;
    return (
      <li role="none" key={nodeId}>
        <a
          role="treeitem"
          href="#"
          data-node-id={nodeId}
          data-entry-id={isEntry ? nodeId : undefined}
          data-locked={locked ? "true" : undefined}
          tabIndex={isActive ? 0 : -1}
          aria-selected={isActive}
          aria-level={level}
          aria-setsize={setSize}
          aria-posinset={posInSet}
          aria-current={isActive ? "page" : undefined}
          aria-expanded={hasChildren ? expandedNow : undefined}
          aria-owns={groupId}
          onClick={(e) => {
            e.preventDefault();
            const el = e.currentTarget;
            if (locked) {
              activate(el);
              return;
            }
            if (hasChildren && (e.target as HTMLElement).closest(".tree-icon")) {
              toggleExpanded(nodeId);
            } else if (!hasChildren || !expandedNow) {
              activate(el);
            }
            if (hasChildren && !expandedNow) toggleExpanded(nodeId);
          }}
          className={locked ? "forge-locked" : undefined}
          style={{ display: "flex" }}
        >
          <span className={`forge-dot forge-dot--${tone}`} aria-hidden="true" />
          {locked && <LockGlyph />}
          <span className="tree-label">{label}</span>
          {metaText && <span className="tree-count">{metaText}</span>}
          {typeof count === "number" && <span className="tree-count">{count}</span>}
          {hasChildren && (
            <span className="tree-icon" aria-hidden="true" style={{ opacity: 0.5, fontSize: 11, lineHeight: 1 }}>
              {expandedNow ? "−" : "+"}
            </span>
          )}
        </a>
        {hasChildren && (
          <div inert={expandedNow ? undefined : true}>
            <ul role="group" id={groupId}>
              {childRows}
            </ul>
          </div>
        )}
      </li>
    );
  }

  function renderFolder(node: TreeNode, level: number, setSize: number, posInSet: number) {
    const hasChildren = (node.children?.length ?? 0) > 0;
    const expandedNow = hasChildren && isExpanded(node.id);
    return row({
      nodeId: node.id,
      label: node.label,
      tone: node.tone,
      count: node.count,
      locked: node.locked,
      isEntry: false,
      hasChildren,
      isActive: activeId === node.id,
      expandedNow,
      level,
      setSize,
      posInSet,
      groupId: hasChildren ? `tree-group-${node.id}` : undefined,
      childRows: hasChildren
        ? node.children!.map((c, i) => renderEntry(c, node.id, level + 1, node.children!.length, i + 1))
        : undefined,
    });
  }

  function renderEntry(e: TreeEntry, parentId: string, level: number, setSize: number, posInSet: number) {
    const nodeId = `${parentId}:${e.id}`;
    const tone: TreeTone = parentId === "skills" ? "orange" : parentId === "intelligence" ? "yellow" : "neutral";
    return row({
      nodeId,
      label: e.name,
      tone,
      locked: e.locked,
      isEntry: true,
      hasChildren: false,
      isActive: activeId === nodeId,
      expandedNow: false,
      level,
      setSize,
      posInSet,
      metaText: e.meta,
    });
  }

  return (
    <div className="forge-resize">
      <aside className="forge-aside">
        <header>
          <h1 className="forge-brand" style={{ margin: 0 }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M12 3v18M3 12h18" strokeLinecap="round" />
            </svg>
            <span>
              ForgedxFolders
              <small>Forged File Standard 1.0.0</small>
            </span>
          </h1>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="forge-search">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                ref={searchRef}
                id="tree-search"
                type="input"
                placeholder="search…"
                aria-label="Filter navigation tree"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.currentTarget.value = "";
                    onSearchChange("");
                  }
                }}
              />
              <kbd>/</kbd>
            </div>
          </form>
        </header>
        <nav aria-label="ForgedxFolders">
          <div className="forge-tree" ref={rootRef} role="tree" aria-label="ForgedxFolders" onKeyDown={onKeyDown}>
            <ul role="tree">
              {itemsIndex.map((group, gi) => (
                <li role="none" key={gi}>
                  <ul role="group" id={`tree-group-toplevel-${gi}`}>
                    {group.map((n, i) => renderFolder(n, 1, group.length, i + 1))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        {filtering && (
          <div className="forge-mono" style={{ padding: "8px 16px 14px", fontSize: 10, color: "var(--forge-muted)" }}>
            filter active — Esc clears
          </div>
        )}
      </aside>
    </div>
  );
}
