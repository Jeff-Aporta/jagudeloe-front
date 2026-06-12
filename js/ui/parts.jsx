/* ui/parts — componentes compartidos para las vistas jagudeloe. */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI, Session } from "../core/platform.ts";
import { getRevisadoMap, setCheck, execSql } from "../api/client.ts";
import { getRealtimeConstants } from "../core/isa-front.ts";

const CLAMP1 = { display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.25, minWidth: 0 };
const CLAMP2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "normal", lineHeight: 1.25 };

export function CheckDot(props) {
  const { Tooltip, Box } = getMaterialUI();
  const state = props.state;
  if (!state) return null;
  const palette = { complete: { bg: "#4caf50", title: "Todo revisado / ejecutado" }, partial: { bg: "#ff9800", title: "Revisión parcial" }, none: { bg: "#f44336", title: "Sin revisar" } };
  const p = palette[state] || palette.none;
  return (
    <Tooltip title={p.title}>
      <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.bg, flexShrink: 0, display: "inline-block", boxShadow: state === "partial" ? "0 0 0 2px rgba(255,152,0,0.25)" : "none" }} aria-hidden />
    </Tooltip>
  );
}

export function MockBanner() {
  const { Alert, Typography } = getMaterialUI();
  const { Icon } = UI;
  return (
    <Alert severity="warning" variant="outlined" icon={<Icon icon="mdi:flask-outline" />} sx={{ mb: 2, borderStyle: "dashed" }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>Datos de ejemplo (MOCKUP)</Typography>
      <Typography variant="caption" color="text.secondary">El backend no respondió; se muestran ejemplos genéricos para ilustrar la interfaz.</Typography>
    </Alert>
  );
}

export function AccordionPanel(props) {
  const { Accordion, AccordionSummary, AccordionDetails, Typography, Chip } = getMaterialUI();
  const { Icon } = UI;
  const level = props.level || 0;
  const controlled = typeof props.expanded === "boolean";
  const tint = level === 0 ? "transparent" : "rgba(30,144,255," + (0.04 + level * 0.03) + ")";
  const extra = controlled ? { expanded: props.expanded, onChange: () => props.onToggle && props.onToggle() } : { defaultExpanded: props.defaultExpanded != null ? props.defaultExpanded : level === 0 };
  return (
    <Accordion id={props.nodeId} disableGutters elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 1, bgcolor: tint, "&:before": { display: "none" } }} {...extra}>
      <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />} sx={{ "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1, my: 1 } }}>
        {props.icon && <Icon icon={props.icon} />}
        <Typography sx={{ fontWeight: level === 0 ? 700 : 600, flexGrow: 1 }}>{props.title}</Typography>
        {props.secondary && <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>{props.secondary}</Typography>}
        {props.count != null && <Chip size="small" label={props.count} />}
      </AccordionSummary>
      <AccordionDetails sx={{ pl: level === 0 ? 2 : 1.5 }}>{props.children}</AccordionDetails>
    </Accordion>
  );
}

export function MonthTree(props) {
  const { useState, Fragment } = getReact();
  const { Typography, List, ListItemButton, ListItemText, Chip, Collapse, Box } = getMaterialUI();
  const { Icon } = UI;
  const firstOpen = props.groups.length ? props.groups[0].id : "";
  const [open, setOpen] = useState({ [firstOpen]: true });
  if (!props.groups.length) return <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{props.emptyLabel || "Sin elementos."}</Typography>;
  return (
    <List dense disablePadding>
      {props.groups.map((g) => {
        const isOpen = !!open[g.id];
        return (
          <Fragment key={g.id}>
            <ListItemButton onClick={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))} sx={{ py: 0.25 }}>
              <Icon icon={isOpen ? "mdi:folder-open-outline" : "mdi:folder-outline"} size={18} />
              <ListItemText primary={g.label} sx={{ ml: 1 }} primaryTypographyProps={{ fontWeight: 600, variant: "body2" }} />
              {g.count != null && <Chip size="small" label={g.count} sx={{ mr: 0.5 }} />}
              <Icon icon={isOpen ? "mdi:chevron-down" : "mdi:chevron-right"} size={18} />
            </ListItemButton>
            <Collapse in={isOpen} unmountOnExit>
              <List dense disablePadding>
                {g.items.map((it) => (
                  <ListItemButton key={it.id} selected={props.selectedId === it.id} onClick={() => props.onSelect(it.id)} sx={{ pl: 4, py: 0.25 }}>
                    <Icon icon="mdi:file-document-outline" size={16} style={{ opacity: 0.7 }} />
                    <ListItemText primary={it.label} secondary={it.secondary} sx={{ ml: 1 }} primaryTypographyProps={{ variant: "body2", noWrap: true }} secondaryTypographyProps={{ variant: "caption", noWrap: true }} />
                    {it.color && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: it.color }} />}
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Fragment>
        );
      })}
    </List>
  );
}

