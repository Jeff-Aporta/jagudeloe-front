/** Especificación JSON → intérprete árbol de archivos TK (TK_CONTENT kind=file-tree). */

import { TK1437191_ARCHIVOS } from "./tk-doc-table.ts";

export interface FileTreeNode {
  name: string;
  path?: string;
  hint?: string;
  icon?: string;
  children?: FileTreeNode[];
}

export interface FileTreeSpec {
  title?: string;
  rootLabel?: string;
  commitHash?: string;
  commitProyecto?: string;
  tree: FileTreeNode[];
  hints?: Record<string, string>;
}

/** Nodo interno para render MUI (Map de hijos). */
export interface FileTreeRenderNode {
  name: string;
  path: string;
  children: Map<string, FileTreeRenderNode>;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function readNode(raw: Record<string, unknown>): FileTreeNode {
  const childrenRaw = raw.children as Record<string, unknown>[] | undefined;
  const children = Array.isArray(childrenRaw) ? childrenRaw.map(readNode) : undefined;
  return {
    name: String(raw.name ?? raw.label ?? ""),
    path: raw.path != null ? String(raw.path) : undefined,
    hint: raw.hint != null ? String(raw.hint) : raw.note != null ? String(raw.note) : undefined,
    icon: raw.icon != null ? String(raw.icon) : undefined,
    children: children?.length ? children : undefined,
  };
}

function sortTreeNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  return [...nodes].sort((a, b) => {
    const aDir = (a.children?.length ?? 0) > 0;
    const bDir = (b.children?.length ?? 0) > 0;
    if (aDir !== bDir) return aDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/** Convierte rutas planas (`schema/foo.sql`) a árbol JSON canónico. */
export function pathsToTreeNodes(
  paths: string[],
  hints: Record<string, string> = {},
): FileTreeNode[] {
  const tree: FileTreeNode[] = [];

  function insert(nodes: FileTreeNode[], parts: string[], fullPath: string) {
    if (!parts.length) return;
    const [head, ...rest] = parts;
    let node = nodes.find((n) => n.name === head);
    if (!node) {
      node = { name: head };
      if (rest.length === 0) {
        node.path = fullPath;
        if (hints[fullPath]) node.hint = hints[fullPath];
      } else {
        node.children = [];
      }
      nodes.push(node);
    }
    if (rest.length > 0) {
      if (!node.children) node.children = [];
      insert(node.children, rest, fullPath);
    }
  }

  for (const raw of paths ?? []) {
    const fullPath = String(raw).trim();
    if (!fullPath) continue;
    insert(tree, fullPath.split("/").filter(Boolean), fullPath);
  }

  function sortRecursive(nodes: FileTreeNode[]): FileTreeNode[] {
    return sortTreeNodes(nodes).map((n) => ({
      ...n,
      children: n.children?.length ? sortRecursive(n.children) : undefined,
    }));
  }

  return sortRecursive(tree);
}

function mergeHints(spec: FileTreeSpec): Record<string, string> {
  const hints: Record<string, string> = { ...(spec.hints ?? {}) };

  function walk(nodes: FileTreeNode[]) {
    for (const n of nodes) {
      const path = String(n.path ?? "").trim();
      if (path && n.hint) hints[path] = n.hint;
      if (n.children?.length) walk(n.children);
    }
  }

  walk(spec.tree);
  return hints;
}

function renderNodeFromSpec(node: FileTreeNode, accPath: string): FileTreeRenderNode {
  const path = node.path ?? (accPath ? `${accPath}/${node.name}` : node.name);
  const children = new Map<string, FileTreeRenderNode>();
  for (const child of sortTreeNodes(node.children ?? [])) {
    const childPath = node.path ? path : (accPath ? `${accPath}/${node.name}` : node.name);
    const nextAcc = node.path ? path : childPath;
    children.set(child.name, renderNodeFromSpec(child, nextAcc));
  }
  return {
    name: node.name,
    path: node.path ?? (node.children?.length ? "" : path),
    children,
  };
}

/** Árbol JSON → modelo de render (Map) para FileTree MUI. */
export function fileTreeToRenderRoot(spec: FileTreeSpec): FileTreeRenderNode {
  const rootChildren = new Map<string, FileTreeRenderNode>();
  for (const child of sortTreeNodes(spec.tree)) {
    rootChildren.set(child.name, renderNodeFromSpec(child, ""));
  }
  return {
    name: spec.rootLabel ?? "ISS",
    path: "",
    children: rootChildren,
  };
}

export function fileTreeSpecFromPayload(payload: unknown): FileTreeSpec | null {
  const p = asRecord(payload);
  const nested = asRecord(p.fileTree ?? p);

  if (Array.isArray(p.tree) && p.tree.length) {
    return {
      title: String(p.title ?? nested.title ?? ""),
      rootLabel: String(p.rootLabel ?? p.root ?? nested.rootLabel ?? "ISS"),
      commitHash: p.commitHash != null ? String(p.commitHash) : undefined,
      commitProyecto: p.commitProyecto != null ? String(p.commitProyecto) : undefined,
      tree: (p.tree as Record<string, unknown>[]).map(readNode),
      hints: asRecord(p.hints ?? p.notes) as Record<string, string>,
    };
  }

  if (Array.isArray(nested.tree) && nested.tree.length) {
    return {
      title: String(nested.title ?? p.title ?? ""),
      rootLabel: String(nested.rootLabel ?? p.rootLabel ?? p.root ?? "ISS"),
      commitHash: nested.commitHash != null ? String(nested.commitHash) : undefined,
      commitProyecto: nested.commitProyecto != null ? String(nested.commitProyecto) : undefined,
      tree: (nested.tree as Record<string, unknown>[]).map(readNode),
      hints: asRecord(nested.hints ?? p.hints ?? p.notes) as Record<string, string>,
    };
  }

  const paths = (p.paths ?? p.files ?? nested.paths) as string[] | undefined;
  if (Array.isArray(paths) && paths.length) {
    const hints = asRecord(p.hints ?? p.notes ?? nested.hints) as Record<string, string>;
    return {
      title: String(p.title ?? nested.title ?? ""),
      rootLabel: String(p.rootLabel ?? p.root ?? nested.rootLabel ?? "ISS"),
      commitHash: p.commitHash != null ? String(p.commitHash) : undefined,
      commitProyecto: p.commitProyecto != null ? String(p.commitProyecto) : undefined,
      tree: pathsToTreeNodes(paths, hints),
      hints,
    };
  }

  return null;
}

/** Archivos tocados TK-1437191 — ISS-AyudasCPIA. */
export function tk1437191FileTreeSpec(): FileTreeSpec {
  const hints = Object.fromEntries(TK1437191_ARCHIVOS.map((f) => [f.path, f.hint]));
  return {
    title: "Árbol de cambios",
    rootLabel: "ISS-AyudasCPIA",
    tree: pathsToTreeNodes(TK1437191_ARCHIVOS.map((f) => f.path), hints),
    hints,
  };
}

export { mergeHints as fileTreeHintsFromSpec };
