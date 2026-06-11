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
  const MUI = MaterialUI;
  const UI = window.ISAJ.UI;
  const P = window.ISAJ.Parts;

  function ChecksView(props: ChecksViewProps) {
    const [state, setState] = React.useState({ loading: true, error: null as string | null, rows: [] as CheckRow[], mock: false });
    const [busy, setBusy] = React.useState<Record<string, boolean>>({});

    function load() {
      setState((s) => ({ ...s, loading: true, error: null }));
      window.ISAJ.Api.getChecks(props.project)
        .then((d) => {
          const body = d as Record<string, unknown> | CheckRow[] | null;
          const rows: CheckRow[] = (body && !Array.isArray(body) && ((body.rows as CheckRow[]) || (body.checks as CheckRow[]))) || (Array.isArray(body) ? body : []);
          const mock = !!(body && !Array.isArray(body) && body._mock);
          setState({ loading: false, error: null, rows, mock });
        })
        .catch((e) => setState({ loading: false, error: e instanceof Error ? e.message : String(e), rows: [], mock: false }));
    }
    React.useEffect(load, [props.project, props.reloadKey]);

    function toggle(row: CheckRow) {
      if (!window.ISAJ.Session.isLoggedIn()) return;
      const key = (row.revisadoKey || row.REVISADOKEY) as string;
      setBusy((b) => ({ ...b, [key]: true }));
      const next = !(row.checked != null ? row.checked : row.BCHECKED);
      try {
        window.dispatchEvent(new CustomEvent("isaj:checks-local", { detail: { revisadoKey: key } }));
      } catch { /* ignore */ }
      window.ISAJ.Api.setCheck(props.project, key, next)
        .then(load)
        .catch((e) => setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) })))
        .finally(() => setBusy((b) => { const n = { ...b }; delete n[key]; return n; }));
    }

    if (state.loading) return UI.Loading
      ? React.createElement(UI.Loading, { label: "Cargando checks…" })
      : React.createElement(MUI.CircularProgress, null);
    if (state.error) return UI.ErrorBox
      ? React.createElement(UI.ErrorBox, { message: state.error })
      : React.createElement(MUI.Alert, { severity: "error" }, state.error);
    if (!state.rows.length) return React.createElement(MUI.Alert, { severity: "info" }, "Sin checks en " + props.project + ".");

    const canEdit = window.ISAJ.Session.isLoggedIn();
    return React.createElement(MUI.Box, { sx: { height: "100%", overflow: "auto", p: 2 } },
      state.mock && React.createElement(P.MockBanner, null),
      !canEdit && React.createElement(MUI.Alert, { severity: "info", sx: { mb: 2 } },
        "Inicia sesión para marcar checks. En modo lectura solo puedes consultarlos."),
      React.createElement(MUI.List, { component: MUI.Paper, variant: "outlined" },
        state.rows.map((row, i) => {
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

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.ChecksView = ChecksView;
})();