export function monthLabel(ym) {
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const m = /^(\d{4})-(\d{2})/.exec(ym);
  if (!m) return ym;
  const idx = parseInt(m[2], 10) - 1;
  return ym + " — " + (meses[idx] ? meses[idx][0].toUpperCase() + meses[idx].slice(1) + " " + m[1] : ym);
}

export function DateTree(props) {
  const { useState, Fragment } = getReact();
  const { Typography, List, ListItemButton, ListItemText, Chip, Box, Tooltip } = getMaterialUI();
  const { Icon } = UI;
  const tree = {};
  props.items.forEach((it) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(it.date || "");
    const y = m ? m[1] : "----", mo = m ? m[2] : "--", d = m ? m[3] : "--";
    const yy = (tree[y] = tree[y] || {}), mm = (yy[mo] = yy[mo] || {});
    (mm[d] = mm[d] || []).push(it);
  });
  const years = Object.keys(tree).sort().reverse();
  const RECENT_DAYS = 15;
  const initial = {};
  Array.from(new Set(props.items.map((it) => it.date).filter(Boolean))).sort().reverse().slice(0, RECENT_DAYS).forEach((dt) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dt);
    if (!m) return;
    initial[m[1]] = true;
    initial[m[1] + "/" + m[2]] = true;
    if (props.mode === "items") initial[m[1] + "/" + m[2] + "/" + m[3]] = true;
  });
  const [open, setOpen] = useState(initial);
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  if (!years.length) return <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{props.emptyLabel || "Sin elementos."}</Typography>;

  function folderRow(key, label, depth, count, isOpen) {
    return (
      <ListItemButton onClick={() => toggle(key)} sx={{ pl: 1 + depth * 1.5, py: 0.25 }}>
        <Icon icon={isOpen ? "mdi:folder-open-outline" : "mdi:folder-outline"} size={17} />
        <ListItemText primary={label} sx={{ ml: 1 }} primaryTypographyProps={{ fontWeight: 600, variant: "body2" }} />
        {count != null && <Chip size="small" label={count} sx={{ mr: 0.5, height: 18 }} />}
        <Icon icon={isOpen ? "mdi:chevron-down" : "mdi:chevron-right"} size={16} />
      </ListItemButton>
    );
  }

  function leafLine(it, label) {
    if (props.mode === "day" && it.secondary) return label + " · " + it.secondary;
    return it.label || label;
  }

  function leafRow(it, label, depth) {
    const line = leafLine(it, label);
    const tip = it.secondary && props.mode !== "day" ? line + " — " + it.secondary : line;
    return (
      <Tooltip key={it.id} title={tip} placement="right" enterDelay={400}>
        <ListItemButton selected={props.selectedId === it.id} onClick={() => props.onSelect(it.id)} sx={{ pl: 1 + depth * 1.5, py: 0.35, alignItems: "center", minHeight: 36 }}>
          {it.dotState && <Box sx={{ mr: 0.75, display: "flex", alignItems: "center", flexShrink: 0 }}><CheckDot state={it.dotState} /></Box>}
          <Icon icon="mdi:file-document-outline" size={15} style={{ opacity: 0.7, flexShrink: 0 }} />
          <ListItemText primary={line} sx={{ ml: 1, minWidth: 0, flex: 1, my: 0 }} primaryTypographyProps={{ variant: "body2", sx: CLAMP1 }} />
        </ListItemButton>
      </Tooltip>
    );
  }

  const rows = [];
  years.forEach((y) => {
    const yOpen = !!open[y];
    const yCount = y === "----"
      ? Object.values(tree[y]).reduce((a, mo) => a + Object.values(mo).reduce((b, ds) => b + ds.length, 0), 0)
      : props.items.filter((it) => (it.date || "").startsWith(y)).length;
    rows.push(<Fragment key={"y-" + y}>{folderRow(y, y, 0, yCount, yOpen)}</Fragment>);
    if (!yOpen) return;
    Object.keys(tree[y]).sort().reverse().forEach((mo) => {
      const mKey = y + "/" + mo, mOpen = !!open[mKey];
      const days = Object.keys(tree[y][mo]).sort().reverse();
      const mCount = days.reduce((a, d) => a + tree[y][mo][d].length, 0);
      rows.push(<Fragment key={"m-" + mKey}>{folderRow(mKey, mo, 1, mCount, mOpen)}</Fragment>);
      if (!mOpen) return;
      days.forEach((d) => {
        const dItems = tree[y][mo][d];
        if (props.mode === "day") rows.push(leafRow(dItems[0], d, 2));
        else {
          const dKey = mKey + "/" + d, dOpen = !!open[dKey];
          rows.push(<Fragment key={"d-" + dKey}>{folderRow(dKey, d, 2, dItems.length, dOpen)}</Fragment>);
          if (dOpen) dItems.forEach((it) => rows.push(leafRow(it, it.label || it.id, 3)));
        }
      });
    });
  });

  return (
    <List dense disablePadding>
      {rows}
    </List>
  );
}

