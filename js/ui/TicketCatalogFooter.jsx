/** Footer full-page: catálogo de tickets del space con tooltips informativos. */
import { getReact, getMaterialUI } from "../core/platform.ts";
import { getTickets } from "../api/client.ts";
import { buildDocWebUrl } from "../core/tk-doc.ts";
import { tkCatalogTooltipLines } from "../core/tk-catalog.ts";
import { inlineMdWeb } from "./tkHtml.ts";
import { TK_CATALOG_CHIP_SX, TK_DOC_RADIUS, tkCatalogCurrentChipBg } from "../core/tk-table.ts";
import { ticketListDotState, ticketDotStateLabel } from "../core/checks.ts";
import { NavStatusDot } from "./parts.jsx";

const TOOLTIP_TEXT_SX = {
  fontSize: "0.75rem",
  lineHeight: 1.5,
  letterSpacing: 0.1,
  "& .tk-inline-code": {
    fontFamily: "Consolas, monospace",
    fontSize: "0.72em",
    px: 0.45,
    py: 0.1,
    borderRadius: 0.5,
    bgcolor: "action.hover",
  },
  "& .tk-inline-link": {
    color: "primary.light",
    textDecoration: "none",
    "&:hover": { textDecoration: "underline" },
  },
  "& b": { fontWeight: 600 },
};

function CatalogTooltip({ lines }) {
  const { Stack, Typography } = getMaterialUI();
  const [headline, ...meta] = lines;

  return (
    <Stack spacing={0.45} sx={{ maxWidth: 360, py: 0.15 }}>
      {headline ? (
        <Typography
          variant="caption"
          component="div"
          sx={{ ...TOOLTIP_TEXT_SX, fontWeight: 500, color: "inherit" }}
          dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(headline)) }}
        />
      ) : null}
      {meta.map((line, i) => (
        <Typography
          key={i}
          variant="caption"
          component="div"
          sx={{ ...TOOLTIP_TEXT_SX, fontWeight: 400, color: "text.secondary" }}
        >
          {line}
        </Typography>
      ))}
    </Stack>
  );
}

function ticketId(row) {
  return String(row.iticket ?? row.id ?? "").trim();
}

function ticketSpace(row, fallback) {
  return String(row.space ?? fallback ?? "patyia").toLowerCase();
}

export function TicketCatalogFooter({ space, currentIticket, onSelectTicket }) {
  const { useState, useEffect } = getReact();
  const { Box, Chip, Tooltip, Typography } = getMaterialUI();
  const project = String(space ?? "patyia").toLowerCase();
  const current = String(currentIticket ?? "").trim();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = () => {
      getTickets(project)
        .then((d) => {
          const list = (d && !Array.isArray(d) && (d.rows || d.tickets || d.items)) || (Array.isArray(d) ? d : []);
          if (!alive) return;
          setRows(
            list
              .filter((t) => ticketId(t))
              .sort((a, b) => String(b.fechaSolicitud ?? "").localeCompare(String(a.fechaSolicitud ?? ""))),
          );
        })
        .catch(() => {
          if (alive) setRows([]);
        });
    };
    const idleId = typeof requestIdleCallback === "function"
      ? requestIdleCallback(load, { timeout: 1500 })
      : setTimeout(load, 80);
    return () => {
      alive = false;
      if (typeof cancelIdleCallback === "function" && typeof idleId === "number") {
        cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId);
      }
    };
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
        Tiquetes (JAGUDELOE)
      </Typography>
      <Box
        className="tk-catalog-footer-chips"
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
          const isCurrent = !!current && id === current;
          const chipLabel = (
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
              <NavStatusDot state={dotState} title={ticketDotStateLabel(dotState)} />
              {id}
            </Box>
          );
          const chipSx = {
            ...TK_CATALOG_CHIP_SX,
            borderRadius: TK_DOC_RADIUS,
            pointerEvents: "none",
            ...(isCurrent
              ? {
                  bgcolor: tkCatalogCurrentChipBg,
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: tkCatalogCurrentChipBg },
                  "& .nav-status-dot": { boxShadow: "0 0 0 1px rgba(255,255,255,0.35)" },
                }
              : {}),
          };
          const trigger = (
            <Box
              component={isCurrent ? "span" : "a"}
              href={isCurrent ? undefined : href}
              aria-current={isCurrent ? "page" : undefined}
              onClick={
                isCurrent || !onSelectTicket
                  ? undefined
                  : (e) => {
                      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.button !== 0) return;
                      e.preventDefault();
                      onSelectTicket(id);
                    }
              }
              sx={{
                display: "inline-flex",
                width: "100%",
                textDecoration: "none",
                color: "inherit",
                cursor: isCurrent ? "default" : "pointer",
              }}
            >
              <Chip
                component="span"
                clickable={false}
                size="small"
                label={chipLabel}
                sx={chipSx}
              />
            </Box>
          );
          return (
            <Tooltip
              key={id}
              arrow
              placement="top"
              disableInteractive
              title={<CatalogTooltip lines={tip} />}
              slotProps={{
                tooltip: {
                  sx: {
                    pointerEvents: "none",
                    maxWidth: 380,
                    px: 1.25,
                    py: 0.9,
                    fontSize: "0.75rem",
                  },
                },
              }}
            >
              {trigger}
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
