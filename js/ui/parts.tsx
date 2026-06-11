/*
 * ui/parts — componentes compartidos para las vistas:
 *  - MockBanner: aviso claro de "datos de ejemplo".
 *  - Accordion: acordeón anidado (imita ISA-DOC), controlado o no.
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

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.Parts = { MockBanner, Accordion, MonthTree, monthLabel };
})();
