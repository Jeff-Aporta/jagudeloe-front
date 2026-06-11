/*
 * ui/parts — componentes compartidos para las vistas:
 *  - MockBanner: aviso claro de "datos de ejemplo".
 *  - Accordion: acordeón anidado, controlado o no.
 *  - MonthTree: navegador tipo árbol agrupado por mes (meses → ítems).
 */

interface TreeItem { id: string; label: string; secondary?: string; color?: string; }
interface TreeGroup { id: string; label: string; count?: number; items: TreeItem[]; }

(function () {
  "use strict";
  const MUI = MaterialUI;
  const UI = window.ISAJ.UI;

  // Aviso de datos de ejemplo (mockup).
  function MockBanner() {
    return React.createElement(MUI.Alert, {
      severity: "warning", variant: "outlined", icon: React.createElement(UI.Icon, { icon: "mdi:flask-outline" }),
      sx: { mb: 2, borderStyle: "dashed" },
    },
      React.createElement(MUI.Typography, { variant: "body2", sx: { fontWeight: 600 } }, "Datos de ejemplo (MOCKUP)"),
      React.createElement(MUI.Typography, { variant: "caption", color: "text.secondary" },
        "El backend no respondió; se muestran ejemplos genéricos para ilustrar la interfaz."));
  }

  // Acordeón anidado. Controlado si se pasa `expanded`+`onToggle`; si no, usa defaultExpanded.
  function Accordion(props: {
    title: string; secondary?: string; icon?: string; level?: number; nodeId?: string;
    count?: number | null; expanded?: boolean; onToggle?: () => void; defaultExpanded?: boolean;
    children?: ReactNode;
  }) {
    const level = props.level || 0;
    const controlled = typeof props.expanded === "boolean";
    const tint = level === 0 ? "transparent" : "rgba(30,144,255," + (0.04 + level * 0.03) + ")";
    const extra = controlled
      ? { expanded: props.expanded, onChange: () => props.onToggle && props.onToggle() }
      : { defaultExpanded: props.defaultExpanded != null ? props.defaultExpanded : level === 0 };
    return React.createElement(MUI.Accordion, Object.assign({
      id: props.nodeId, disableGutters: true, elevation: 0,
      sx: { border: 1, borderColor: "divider", borderRadius: 1, mb: 1, bgcolor: tint, "&:before": { display: "none" } },
    }, extra),
      React.createElement(MUI.AccordionSummary, {
        expandIcon: React.createElement(UI.Icon, { icon: "mdi:chevron-down" }),
        sx: { "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1, my: 1 } },
      },
        props.icon && React.createElement(UI.Icon, { icon: props.icon }),
        React.createElement(MUI.Typography, { sx: { fontWeight: level === 0 ? 700 : 600, flexGrow: 1 } }, props.title),
        props.secondary && React.createElement(MUI.Typography, { variant: "caption", color: "text.secondary", sx: { mr: 1 } }, props.secondary),
        props.count != null && React.createElement(MUI.Chip, { size: "small", label: props.count })),
      React.createElement(MUI.AccordionDetails, { sx: { pl: level === 0 ? 2 : 1.5 } }, props.children));
  }

  // Navegador tipo árbol: meses (colapsables) → ítems. Clic en ítem → onSelect(id).
  function MonthTree(props: { groups: TreeGroup[]; selectedId?: string | null; onSelect: (id: string) => void; emptyLabel?: string }) {
    const firstOpen = props.groups.length ? props.groups[0].id : "";
    const [open, setOpen] = React.useState<Record<string, boolean>>({ [firstOpen]: true });

    if (!props.groups.length) {
      return React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary", sx: { p: 2 } }, props.emptyLabel || "Sin elementos.");
    }

    return React.createElement(MUI.List, {
      dense: true, disablePadding: true,
      subheader: React.createElement(MUI.ListSubheader, { sx: { bgcolor: "transparent", lineHeight: "2.2em" } },
        React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center" },
          React.createElement(UI.Icon, { icon: "mdi:file-tree-outline", size: 18 }),
          React.createElement("span", null, "Navegador"))),
    },
      props.groups.map((g) => {
        const isOpen = !!open[g.id];
        return React.createElement(React.Fragment, { key: g.id },
          React.createElement(MUI.ListItemButton, { onClick: () => setOpen((o) => ({ ...o, [g.id]: !o[g.id] })), sx: { py: 0.25 } },
            React.createElement(UI.Icon, { icon: isOpen ? "mdi:folder-open-outline" : "mdi:folder-outline", size: 18 }),
            React.createElement(MUI.ListItemText, { primary: g.label, sx: { ml: 1 }, primaryTypographyProps: { fontWeight: 600, variant: "body2" } }),
            g.count != null && React.createElement(MUI.Chip, { size: "small", label: g.count, sx: { mr: 0.5 } }),
            React.createElement(UI.Icon, { icon: isOpen ? "mdi:chevron-down" : "mdi:chevron-right", size: 18 })),
          React.createElement(MUI.Collapse, { in: isOpen, unmountOnExit: true },
            React.createElement(MUI.List, { dense: true, disablePadding: true },
              g.items.map((it) =>
                React.createElement(MUI.ListItemButton, {
                  key: it.id, selected: props.selectedId === it.id, onClick: () => props.onSelect(it.id),
                  sx: { pl: 4, py: 0.25 },
                },
                  React.createElement(UI.Icon, { icon: "mdi:file-document-outline", size: 16, style: { opacity: 0.7 } }),
                  React.createElement(MUI.ListItemText, {
                    primary: it.label, secondary: it.secondary, sx: { ml: 1 },
                    primaryTypographyProps: { variant: "body2", noWrap: true },
                    secondaryTypographyProps: { variant: "caption", noWrap: true },
                  }),
                  it.color && React.createElement(MUI.Box, { sx: { width: 8, height: 8, borderRadius: "50%", bgcolor: it.color } }))))));
      }));
  }

  function monthLabel(ym: string): string {
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const m = /^(\d{4})-(\d{2})/.exec(ym);
    if (!m) return ym;
    const idx = parseInt(m[2], 10) - 1;
    return ym + " — " + (meses[idx] ? meses[idx][0].toUpperCase() + meses[idx].slice(1) + " " + m[1] : ym);
  }

  // ---------------------------------------------------------------------------
  // DateTree — navegador en carpetas AÑO → MES → DÍA (solo números).
  //   items: { id, date: "YYYY-MM-DD", label, secondary? }
  //   mode "day"   → un ítem por fecha: el día es la hoja seleccionable.
  //   mode "items" → varios ítems por fecha: el día es carpeta con hojas.
  // ---------------------------------------------------------------------------
  interface DateItem { id: string; date: string; label?: string; secondary?: string; }

  function DateTree(props: { items: DateItem[]; selectedId?: string | null; onSelect: (id: string) => void; mode: "day" | "items"; emptyLabel?: string }) {
    // Construir árbol año→mes→día→items
    const tree: Record<string, Record<string, Record<string, DateItem[]>>> = {};
    props.items.forEach((it) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(it.date || "");
      const y = m ? m[1] : "----", mo = m ? m[2] : "--", d = m ? m[3] : "--";
      const yy = (tree[y] = tree[y] || {});
      const mm = (yy[mo] = yy[mo] || {});
      (mm[d] = mm[d] || []).push(it);
    });
    const years = Object.keys(tree).sort().reverse();

    // Estado de carpetas abiertas (path "y", "y/mo", "y/mo/d"); abre la rama más reciente.
    const initial: Record<string, boolean> = {};
    if (years.length) {
      const y0 = years[0]; initial[y0] = true;
      const mos = Object.keys(tree[y0]).sort().reverse();
      if (mos.length) { const mo0 = mos[0]; initial[y0 + "/" + mo0] = true;
        const ds = Object.keys(tree[y0][mo0]).sort().reverse();
        if (ds.length && props.mode === "items") initial[y0 + "/" + mo0 + "/" + ds[0]] = true;
      }
    }
    const [open, setOpen] = React.useState<Record<string, boolean>>(initial);
    const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

    if (!years.length) {
      return React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary", sx: { p: 2 } }, props.emptyLabel || "Sin elementos.");
    }

    function folderRow(key: string, label: string, depth: number, count: number | null, isOpen: boolean) {
      return React.createElement(MUI.ListItemButton, { onClick: () => toggle(key), sx: { pl: 1 + depth * 1.5, py: 0.25 } },
        React.createElement(UI.Icon, { icon: isOpen ? "mdi:folder-open-outline" : "mdi:folder-outline", size: 17 }),
        React.createElement(MUI.ListItemText, { primary: label, sx: { ml: 1 }, primaryTypographyProps: { fontWeight: 600, variant: "body2" } }),
        count != null && React.createElement(MUI.Chip, { size: "small", label: count, sx: { mr: 0.5, height: 18 } }),
        React.createElement(UI.Icon, { icon: isOpen ? "mdi:chevron-down" : "mdi:chevron-right", size: 16 }));
    }

    function leafRow(it: DateItem, label: string, depth: number) {
      return React.createElement(MUI.ListItemButton, {
        key: it.id, selected: props.selectedId === it.id, onClick: () => props.onSelect(it.id),
        sx: { pl: 1 + depth * 1.5, py: 0.25 },
      },
        React.createElement(UI.Icon, { icon: "mdi:file-document-outline", size: 15, style: { opacity: 0.7 } }),
        React.createElement(MUI.ListItemText, {
          primary: label, secondary: it.secondary, sx: { ml: 1 },
          primaryTypographyProps: { variant: "body2", noWrap: true },
          secondaryTypographyProps: { variant: "caption", noWrap: true },
        }));
    }

    const rows: ReactNode[] = [];
    years.forEach((y) => {
      const yOpen = !!open[y];
      const yCount = props.items.filter((it) => (it.date || "").startsWith(y)).length;
      rows.push(React.createElement(React.Fragment, { key: "y-" + y }, folderRow(y, y, 0, yCount, yOpen)));
      if (!yOpen) return;
      const months = Object.keys(tree[y]).sort().reverse();
      months.forEach((mo) => {
        const mKey = y + "/" + mo;
        const mOpen = !!open[mKey];
        const days = Object.keys(tree[y][mo]).sort().reverse();
        const mCount = days.reduce((a, d) => a + tree[y][mo][d].length, 0);
        rows.push(React.createElement(React.Fragment, { key: "m-" + mKey }, folderRow(mKey, mo, 1, mCount, mOpen)));
        if (!mOpen) return;
        days.forEach((d) => {
          const dItems = tree[y][mo][d];
          if (props.mode === "day") {
            // El día es la hoja (un ítem por fecha)
            const it = dItems[0];
            rows.push(leafRow(it, d, 2));
          } else {
            const dKey = mKey + "/" + d;
            const dOpen = !!open[dKey];
            rows.push(React.createElement(React.Fragment, { key: "d-" + dKey }, folderRow(dKey, d, 2, dItems.length, dOpen)));
            if (dOpen) dItems.forEach((it) => rows.push(leafRow(it, it.label || it.id, 3)));
          }
        });
      });
    });

    return React.createElement(MUI.List, {
      dense: true, disablePadding: true,
      subheader: React.createElement(MUI.ListSubheader, { sx: { bgcolor: "transparent", lineHeight: "2.2em" } },
        React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center" },
          React.createElement(UI.Icon, { icon: "mdi:file-tree-outline", size: 18 }),
          React.createElement("span", null, "Navegador"))),
    }, rows);
  }

  // ---------------------------------------------------------------------------
  // SqlBlock — muestra SQL con CodeMirror (solo lectura) y botón de ejecución
  // dirigido a la BD correcta. Solo ejecuta si hay sesión con perfil válido.
  // ---------------------------------------------------------------------------
  function canExecSql(): boolean {
    const S = window.ISAJ.Session;
    if (!S || !S.isLoggedIn || !S.isLoggedIn()) return false;
    if (typeof (S as any).can === "function") {
      return (S as any).can("ejecutar_sql") || (S as any).can("ejecutar_mssql") || (S as any).can("guardar_langlab");
    }
    return true;
  }

  function SqlBlock(props: { sql: string; title?: string; dbTarget?: string; project: string; segmentId?: string }) {
    const ref = React.useRef<HTMLDivElement | null>(null);
    const cm = React.useRef<any>(null);
    const [exec, setExec] = React.useState(false);
    const [res, setRes] = React.useState<{ rows?: unknown[]; rowCount?: number } | null>(null);
    const [err, setErr] = React.useState<string | null>(null);
    const CM = (window as any).CodeMirror;
    const db = props.dbTarget || (props.project === "clientesis" ? "clientesis" : "paty");
    const allowed = canExecSql();

    React.useEffect(() => {
      if (ref.current && CM && !cm.current) {
        cm.current = CM(ref.current, {
          value: props.sql, mode: "text/x-sql", theme: "dracula",
          lineNumbers: true, readOnly: true, viewportMargin: Infinity,
        });
        setTimeout(() => cm.current && cm.current.refresh(), 30);
      } else if (!CM && ref.current) {
        // Fallback si CodeMirror no cargó: <pre>
        ref.current.innerHTML = "";
        const pre = document.createElement("pre");
        pre.className = "sql-body"; pre.textContent = props.sql;
        ref.current.appendChild(pre);
      }
    }, []);

    function run() {
      if (!allowed) return;
      setExec(true); setErr(null); setRes(null);
      window.ISAJ.Api.execSql(props.project, { sql: props.sql, dbTarget: db, segmentId: props.segmentId })
        .then((d: any) => setRes({ rows: d && d.rows, rowCount: d && (d.rowCount ?? (d.rows ? d.rows.length : undefined)) }))
        .catch((e: any) => setErr(e instanceof Error ? e.message : String(e)))
        .finally(() => setExec(false));
    }

    return React.createElement(MUI.Box, { sx: { my: 1.5, border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" } },
      React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center", sx: { p: 1, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" } },
        React.createElement(UI.Icon, { icon: "mdi:database-search-outline" }),
        React.createElement(MUI.Typography, { variant: "subtitle2", sx: { flex: 1 } }, props.title || "Consulta SQL"),
        React.createElement(MUI.Chip, { size: "small", color: db === "clientesis" ? "secondary" : "primary", variant: "outlined", label: "BD: " + db }),
        React.createElement(MUI.Tooltip, { title: allowed ? ("Ejecutar en " + db) : "Inicia sesión con un perfil autorizado para ejecutar" },
          React.createElement("span", null,
            React.createElement(MUI.Button, {
              size: "small", variant: "contained", disabled: !allowed || exec,
              startIcon: React.createElement(UI.Icon, { icon: "mdi:play" }), onClick: run,
            }, exec ? "Ejecutando…" : "Ejecutar")))),
      React.createElement(MUI.Box, { ref, className: "sql-cm" }),
      res && React.createElement(MUI.Alert, { severity: "success", sx: { m: 1 } },
        "Ejecución correcta" + (res.rowCount != null ? " — " + res.rowCount + " fila(s)" : "")),
      err && React.createElement(MUI.Alert, { severity: "error", sx: { m: 1 } }, err));
  }

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.Parts = { MockBanner, Accordion, MonthTree, DateTree, SqlBlock, monthLabel, canExecSql };
})();
