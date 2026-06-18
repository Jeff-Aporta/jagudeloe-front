/**
 * Vista documento full-page — driver JSX (MUI + tema dodger ISAJ, igual que la app).
 */
import { getReact, getReactDOM, getMaterialUI } from "../core/platform.ts";
import { TicketDocWebView } from "../ui/TicketDocWebView.jsx";
import { TicketMetricsDocument } from "../views/TicketMetricsView.jsx";
import { TicketCatalogFooter } from "../ui/TicketCatalogFooter.jsx";
import { TkReportSwitch } from "../ui/TkReportSwitch.jsx";
import { CopyReportLinkButton, CopyReportLinkHtmlButton } from "../ui/CopyReportLinkButton.jsx";
import { tkDocPageSx } from "../ui/tkDocSurface.ts";
import { getTicket } from "../api/client.ts";
import { patchTkDocSeed } from "../core/tk-doc-seed-patch.ts";
import { parseDocReportView, writeDocReportView, parseDocSel, writeDocSel } from "../boot/url-s.mjs";

function normIticket(raw) {
  const t = String(raw ?? "").trim().toUpperCase();
  return t.startsWith("TK-") ? t : `TK-${t}`;
}

function docTitle(tk, iticket) {
  const id = normIticket(tk?.iticket || iticket);
  return `${id} · ${String(tk?.titulo || tk?.title || "Ticket")}`;
}

function DocWebPage({ tk: initialTk, space, iticket: initialIticket, initialReportView }) {
  const { useState, useCallback, useEffect } = getReact();
  const { ThemeProvider, CssBaseline, Box, CircularProgress } = getMaterialUI();

  const UI = window.ISAJ?.UI;
  const ThemeSwitch = UI?.ThemeSwitch;

  const tm = useAppThemeMode();
  const project = String(initialTk?.space || space || "patyia").toLowerCase();

  const [tk, setTk] = useState(initialTk);
  const [ticketId, setTicketId] = useState(() => normIticket(initialIticket || initialTk?.iticket));
  const [loading, setLoading] = useState(false);
  const [reportView, setReportView] = useState(() => initialReportView || parseDocReportView());

  const loadTicket = useCallback(async (rawId, { pushUrl = false } = {}) => {
    const id = normIticket(rawId);
    if (!id) return;
    if (pushUrl) writeDocSel(id);
    setLoading(true);
    try {
      const data = await getTicket(project, id);
      const raw = (data && typeof data === "object" && data.ticket) || data;
      const patched = patchTkDocSeed(raw || {});
      const nextId = normIticket(patched.iticket || id);
      setTk(patched);
      setTicketId(nextId);
      document.title = docTitle(patched, nextId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      /* conservar ticket actual si falla la carga */
    } finally {
      setLoading(false);
    }
  }, [project]);

  const selectTicket = useCallback((id) => {
    const next = normIticket(id);
    if (!next || next === ticketId) return;
    loadTicket(next, { pushUrl: true });
  }, [ticketId, loadTicket]);

  useEffect(() => {
    const onPop = () => {
      setReportView(parseDocReportView());
      const sel = parseDocSel();
      if (sel && normIticket(sel) !== ticketId) {
        loadTicket(sel);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [ticketId, loadTicket]);

  const toggleReport = useCallback(() => {
    setReportView((prev) => {
      const next = prev === "metricas" ? "diligencia" : "metricas";
      writeDocReportView(next);
      return next;
    });
  }, []);

  return (
    <ThemeProvider theme={tm.theme}>
      <CssBaseline />
      <Box
        sx={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 1200,
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          boxShadow: 1,
          p: 0.25,
        }}
      >
        <TkReportSwitch mode={reportView} onToggle={toggleReport} />
        <CopyReportLinkButton
          space={project}
          iticket={ticketId}
          report={reportView === "metricas" ? "metricas" : "diligencia"}
          driver="jsx"
        />
        <CopyReportLinkHtmlButton
          space={project}
          iticket={ticketId}
          report={reportView === "metricas" ? "metricas" : "diligencia"}
          driver="jsx"
          titulo={tk?.titulo || tk?.title}
        />
        {ThemeSwitch ? <ThemeSwitch mode={tm.mode} onToggle={tm.toggle} /> : null}
      </Box>

      <Box className="tk-doc-web-surface" sx={tkDocPageSx()}>
        <Box sx={{ position: "relative", opacity: loading ? 0.55 : 1, transition: "opacity 0.2s ease" }}>
          {reportView === "metricas" ? (
            <Box className="tk-doc-markdown" sx={{ maxWidth: 920, mx: "auto", width: "100%" }}>
              <TicketMetricsDocument tk={tk} iticket={ticketId} project={project} />
            </Box>
          ) : (
            <TicketDocWebView tk={tk} />
          )}
          {loading ? (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                justifyContent: "center",
                pt: 8,
                pointerEvents: "none",
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : null}
        </Box>

        <TicketCatalogFooter space={project} currentIticket={ticketId} onSelectTicket={selectTicket} />
      </Box>
    </ThemeProvider>
  );
}

export function mountDocWebView(tk, opts = {}) {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("#root no encontrado");
  rootEl.classList.add("tk-doc-web");

  const space = String(opts.space || tk.space || "patyia").toLowerCase();
  const iticket = String(opts.iticket || tk.iticket || "");
  const initialReportView = opts.reportView === "metricas" ? "metricas" : parseDocReportView();

  getReactDOM().createRoot(rootEl).render(
    <DocWebPage tk={tk} space={space} iticket={iticket} initialReportView={initialReportView} />,
  );
}

function useAppThemeMode() {
  const bag = window.ISAJ;
  if (!bag?.Theme?.useThemeMode) {
    throw new Error("ISAJ.Theme no registrado — ejecutar isa-setup.ts antes de doc-viewer-web");
  }
  return bag.Theme.useThemeMode();
}
