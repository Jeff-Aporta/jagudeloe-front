/* views/BitacoraView — bitácora de un space (o General = PatyIA + Clientes consolidados). */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";
import { merge } from "../core/urlState.ts";
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
import { renderBitacoraMarkdown } from "../core/bitacora-md.ts";

const clamp2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 };

function renderNode(node, segments, project, key, depth, reloadKey) {
  const { Box, Typography } = getMaterialUI();
  if (!node) return null;
  const segProject = node._space || segmentProject(node.segmentId, project);
  if (node.type === "md") {
    const seg = segments[node.segmentId] || {};
    const raw = seg.markdown || seg.md || seg.body || "";
    const html = renderBitacoraMarkdown(typeof raw === "string" ? raw : String(raw));
    return <Box key={key} sx={{ my: 1 }}><Box className="md-body" dangerouslySetInnerHTML={{ __html: html }} /></Box>;
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
    return (
      <Box key={key} sx={{ my: 1.5, pl: depth ? 1.5 : 0, borderLeft: depth ? 2 : 0, borderColor: "divider" }}>
        {node.title && (
          <Typography variant={depth >= 1 ? "subtitle2" : "subtitle1"} sx={Object.assign({ color: "primary.main", fontWeight: 600, mb: 0.5 }, clamp2)}>{node.title}</Typography>
        )}
        {(node.children || []).map((c, i) => renderNode(c, segments, project, key + "-" + i, depth + 1, reloadKey))}
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

  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, data: null, days: [] });
    setSelected(null);

    const spaces = spacesFor(props.project);
    Promise.all(spaces.map((s) => getBitacora(s).catch(() => null)))
      .then((results) => {
        if (!alive) return;
        if (results.every((r) => r == null)) {
          setState({ loading: false, error: "No se pudo cargar la bitácora.", data: null, days: [] });
          return;
        }
        if (isGeneralProject(props.project)) {
          const bundles = spaces.map((s, i) => ({ space: s, data: results[i] }));
          const merged = mergeBitacoraBundles(bundles);
          setState({ loading: false, error: null, data: merged, days: merged.days });
        } else {
          const data = results[0];
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
  const segments = isGeneralProject(props.project)
    ? (state.data?.segments || {})
    : (state.data?.segments || {});

  useEffect(() => { if (days.length && !selected) setSelected(days[0].id); }, [state.days]);

  if (state.loading) return Loading ? <Loading label="Cargando bitácora…" /> : <CircularProgress />;
  if (state.error) return ErrorBox ? <ErrorBox message={state.error} /> : <Alert severity="error">{state.error}</Alert>;
  if (!days.length) {
    return <Alert severity="info">{isGeneralProject(props.project) ? "No hay entradas de bitácora en PatyIA ni Clientes." : "La bitácora de " + props.project + " está vacía."}</Alert>;
  }

  const current = days.find((d) => d.id === selected) || days[0];
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
      <Box sx={{ flex: 1, minWidth: 0, overflow: "auto", p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap" sx={{ mb: 2 }}>
          <Icon icon="mdi:calendar-text-outline" size={22} style={{ flexShrink: 0, marginTop: 2 }} />
          <Typography variant="h6" sx={clamp2}>{current.title}</Typography>
          {isGeneralProject(props.project) && current.spaces?.length > 1 && current.spaces.map((s) => (
            <Chip key={s} size="small" variant="outlined" label={projectLabel(s)} />
          ))}
        </Stack>
        {current.children.length
          ? current.children.map((node, i) => renderNode(node, segments, props.project, current.id + "-" + i, 0, props.reloadKey))
          : <Typography color="text.secondary">Sin contenido para este día.</Typography>}
      </Box>
    </Box>
  );
}