export function RevisadoCheck(props) {
  const { useState, useEffect } = getReact();
  const { Tooltip, Checkbox, Typography } = getMaterialUI();
  const { isLoggedIn } = Session;
  if (!props.revisadoKey) return null;
  const key = props.revisadoKey;
  const [checked, setChecked] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getRevisadoMap(props.project).then((m) => { if (alive) setChecked(!!m[key]); }).catch(() => { if (alive) setChecked(false); });
    return () => { alive = false; };
  }, [props.project, key, props.reloadKey]);

  useEffect(() => {
    function onLocal(e) { const k = e.detail?.revisadoKey; if (k !== key) return; getRevisadoMap(props.project, true).then((m) => setChecked(!!m[key])); }
    window.addEventListener("isaj:checks-local", onLocal);
    return () => window.removeEventListener("isaj:checks-local", onLocal);
  }, [props.project, key]);

  useEffect(() => {
    const { REALTIME, REALTIME_EVENT } = getRealtimeConstants();
    function onRemote(e) {
      const msg = e.detail;
      if (!msg || msg.type !== REALTIME.CHECKS_UPDATED) return;
      if (msg.revisadoKey !== key) return;
      if (msg.project && msg.project !== props.project) return;
      getRevisadoMap(props.project, true).then((m) => setChecked(!!m[key]));
    }
    window.addEventListener(REALTIME_EVENT, onRemote);
    window.addEventListener("isaj:checks-sync", onRemote);
    return () => { window.removeEventListener(REALTIME_EVENT, onRemote); window.removeEventListener("isaj:checks-sync", onRemote); };
  }, [props.project, key]);

  const canEdit = isLoggedIn?.();
  function toggleCheck() {
    if (!canEdit || busy || checked === null) return;
    const next = !checked;
    setBusy(true);
    try { window.dispatchEvent(new CustomEvent("isaj:checks-local", { detail: { revisadoKey: key } })); } catch { /* ignore */ }
    setCheck(props.project, key, next).then(() => {
      setChecked(next);
      try { window.dispatchEvent(new CustomEvent("isaj:checks-sync", { detail: { type: "checks.updated", project: props.project, revisadoKey: key, checked: next } })); } catch { /* ignore */ }
    }).finally(() => setBusy(false));
  }

  return (
    <Tooltip title={canEdit ? (props.hint || "Marcar revisado y ejecutado") : "Inicia sesión para marcar"}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Checkbox size="small" checked={!!checked} disabled={!canEdit || busy || checked === null} onChange={toggleCheck} inputProps={{ "aria-label": props.label || "Revisado" }} />
        {props.showLabel !== false && <Typography component="span" variant="caption" color="text.secondary" sx={{ userSelect: "none" }}>{props.label || "Revisado"}</Typography>}
      </span>
    </Tooltip>
  );
}

