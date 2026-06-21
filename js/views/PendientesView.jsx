/* views/PendientesView — commits ISS sin ticket real, agrupados en TK-XXXXN por dominio. */
import { getReact, getMaterialUI } from "../core/platform.ts";
import { UI } from "../core/platform.ts";
import { merge, boot } from "../core/urlState.ts";
import { getPendientes } from "../api/client.ts";
import { CommitsTable } from "../ui/tkDoc/CommitsTable.jsx";
import { tkDocSurfaceSx } from "../ui/tkDocSurface.ts";
import { roundTkMinutosTo5 } from "../core/tk-table.ts";

const navPanelSx = { width: 280, borderRight: 1, borderColor: "divider", bgcolor: "background.paper" };
const PENDIENTE_RE = /^TK-XXXX\d+$/i;

function pendienteId(p) {
  return String(p?.iticket ?? "").trim().toUpperCase();
}

function PendienteRow({ row, selected, onSelect }) {
  const { ListItemButton, ListItemText, Box, Tooltip } = getMaterialUI();
  const id = pendienteId(row);
  const title = String(row.titulo || "").trim();
  const minutos = Number(row.commitMinutos) || 0;
  const count = Number(row.commitCount) || 0;
  const minLabel = minutos > 0 ? `${roundTkMinutosTo5(minutos)} min` : null;
  const countLabel = count === 1 ? "1 commit" : `${count} commits`;
  const ellipsisSx = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" };
  const inner = (
    <ListItemButton
      selected={selected}
      onClick={() => onSelect(id)}
      sx={{ alignItems: "center", py: 0.75, gap: 1, overflow: "hidden", minWidth: 0, width: "100%" }}
    >
      <ListItemText
        primary={(
          <Box component="span" sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1, minWidth: 0 }}>
            <Box component="span" sx={{ ...ellipsisSx, fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{id}</Box>
            {minLabel && (
              <Box component="span" sx={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "text.secondary" }}>{minLabel}</Box>
            )}
          </Box>
        )}
        secondary={title || countLabel}
        sx={{ minWidth: 0, my: 0, overflow: "hidden", flex: 1, "& .MuiListItemText-secondary": ellipsisSx }}
        secondaryTypographyProps={{ fontSize: 11, ...ellipsisSx }}
      />
    </ListItemButton>
  );
  const tip = [title, countLabel, minLabel].filter(Boolean).join(" · ");
  return tip ? (
    <Tooltip title={tip} placement="right" enterDelay={400}>
      <Box component="div" sx={{ display: "block", minWidth: 0, overflow: "hidden" }}>{inner}</Box>
    </Tooltip>
  ) : inner;
}

function PendienteDetail({ row }) {
  const { Stack, Typography, Chip, Box } = getMaterialUI();
  const id = pendienteId(row);
  const commits = row.commits || [];
  return (
    <Stack spacing={2} sx={{ p: 2, flex: 1, minHeight: 0, overflow: "auto" }}>
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <Typography variant="h6" component="h1" sx={{ fontFamily: "monospace", fontSize: 18 }}>{id}</Typography>
          <Chip size="small" label="En espera" color="warning" variant="outlined" />
          {row.dominio && <Chip size="small" label={String(row.dominio)} variant="outlined" />}
        </Stack>
        {row.titulo && (
          <Typography variant="subtitle1" fontWeight={600}>{row.titulo}</Typography>
        )}
        {row.resumen && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>{row.resumen}</Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          Commits del repositorio ISS-AyudasCPIA vinculados temporalmente a este placeholder hasta crear el ticket InSoft definitivo.
        </Typography>
      </Stack>
      <Box className="tk-doc-web-surface" sx={tkDocSurfaceSx()}>
        {commits.length ? <CommitsTable commits={commits} /> : (
          <Typography color="text.secondary" sx={{ p: 2 }}>Sin commits en este dominio.</Typography>
        )}
      </Box>
    </Stack>
  );
}

export function PendientesView(props) {
  const { useState, useEffect, useRef } = getReact();
  const { Box, Typography, Alert, CircularProgress, List } = getMaterialUI();
  const { ErrorBox } = UI;

  const bootSelRef = useRef(typeof boot.sel === "string" && PENDIENTE_RE.test(boot.sel) ? boot.sel.toUpperCase() : null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: null });
  const [selected, setSelected] = useState(bootSelRef.current);

  useEffect(() => {
    merge({ sub: "pendientes", tkTab: undefined });
  }, []);

  useEffect(() => {
    if (props.project === "general") {
      setRows([]);
      setStatus({ loading: false, error: null });
      return undefined;
    }
    let alive = true;
    setStatus({ loading: true, error: null });
    getPendientes(props.project)
      .then((d) => {
        if (!alive) return;
        const list = (d?.rows || []).filter((r) => Number(r.commitCount) > 0);
        setRows(list);
        setStatus({ loading: false, error: null });
      })
      .catch((e) => {
        if (!alive) return;
        setStatus({ loading: false, error: e instanceof Error ? e.message : String(e) });
      });
    return () => { alive = false; };
  }, [props.project, props.reloadKey]);

  useEffect(() => {
    if (!rows.length) return;
    const pref = bootSelRef.current;
    if (pref) {
      bootSelRef.current = null;
      if (rows.some((r) => pendienteId(r) === pref)) { setSelected(pref); return; }
    }
    if (!selected || !rows.some((r) => pendienteId(r) === selected)) setSelected(pendienteId(rows[0]));
  }, [rows]);

  if (props.project === "general") {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">Selecciona PatyIA o Clientes para ver commits pendientes de ticket.</Typography>
      </Box>
    );
  }

  const navBody = status.loading ? (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 3, color: "text.secondary" }}>
      <CircularProgress size={20} />
    </Box>
  ) : status.error ? (
    <Box sx={{ p: 1.5 }}>{ErrorBox ? <ErrorBox message={status.error} /> : <Alert severity="error">{status.error}</Alert>}</Box>
  ) : !rows.length ? (
    <Typography color="text.secondary" sx={{ p: 2, fontSize: 13 }}>Sin commits pendientes en {props.project}.</Typography>
  ) : (
    <List dense disablePadding>
      {rows.map((r) => {
        const id = pendienteId(r);
        return <PendienteRow key={id} row={r} selected={selected === id} onSelect={(sid) => { setSelected(sid); merge({ sel: sid }); }} />;
      })}
    </List>
  );

  const active = rows.find((r) => pendienteId(r) === selected);

  return (
    <Box className="isa-view-split">
      <Box className="isa-view-split__nav" sx={{ ...navPanelSx, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box sx={{ px: 1.5, py: 1, flexShrink: 0, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary">
            Dominios temporales (TK-XXXXN) — no aparecen en Tickets hasta asignar TK real.
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{navBody}</Box>
      </Box>
      <Box className="isa-view-split__main">
        {active ? <PendienteDetail row={active} /> : (
          <Typography color="text.secondary" sx={{ p: 2 }}>Selecciona un dominio pendiente.</Typography>
        )}
      </Box>
    </Box>
  );
}

export default PendientesView;
