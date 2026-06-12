/* views/BitacoraView — bitácora de un space (o General = PatyIA + Clientes consolidados). */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";
import { merge, subscribe, boot } from "../core/urlState.ts";
import { getBitacora, getRevisadoMap } from "../api/client.ts";
import { aggregateDotState, collectSqlCheckKeys } from "../core/checks.ts";
import { getRealtimeConstants } from "../core/isa-front.ts";
import {
  mergeBitacoraBundles,
  segmentProject,
  reDate,
  spacesFor,
  projectLabel,
} from "../core/bitacora-merge.ts";
import { isGeneralProject } from "../core/tk-spaces.ts";
import { DateTree, SqlBlock, VideoBlock } from "../ui/parts.jsx";
import { BitacoraTodoList } from "../ui/BitacoraTodoList.jsx";
import { renderBitacoraMarkdown, stripTodoCheckboxesFromMarkdown } from "../core/bitacora-md.ts";

const clamp2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 };

/** API legacy devuelve md/sql/video; el front espera segments. */
function normalizeBitacoraData(data) {
  if (!data) return data;
  if (data.segments && Object.keys(data.segments).length) return data;
  const segments = Object.assign({}, data.md || {}, data.sql || {}, data.video || {});
  return Object.assign({}, data, { segments });
}

function resolveSelFromUrl(days) {
  const sel = typeof boot.sel === "string" ? boot.sel.trim() : "";
  if (sel && days.some((d) => d.id === sel)) return sel;
  return days[0]?.id ?? null;
}

function countVideoLeaves(nodes) {
  let n = 0;
  const walk = (list) => {
    (list || []).forEach((node) => {
      if (!node) return;
      if (node.type === "video") n += 1;
      else if (node.children?.length) walk(node.children);
    });
  };
  walk(nodes);
  return n;
}

function renderNode(node, segments, project, key, depth, reloadKey, fillHeight, onSegmentTodos) {
  const { Box, Typography } = getMaterialUI();
  if (!node) return null;
  const segProject = node._space || segmentProject(node.segmentId, project);
  if (node.type === "md") {
    const seg = segments[node.segmentId] || {};
    const raw = seg.markdown || seg.md || seg.body || "";
    const mdStr = typeof raw === "string" ? raw : String(raw);
    const todos = Array.isArray(seg.todos) ? seg.todos : [];
    const mdWithoutTodos = stripTodoCheckboxesFromMarkdown(mdStr);
    const hadCheckboxes = mdStr !== mdWithoutTodos;
    const html = mdWithoutTodos ? renderBitacoraMarkdown(mdWithoutTodos) : "";
    return (
      <Box key={key} sx={{ my: 1 }}>
        {(todos.length > 0 || hadCheckboxes) && (
          <BitacoraTodoList
            project={segProject}
            segmentId={node.segmentId}
            todos={todos}
            reloadKey={reloadKey}
            onChange={(next) => onSegmentTodos && onSegmentTodos(node.segmentId, next)}
          />
        )}
        {html ? <Box className="md-body" dangerouslySetInnerHTML={{ __html: html }} /> : null}
      </Box>
    );
  }
  if (node.type === "video") {
    const s = segments[node.segmentId] || {};
    const checkKey = node.checkKey || s.checkKey || s.revisadoKey;
    return (
      <VideoBlock
        key={key}
        video={s}
        title={node.title || s.title}
        project={segProject}
        segmentId={node.segmentId}
        checkKey={checkKey}
        reloadKey={reloadKey}
        fillHeight={fillHeight}
      />
    );
  }
  if (node.type === "sql") {
    const s = segments[node.segmentId] || {};
    const checkKey = node.checkKey || s.checkKey || s.revisadoKey;
    return (
      <SqlBlock key={key} sql={s.sql || s.body || "-- sin SQL"} title={s.title || node.title || "Consulta"} dbTarget={s.dbTarget} project={segProject} segmentId={node.segmentId} checkKey={checkKey} reloadKey={reloadKey} />
    );
  }
  if (node.type === "day" || node.type === "group" || node.type === "section") {
    const stretch = fillHeight;
    return (
      <Box
        key={key}
        sx={{
          my: stretch ? 0 : 1.5,
          pl: depth ? 1.5 : 0,
          borderLeft: depth ? 2 : 0,
          borderColor: "divider",
          flex: stretch ? 1 : undefined,
          minHeight: stretch ? 0 : undefined,
          display: stretch ? "flex" : undefined,
          flexDirection: stretch ? "column" : undefined,
        }}
      >
        {node.title && (
          <Typography variant={depth >= 1 ? "subtitle2" : "subtitle1"} sx={Object.assign({ color: "primary.main", fontWeight: 600, mb: 0.5, flexShrink: 0 }, clamp2)}>{node.title}</Typography>
        )}
        {(node.children || []).map((c, i) => renderNode(c, segments, project, key + "-" + i, depth + 1, reloadKey, fillHeight, onSegmentTodos))}
      </Box>
    );
  }
  return null;
}

