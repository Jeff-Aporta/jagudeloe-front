/*
 * views/ChecksView — checks (revisados) de un space. GET público para ver el estado;
 * marcar/desmarcar requiere login (POST con Authorization).
 */

interface CheckRow {
  revisadoKey?: string; REVISADOKEY?: string;
  checked?: boolean; BCHECKED?: boolean;
  fhUltAct?: string; FHULTACT?: string;
}
interface ChecksViewProps { project: string; reloadKey?: number; }

(function () {
  "use strict";
  const React = (window as any).React;
  const MUI = (window as any).MaterialUI;
  const w = window as any;
  const UI = w.ISAJ.UI;

  function ChecksView(props: ChecksViewProps) {
    const [state, setState] = React.useState({ loading: true, error: null as string | null, rows: [] as CheckRow[] });
    const [busy, setBusy] = React.useState<Record<string, boolean>>({});

    function load() {
      setState((s: any) => Object.assign({}, s, { loading: true, error: null }));
      w.ISAJ.Api.getChecks(props.project)
        .then((d: any) => {
          const rows: CheckRow[] = (d && (d.rows || d.checks)) || (Array.isArray(d) ? d : []);
          setState({ loading: false, error: null, rows });
        })
        .catch((e: any) => setState({ loading: false, error: e.message, rows: [] }));
    }
    React.useEffect(load, [props.project, props.reloadKey]);

    function toggle(row: CheckRow) {
      if (!w.ISAJ.Session.isLoggedIn()) return;
      const key = (row.revisadoKey || row.REVISADOKEY) as string;
      setBusy((b: any) => Object.assign({}, b, { [key]: true }));
      const next = !(row.checked != null ? row.checked : row.BCHECKED);
      w.ISAJ.Api.setCheck(props.project, key, next)
        .then(load)
        .catch((e: any) => setState((s: any) => Object.assign({}, s, { error: e.message })))
        .finally(() => setBusy((b: any) => { const n = Object.assign({}, b); delete n[key]; return n; }));
    }

    if (state.loading) return React.createElement(UI.Loading, { label: "Cargando checks…" });
    if (state.error) return React.createElement(UI.ErrorBox, { message: state.error });
    if (!state.rows.length) return React.createElement(MUI.Alert, { severity: "info" }, "Sin checks en " + props.project + ".");

    const canEdit = w.ISAJ.Session.isLoggedIn();
    return React.createElement(MUI.Box, null,
      !canEdit && React.createElement(MUI.Alert, { severity: "info", sx: { mb: 2 } },
        "Inicia sesión para marcar checks. En modo lectura solo puedes consultarlos."),
      React.createElement(MUI.List, { component: MUI.Paper, variant: "outlined" },
        state.rows.map((row: CheckRow, i: number) => {
          const key = (row.revisadoKey || row.REVISADOKEY) as string;
          const checked = row.checked != null ? row.checked : row.BCHECKED;
          return React.createElement(MUI.ListItem, {
            key: i, divider: true,
            secondaryAction: React.createElement(MUI.Checkbox, {
              edge: "end", checked: !!checked, disabled: !canEdit || !!busy[key],
              onChange: () => toggle(row),
            }),
          }, React.createElement(MUI.ListItemText, {
            primary: key,
            secondary: (row.fhUltAct || row.FHULTACT) ? ("Últ. act: " + (row.fhUltAct || row.FHULTACT)) : null,
          }));
        })));
  }

  w.ISAJ = w.ISAJ || {};
  w.ISAJ.ChecksView = ChecksView;
})();
