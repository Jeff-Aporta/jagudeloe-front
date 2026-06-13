/**

 * Vista documento full-page — driver JSX (MUI + tema dodger ISAJ, igual que la app).

 */

import { getReact, getReactDOM, getMaterialUI } from "../core/runtime.ts";

import { TicketDocWebView } from "../ui/TicketDocWebView.jsx";

import { TicketMetricsDocument } from "../views/TicketMetricsView.jsx";

import { TkReportSwitch } from "../ui/TkReportSwitch.jsx";

import { tkDocPageSx } from "../ui/tkDocSurface.ts";



function useAppThemeMode() {

  const bag = window.ISAJ;

  if (!bag?.Theme?.useThemeMode) {

    throw new Error("ISAJ.Theme no registrado — ejecutar isa-setup.ts antes de doc-viewer-web");

  }

  return bag.Theme.useThemeMode();

}



function DocWebPage({ tk, space, iticket }) {

  const { useState, useCallback } = getReact();

  const { ThemeProvider, CssBaseline, Box } = getMaterialUI();

  const UI = window.ISAJ?.UI;

  const tm = useAppThemeMode();

  const [reportView, setReportView] = useState("diligencia");



  const toggleReport = useCallback(() => {

    setReportView((prev) => (prev === "metricas" ? "diligencia" : "metricas"));

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

        {UI?.ThemeSwitch && <UI.ThemeSwitch mode={tm.mode} onToggle={tm.toggle} />}

      </Box>

      <Box className="tk-doc-web-surface" sx={tkDocPageSx()}>

        {reportView === "metricas" ? (

          <Box className="tk-doc-markdown" sx={{ maxWidth: 920, mx: "auto", width: "100%" }}>

            <TicketMetricsDocument tk={tk} iticket={ticketId} project={project} />

          </Box>

        ) : (

          <TicketDocWebView tk={tk} />

        )}

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

  getReactDOM().createRoot(rootEl).render(

    <DocWebPage tk={tk} space={space} iticket={iticket} />,

  );

}


