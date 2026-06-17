/** Footer full-page: catálogo de tickets del space con tooltips informativos. */
import { getReact, getMaterialUI } from "../core/platform.ts";
import { getTickets } from "../api/client.ts";
import { buildDocWebUrl } from "../core/tk-doc.ts";
import { tkCatalogTooltipLines } from "../core/tk-catalog.ts";
import { projectLabel } from "../core/tk-spaces.ts";
import { TK_CATALOG_CHIP_SX, TK_DOC_RADIUS } from "../core/tk-table.ts";
import { ticketListDotState, ticketDotStateLabel } from "../core/checks.ts";
import { NavStatusDot } from "./parts.jsx";

function ticketId(row) {
  return String(row.iticket ?? row.id ?? "").trim();
}

function ticketSpace(row, fallback) {
  return String(row.space ?? fallback ?? "patyia").toLowerCase();
}

function CatalogTooltip({ lines }) {
  const { Stack, Typography } = getMaterialUI();
  return (
    <Stack spacing={0.5} sx={{ maxWidth: 360, py: 0.25 }}>
      {lines.map((line, i) => (
        <Typography
          key={i}
          variant={i === 0 ? "body2" : "caption"}
          component="div"
          sx={{
            fontWeight: i === 0 ? 500 : 400,
            color: i === 0 ? "inherit" : "text.secondary",
            lineHeight: 1.45,
          }}
        >
          {line}
        </Typography>
      ))}
    </Stack>
  );
}

export function TicketCatalogFooter({ space, currentIticket }) {
  const { useState, useEffect } = getReact();
  const { Box, Chip, Tooltip, Typography } = getMaterialUI();
  const project = String(space ?? "patyia").toLowerCase();
  const current = String(currentIticket ?? "").trim();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;
    getTickets(project)
      .then((d) => {
        const list = (d && !Array.isArray(d) && (d.rows || d.tickets || d.items)) || (Array.isArray(d) ? d : []);
        if (!alive) return;
        setRows(
          list
            .filter((t) => ticketId(t) && ticketId(t) !== current)
            .sort((a, b) => String(b.fechaSolicitud ?? "").localeCompare(String(a.fechaSolicitud ?? ""))),
        );
      })
      .catch(() => {
        if (alive) setRows([]);
      });
    return () => { alive = false; };
  }, [project, current]);

  if (!rows.length) return null;

  return (
    <Box sx={{ maxWidth: 920, mx: "auto", width: "100%", mt: 4, mb: 2, pt: 3 }}>
      <Box
        component="hr"
        sx={{
          border: 0,
          borderTop: 1,
          borderColor: "divider",
          mb: 2.5,
        }}
      />
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, letterSpacing: 0.3 }}>
        {"Tiquetes de " + projectLabel(project) + " por Jeffrey Agudelo (JAGUDELOE)"}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
          gap: 1,
        }}
      >
        {rows.map((row) => {
          const id = ticketId(row);
          const sp = ticketSpace(row, project);
          const href = buildDocWebUrl(sp, id);
          const tip = tkCatalogTooltipLines(row);
          const dotState = ticketListDotState(row, {}, `tickets.${id}`);
          return (
            <Tooltip
              key={id}
              arrow
              placement="top"
              title={<CatalogTooltip lines={tip} />}
            >
              <Chip
                component="a"
                href={href}
                clickable
                size="small"
                label={
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <NavStatusDot state={dotState} title={ticketDotStateLabel(dotState)} />
                    {id}
                  </Box>
                }
                sx={{
                  ...TK_CATALOG_CHIP_SX,
                  borderRadius: TK_DOC_RADIUS,
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