export function canExecSql() {
  const { isLoggedIn, can } = Session;
  if (!isLoggedIn?.()) return false;
  if (typeof can === "function") return can("ejecutar_sql") || can("ejecutar_mssql") || can("guardar_langlab");
  return true;
}

export function SqlBlock(props) {
  const { useRef, useState, useEffect } = getReact();
  const { Box, Stack, Typography, Chip, Tooltip, Button, Alert } = getMaterialUI();
  const { Icon } = UI;
  const ref = useRef(null);
  const cm = useRef(null);
  const [exec, setExec] = useState(false);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  const CM = window.CodeMirror;
  const db = props.dbTarget || (props.project === "clientesis" ? "clientesis" : "paty");
  const allowed = canExecSql();

  useEffect(() => {
    if (ref.current && CM && !cm.current) {
      cm.current = CM(ref.current, { value: props.sql, mode: "text/x-sql", theme: "dracula", lineNumbers: true, readOnly: true, viewportMargin: Infinity });
      setTimeout(() => cm.current && cm.current.refresh(), 30);
    } else if (!CM && ref.current) {
      ref.current.innerHTML = "";
      const pre = document.createElement("pre");
      pre.className = "sql-body";
      pre.textContent = props.sql;
      ref.current.appendChild(pre);
    }
  }, []);

  function run() {
    if (!allowed) return;
    setExec(true); setErr(null); setRes(null);
    execSql(props.project, { sql: props.sql, dbTarget: db, segmentId: props.segmentId })
      .then((d) => setRes({ rows: d && d.rows, rowCount: d && (d.rowCount ?? (d.rows ? d.rows.length : undefined)) }))
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setExec(false));
  }

  return (
    <Box sx={{ my: 1.5, border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ p: 1, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" }}>
        <Icon icon="mdi:database-search-outline" />
        <Typography variant="subtitle2" sx={{ flex: 1, minWidth: 120 }}>{props.title || "Consulta SQL"}</Typography>
        <Chip size="small" color={db === "clientesis" ? "secondary" : "primary"} variant="outlined" label={"BD: " + db} />
        {props.checkKey && <RevisadoCheck project={props.project} revisadoKey={props.checkKey} reloadKey={props.reloadKey} label="Revisado" hint="Marcar como revisado y ejecutado (BITACORA_REVISADO)" showLabel />}
        <Tooltip title={allowed ? ("Ejecutar en " + db) : "Inicia sesión con un perfil autorizado para ejecutar"}>
          <span><Button size="small" variant="contained" disabled={!allowed || exec} startIcon={<Icon icon="mdi:play" />} onClick={run}>{exec ? "Ejecutando…" : "Ejecutar"}</Button></span>
        </Tooltip>
      </Stack>
      <Box ref={ref} className="sql-cm sql-cm-scroll" />
      {res && <Alert severity="success" sx={{ m: 1 }}>{"Ejecución correcta" + (res.rowCount != null ? " — " + res.rowCount + " fila(s)" : "")}</Alert>}
      {err && <Alert severity="error" sx={{ m: 1 }}>{err}</Alert>}
    </Box>
  );
}
