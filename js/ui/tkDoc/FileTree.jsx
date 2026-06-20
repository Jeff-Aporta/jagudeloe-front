import { getReact, getMaterialUI } from "../../core/platform.ts";
import { UI } from "../../core/platform.ts";
import { TK_DOC_RADIUS } from "../../core/tk-table.ts";
import { fileTreeToRenderRoot } from "../../core/tk-file-tree.ts";
import { glassInnerSx, useGlassColors } from "../glassSurface.ts";
import { latestTkCommit, tkCommitGithubBlobUrl } from "../tkCommitGithub.ts";

function iconForLeaf(name) {
  const lower = String(name ?? "").toLowerCase();
  if (lower === ".gitignore") return "mdi:file-hidden";
  if (lower.endsWith(".ts")) return "mdi:language-typescript";
  if (lower.endsWith(".json")) return "mdi:code-json";
  if (lower.endsWith(".sql")) return "mdi:database-outline";
  return "mdi:file-document-outline";
}

function buildTreeFromPaths(paths) {
  const root = { name: "", path: "", children: new Map(), isRoot: true };
  for (const raw of paths ?? []) {
    const parts = String(raw).split("/").filter(Boolean);
    let node = root;
    const acc = [];
    for (const part of parts) {
      acc.push(part);
      if (!node.children.has(part)) {
        node.children.set(part, { name: part, path: acc.join("/"), children: new Map() });
      }
      node = node.children.get(part);
      node.path = acc.join("/");
    }
  }
  return root;
}

function sortedChildren(node) {
  return [...(node.children?.values() ?? [])].sort((a, b) => {
    const aDir = (a.children?.size ?? 0) > 0;
    const bDir = (b.children?.size ?? 0) > 0;
    if (aDir !== bDir) return aDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function resolveHint(hints, node) {
  if (!hints || !node?.path) return "";
  const path = String(node.path);
  const name = String(node.name ?? "");
  return String(hints[path] ?? hints[name] ?? "").trim();
}

const ROW_SX = {
  py: 0,
  minHeight: 24,
  borderRadius: 0,
  "&:hover": { bgcolor: "action.hover" },
};

function LeafRow({ node, depth, hint, href }) {
  const { ListItemButton, ListItemIcon, ListItemText, Typography, Tooltip } = getMaterialUI();
  const { Icon } = UI;

  const row = (
    <ListItemButton
      dense
      component={href ? "a" : "div"}
      href={href || undefined}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      aria-label={hint || node.name}
      sx={{
        ...ROW_SX,
        pl: 1 + depth * 1.35,
        ...(href
          ? {
            cursor: "pointer",
            textDecoration: "none",
            color: "inherit",
            "&:hover .tk-file-tree-name": { color: "primary.main", textDecoration: "underline" },
          }
          : {}),
      }}
    >
      <ListItemIcon sx={{ minWidth: 22, color: "primary.main", opacity: 0.85 }}>
        <Icon icon={iconForLeaf(node.name)} size={15} />
      </ListItemIcon>
      <ListItemText
        disableTypography
        sx={{ my: 0 }}
        primary={(
          <Typography
            variant="body2"
            component="span"
            noWrap
            className="tk-file-tree-name"
            sx={{ fontFamily: "monospace", fontSize: "0.74rem", lineHeight: 1.25 }}
          >
            {node.name}
          </Typography>
        )}
      />
    </ListItemButton>
  );

  if (!hint) return row;

  return (
    <Tooltip
      title={hint}
      placement="top"
      arrow
      enterDelay={280}
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 440,
            lineHeight: 1.55,
            fontSize: "0.8rem",
            py: 1,
            px: 1.25,
          },
        },
      }}
    >
      {row}
    </Tooltip>
  );
}

function TreeBranch({ node, depth, hints, fileHref }) {
  const { useState } = getReact();
  const { List, ListItemButton, ListItemIcon, ListItemText, Collapse, Typography } = getMaterialUI();
  const { Icon } = UI;
  const hasKids = (node.children?.size ?? 0) > 0;
  const [open, setOpen] = useState(true);

  if (!hasKids) {
    const hint = resolveHint(hints, node);
    const href = fileHref?.(node);
    return <LeafRow node={node} depth={depth} hint={hint} href={href} />;
  }

  const kids = sortedChildren(node);

  return (
    <>
      <ListItemButton
        dense
        onClick={() => setOpen((v) => !v)}
        sx={{
          ...ROW_SX,
          pl: 1 + depth * 1.35,
        }}
      >
        <ListItemIcon sx={{ minWidth: 22, color: "warning.main", opacity: 0.9 }}>
          <Icon icon={open ? "mdi:folder-open-outline" : "mdi:folder-outline"} size={15} />
        </ListItemIcon>
        <ListItemText
          disableTypography
          sx={{ my: 0 }}
          primary={(
            <Typography
              variant="body2"
              component="span"
              noWrap
              sx={{
                fontWeight: depth === 0 ? 700 : 600,
                fontSize: depth === 0 ? "0.78rem" : "0.74rem",
                fontFamily: depth === 0 ? "inherit" : "monospace",
                lineHeight: 1.25,
              }}
            >
              {node.name}
            </Typography>
          )}
        />
      </ListItemButton>
      <Collapse in={open} unmountOnExit>
        <List disablePadding dense>
          {kids.map((child) => (
            <TreeBranch
              key={`${depth}-${child.path || child.name}`}
              node={child}
              depth={depth + 1}
              hints={hints}
              fileHref={fileHref}
            />
          ))}
        </List>
      </Collapse>
    </>
  );
}

/** Árbol de archivos modificados — clic abre el archivo en el commit más reciente del ticket. */
export function FileTree({
  spec,
  paths,
  rootLabel = "ISS",
  hints,
  commits,
  commitHash,
  commitProyecto,
}) {
  const { Box, List, Typography, Paper } = getMaterialUI();
  const c = useGlassColors();

  const root = spec
    ? fileTreeToRenderRoot(spec)
    : (() => {
      const built = buildTreeFromPaths(paths);
      return { name: rootLabel, path: "", children: built.children, isRoot: true };
    })();

  const headerTitle = String(spec?.title ?? "").trim() || "Archivos modificados";
  const label = spec?.rootLabel ?? rootLabel;

  const latest = latestTkCommit(commits ?? []);
  const hash = String(commitHash ?? spec?.commitHash ?? latest?.hash ?? "").trim();
  const proyecto = String(commitProyecto ?? spec?.commitProyecto ?? latest?.proyecto ?? label).trim();

  const fileHref = hash
    ? (node) => {
      const path = String(node?.path ?? "").trim();
      if (!path) return "";
      return tkCommitGithubBlobUrl(proyecto, hash, path);
    }
    : undefined;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: TK_DOC_RADIUS,
        borderColor: c.border,
        overflow: "hidden",
        ...glassInnerSx(c, "node"),
      }}
    >
      <Box sx={{ px: 1.5, py: 0.65, borderBottom: 1, borderColor: "divider", bgcolor: "action.hover" }}>
        <Typography
          variant="caption"
          fontWeight={700}
          color="text.secondary"
          sx={{ letterSpacing: 0.4, textTransform: "uppercase", lineHeight: 1.2 }}
        >
          {headerTitle}
        </Typography>
      </Box>
      <List dense disablePadding sx={{ py: 0.25 }}>
        <TreeBranch node={root} depth={0} hints={hints} fileHref={fileHref} />
      </List>
    </Paper>
  );
}