function extractDaysFromSingle(data) {
  const layout = data.layout || data;
  const days = [];
  const seen = new Set();
  const collect = (nodes) => {
    (nodes || []).forEach((n) => {
      if (!n) return;
      const m = reDate.exec(n.title || "");
      const isLeaf = n.type === "md" || n.type === "sql" || n.type === "widget" || n.type === "video";
      const isDay = n.type === "day" || (!!m && !isLeaf && !!(n.children && n.children.length));
      if (isDay) {
        const date = m ? m[1] : "";
        const id = date || (n.title || "");
        if (!seen.has(id)) {
          seen.add(id);
          days.push({ id, date, title: n.title || "Día", spaces: [data.project || ""], children: n.children || [] });
        }
      } else if (n.children && n.children.length) collect(n.children);
    });
  };
  collect(layout.nodes || []);
  days.sort((a, b) => (a.date < b.date ? 1 : -1));
  return days;
}

export function BitacoraView(props) {
  const { useState, useEffect } = getReact();
  const { Box, Stack, Typography, Alert, CircularProgress, Chip } = getMaterialUI();
  const { Loading, ErrorBox, Icon } = UI;
  const [state, setState] = useState({ loading: true, error: null, data: null, days: [] });
  const [selected, setSelected] = useState(null);
  const [revisadoMap, setRevisadoMap] = useState({});
  const [segmentPatches, setSegmentPatches] = useState({});

  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, data: null, days: [] });
    setSelected(null);
    setSegmentPatches({});

    const spaces = spacesFor(props.project);
    Promise.all(spaces.map((s) => getBitacora(s).catch(() => null)))
      .then((results) => {
        if (!alive) return;
        if (results.every((r) => r == null)) {
          setState({ loading: false, error: "No se pudo cargar la bitácora.", data: null, days: [] });
          return;
        }
        if (isGeneralProject(props.project)) {
          const bundles = spaces.map((s, i) => ({ space: s, data: normalizeBitacoraData(results[i]) }));
          const merged = mergeBitacoraBundles(bundles);
          setState({ loading: false, error: null, data: merged, days: merged.days });
        } else {
          const data = normalizeBitacoraData(results[0]);
          const days = data ? extractDaysFromSingle(Object.assign({}, data, { project: props.project })) : [];
          setState({ loading: false, error: null, data, days });
        }
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: e instanceof Error ? e.message : String(e), data: null, days: [] });
      });
    return () => { alive = false; };
  }, [props.project, props.reloadKey]);

  function loadRevisado(force) {
    return Promise.all(spacesFor(props.project).map((s) => getRevisadoMap(s, force).catch(() => ({}))))
      .then((maps) => Object.assign({}, ...maps));
  }

  useEffect(() => {
    let alive = true;
    loadRevisado(false).then((m) => { if (alive) setRevisadoMap(m); });
    return () => { alive = false; };
  }, [props.project, props.reloadKey]);

  useEffect(() => {
    const { REALTIME, REALTIME_EVENT } = getRealtimeConstants();
    function refresh() { loadRevisado(true).then(setRevisadoMap).catch(() => setRevisadoMap({})); }
    function onRealtime(e) { const msg = e.detail; if (msg && msg.type && msg.type !== REALTIME.CHECKS_UPDATED) return; refresh(); }
    window.addEventListener("isaj:checks-sync", refresh);
    window.addEventListener(REALTIME_EVENT, onRealtime);
    return () => { window.removeEventListener("isaj:checks-sync", refresh); window.removeEventListener(REALTIME_EVENT, onRealtime); };
  }, [props.project]);

  const days = state.days;
  const baseSegments = isGeneralProject(props.project)
    ? (state.data?.segments || {})
    : (state.data?.segments || {});
  const segments = Object.assign({}, baseSegments);
  Object.entries(segmentPatches).forEach(([id, patch]) => {
    if (segments[id]) segments[id] = Object.assign({}, segments[id], patch);
  });

  function onSegmentTodos(segmentId, todos) {
    setSegmentPatches((p) => Object.assign({}, p, { [segmentId]: { todos } }));
  }

  useEffect(() => {
    if (!days.length) return;
    const next = resolveSelFromUrl(days);
    if (next && next !== selected) setSelected(next);
  }, [state.days]);

  useEffect(() => {
    return subscribe((s) => {
      if (typeof s.sel !== "string" || !s.sel.trim()) return;
      if (days.some((d) => d.id === s.sel) && s.sel !== selected) setSelected(s.sel);
    });
  }, [days, selected]);

  if (state.loading) return Loading ? <Loading label="Cargando bitácora…" /> : <CircularProgress />;
  if (state.error) return ErrorBox ? <ErrorBox message={state.error} /> : <Alert severity="error">{state.error}</Alert>;
  if (!days.length) {
    return <Alert severity="info">{isGeneralProject(props.project) ? "No hay entradas de bitácora en PatyIA ni Clientes." : "La bitácora de " + props.project + " está vacía."}</Alert>;
  }

  const current = days.find((d) => d.id === selected) || days[0];
  const stretchVideo = countVideoLeaves(current.children) === 1;
  const treeItems = days.map((d) => ({
    id: d.id,
    date: d.date,
    secondary: d.title.replace(reDate, "").replace(/^\s*[—-]\s*/, "").trim(),
    dotState: aggregateDotState(collectSqlCheckKeys(d.children, segments), revisadoMap),
  }));

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0 }}>
      <Box sx={{ width: 230, flexShrink: 0, borderRight: 1, borderColor: "divider", overflow: "auto", display: { xs: "none", md: "block" } }}>
        <DateTree items={treeItems} selectedId={selected} onSelect={(id) => { setSelected(id); merge({ sel: id }); }} mode="day" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap" sx={{ px: 2, pt: 2, pb: 1, flexShrink: 0 }}>
          <Icon icon="mdi:calendar-text-outline" size={22} style={{ flexShrink: 0, marginTop: 2 }} />
          <Typography variant="h6" sx={clamp2}>{current.title}</Typography>
          {isGeneralProject(props.project) && current.spaces?.length > 1 && current.spaces.map((s) => (
            <Chip key={s} size="small" variant="outlined" label={projectLabel(s)} />
          ))}
        </Stack>
        <Box sx={{ flex: 1, minHeight: 0, overflow: stretchVideo ? "hidden" : "auto", px: 2, pb: 2, display: "flex", flexDirection: "column" }}>
          {current.children.length
            ? current.children.map((node, i) => renderNode(node, segments, props.project, current.id + "-" + i, 0, props.reloadKey, stretchVideo, onSegmentTodos))
            : <Typography color="text.secondary">Sin contenido para este día.</Typography>}
        </Box>
      </Box>
    </Box>
  );
}
