/**

 * Vista documento full-page — driver JSX (MUI + tema dodger ISAJ, igual que la app).

 */

import { getReact, getReactDOM, getMaterialUI } from "../core/runtime.ts";

import { TicketDocWebView } from "../ui/TicketDocWebView.jsx";

import { TicketMetricsDocument } from "../views/TicketMetricsView.jsx";

import { TicketCatalogFooter } from "../ui/TicketCatalogFooter.jsx";

import { TkReportSwitch } from "../ui/TkReportSwitch.jsx";
import { CopyReportLinkButton } from "../ui/CopyReportLinkButton.jsx";

import { tkDocPageSx } from "../ui/tkDocSurface.ts";

import { parseDocReportView, writeDocReportView } from "../boot/url-s.mjs";



function DocWebPage({ tk, space, iticket, initialReportView }) {

  const { useState, useCallback, useEffect } = getReact();

  const { ThemeProvider, CssBaseline, Box } = getMaterialUI();

  const UI = window.ISAJ?.UI;
  const ThemeSwitch = UI?.ThemeSwitch;

  const tm = useAppThemeMode();

  const [reportView, setReportView] = useState(() => initialReportView || parseDocReportView());

  useEffect(() => {
    const onPop = () => setReportView(parseDocReportView());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const toggleReport = useCallback(() => {
    setReportView((prev) => {
      const next = prev === "metricas" ? "diligencia" : "metricas";
      writeDocReportView(next);
      return next;
    });
  }, []);



  const project = String(tk.space || space || "patyia").toLowerCase();

  const ticketId = String(tk.iticket || iticket || "");



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

        {ThemeSwitch ? <ThemeSwitch mode={tm.mode} onToggle={tm.toggle} /> : null}

      </Box>

      <Box className="tk-doc-web-surface" sx={tkDocPageSx()}>

        {reportView === "metricas" ? (

          <Box className="tk-doc-markdown" sx={{ maxWidth: 920, mx: "auto", width: "100%" }}>

            <TicketMetricsDocument tk={tk} iticket={ticketId} project={project} />

          </Box>

        ) : (

          <TicketDocWebView tk={tk} />

        )}

        <TicketCatalogFooter space={project} currentIticket={ticketId} />

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


