/**

 * Driver JSX — presentación web del ticket (MUI, tema de la app).

 * Diseño libre: gradientes, glass, responsive. Paralelo a tkHtml.ts (correo).

 */

import { getMaterialUI } from "../core/runtime.ts";

import { UI } from "../core/platform.ts";

import { inlineMdWeb } from "../ui/tkHtml.ts";

import { formatTiqueteCreadoPor, resolveDocumentadorBlock } from "../ui/tkHeroAuthors.ts";

import { tkCommitGithubUrl } from "../ui/tkCommitGithub.ts";

import { CodeBlock } from "../ui/CodeBlock.jsx";



const SECTION_META = {

  markdown: { icon: "mdi:clipboard-text-outline", title: "Solicitud y objetivo", accent: "#1e90ff" },

  md: { icon: "mdi:clipboard-text-outline", title: "Solicitud y objetivo", accent: "#1e90ff" },

  text: { icon: "mdi:clipboard-text-outline", title: "Solicitud y objetivo", accent: "#1e90ff" },

  table: { icon: "mdi:table-large", title: "Tabla", accent: "#6366f1" },

  code: { icon: "mdi:code-tags", title: "Código", accent: "#0ea5e9" },

  sql: { icon: "mdi:database-search-outline", title: "SQL", accent: "#0ea5e9" },

  image: { icon: "mdi:eye-outline", title: "Evidencia", accent: "#8b5cf6" },

  img: { icon: "mdi:eye-outline", title: "Evidencia", accent: "#8b5cf6" },

  url: { icon: "mdi:link-variant", title: "Enlaces", accent: "#14b8a6" },

  link: { icon: "mdi:link-variant", title: "Enlaces", accent: "#14b8a6" },

  accordion: { icon: "mdi:unfold-more-horizontal", title: "Detalle", accent: "#64748b" },

  "cambio-bd": { icon: "mdi:database-cog-outline", title: "Cambios en base de datos", accent: "#f59e0b" },

  cambios_bd: { icon: "mdi:database-cog-outline", title: "Cambios en base de datos", accent: "#f59e0b" },

  html: { icon: "mdi:file-document-outline", title: "Detalle", accent: "#64748b" },

  body: { icon: "mdi:file-document-outline", title: "Detalle", accent: "#64748b" },

};



function sortBlocks(blocks) {

  return (blocks || []).slice().sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));

}



function isInfoTiquete(b) {

  const title = String((b.payload && b.payload.title) || "").toLowerCase();

  return title.includes("información del tiquete") || title.includes("informacion del tiquete");

}



function MdBody({ text }) {

  const { Box, Typography } = getMaterialUI();

  const out = [];

  let para = [];

  function flush() {

    if (para.length) {

      out.push(

        <Typography

          key={out.length}

          variant="body1"

          sx={{ mb: 1.25, lineHeight: 1.65, color: "text.primary" }}

          dangerouslySetInnerHTML={{ __html: inlineMdWeb(para.join(" ")) }}

        />,

      );

      para = [];

    }

  }

  for (const rawLine of String(text || "").split("\n")) {

    const line = rawLine.trim();

    if (!line) { flush(); continue; }

    if (line.startsWith("## ") || line.startsWith("# ")) {

      flush();

      out.push(

        <Typography key={out.length} variant="subtitle1" sx={{ mt: 2, mb: 0.75, fontWeight: 700, letterSpacing: -0.2 }}>

          <span dangerouslySetInnerHTML={{ __html: inlineMdWeb(line.replace(/^#+\s*/, "")) }} />

        </Typography>,

      );

      continue;

    }

    if (/^[-*]\s+/.test(line)) {

      flush();

      out.push(

        <Box key={out.length} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "flex-start" }}>

          <Box

            sx={{

              mt: 0.6,

              width: 8,

              height: 8,

              borderRadius: "50%",

              flexShrink: 0,

              background: "linear-gradient(135deg, #1e90ff, #6366f1)",

            }}

          />

          <Typography variant="body1" sx={{ lineHeight: 1.6, flex: 1 }}>

            <span dangerouslySetInnerHTML={{ __html: inlineMdWeb(line.replace(/^[-*]\s+/, "")) }} />

          </Typography>

        </Box>,

      );

      continue;

    }

    para.push(line);

  }

  flush();

  return <Box>{out}</Box>;

}



function DataTable({ headers, rows, title }) {

  const { Table, TableHead, TableBody, TableRow, TableCell, Typography, Paper, Box } = getMaterialUI();

  return (

    <Box sx={{ my: 0.5 }}>

      {title && <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>{title}</Typography>}

      <Paper

        variant="outlined"

        sx={{

          overflow: "auto",

          borderRadius: 2,

          borderColor: "divider",

          boxShadow: (t) => (t.palette.mode === "dark" ? "none" : "0 4px 24px rgba(15,23,42,0.06)"),

        }}

      >

        <Table size="small">

          <TableHead>

            <TableRow>

              {(headers || []).map((h) => (

                <TableCell

                  key={h}

                  sx={(t) => ({

                    fontWeight: 700,

                    whiteSpace: "nowrap",

                    borderBottom: 1,

                    borderColor: "divider",

                    ...(t.palette.mode === "dark"

                      ? {

                          background: "linear-gradient(90deg, #0b2e4e, #1e5a8a)",

                          color: "#fff",

                        }

                      : {

                          bgcolor: "action.hover",

                          color: "text.primary",

                        }),

                  })}

                >

                  {h}

                </TableCell>

              ))}

            </TableRow>

          </TableHead>

          <TableBody>

            {(rows || []).map((row, i) => (

              <TableRow

                key={i}

                sx={{

                  bgcolor: i % 2 ? "action.hover" : "background.paper",

                  transition: "background-color 0.15s",

                  "&:hover": { bgcolor: "action.selected" },

                }}

              >

                {(row || []).map((c, j) => (

                  <TableCell key={j} sx={{ fontSize: "0.875rem" }}>

                    <span dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(c ?? "")) }} />

                  </TableCell>

                ))}

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </Paper>

    </Box>

  );

}



function BlockBody({ block }) {

  const { Box, Typography, Link, Accordion, AccordionSummary, AccordionDetails, Chip } = getMaterialUI();
  const { Icon } = UI;

  const kind = String(block.kind || "text").toLowerCase();

  const p = block.payload || {};



  if (kind === "markdown" || kind === "md" || kind === "text") {

    return <MdBody text={p.text ?? p.body ?? ""} />;

  }

  if (kind === "code" || kind === "sql") {

    return <CodeBlock code={p.code ?? p.text ?? p.sql ?? ""} language={p.language || "sql"} />;

  }

  if (kind === "table") {

    return <DataTable headers={p.headers} rows={p.rows} title={p.title} />;

  }

  if (kind === "image" || kind === "img") {

    const src = p.url ?? p.src ?? "";

    return (

      <Box sx={{ textAlign: "center", my: 1 }}>

        <Box

          component="img"

          src={src}

          alt={p.alt ?? p.caption ?? ""}

          sx={{

            maxWidth: "100%",

            borderRadius: 2,

            border: 1,

            borderColor: "divider",

            boxShadow: (t) => (t.palette.mode === "dark" ? "0 8px 32px rgba(0,0,0,0.4)" : "0 12px 40px rgba(15,23,42,0.12)"),

          }}

        />

        {p.caption && (

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>

            {p.caption}

          </Typography>

        )}

      </Box>

    );

  }

  if (kind === "url" || kind === "link") {

    const href = p.href ?? p.url ?? "#";

    return (

      <Typography variant="body1">

        <Link href={href} target="_blank" rel="noreferrer" sx={{ fontWeight: 600 }}>

          {p.label ?? href}

        </Link>

      </Typography>

    );

  }

  if (kind === "badge" || kind === "chip") {

    return (

      <Chip

        size="small"

        label={p.label ?? p.text ?? ""}

        color={p.tone === "success" ? "success" : p.tone === "warning" ? "warning" : "default"}

        variant="outlined"

        sx={{ mr: 0.5, mb: 0.5 }}

      />

    );

  }

  if (kind === "accordion") {

    const inner = p.code

      ? <CodeBlock code={p.code} language={p.language || "sql"} />

      : <Box dangerouslySetInnerHTML={{ __html: String(p.html ?? "") }} />;

    return (

      <Accordion disableGutters variant="outlined" sx={{ my: 1, borderRadius: 2, "&:before": { display: "none" } }}>

        <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" size={20} />}>

          <Typography variant="subtitle2" fontWeight={600}>{p.title ?? "Detalle"}</Typography>

        </AccordionSummary>

        <AccordionDetails sx={{ pt: 0 }}>{inner}</AccordionDetails>

      </Accordion>

    );

  }

  if (kind === "cambio-bd" || kind === "cambios_bd") {

    return (

      <Box>

        <Typography variant="body1" sx={{ mb: 1 }}>

          <strong>{p.tabla}</strong>

          {p.registro ? ` · ${p.registro}` : ""}

        </Typography>

        {p.intencion && (

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }} dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(p.intencion)) }} />

        )}

        {p.sql && <CodeBlock code={p.sql} language="sql" />}

      </Box>

    );

  }

  if (kind === "html" || kind === "body") {

    return <Box dangerouslySetInnerHTML={{ __html: String(p.html ?? p.body ?? p.content ?? "") }} />;

  }

  return <CodeBlock code={JSON.stringify(p, null, 2)} language="json" />;

}



function SectionCard({ icon, title, accent, children }) {

  const { Paper, Stack, Typography, Box } = getMaterialUI();
  const { Icon } = UI;

  const color = accent || "#1e90ff";

  return (

    <Paper

      elevation={0}

      sx={{

        mb: 2.5,

        borderRadius: 2.5,

        overflow: "hidden",

        border: 1,

        borderColor: "divider",

        bgcolor: "background.paper",

        boxShadow: (t) =>

          t.palette.mode === "dark"

            ? "0 4px 24px rgba(0,0,0,0.25)"

            : "0 8px 32px rgba(15,23,42,0.07)",

        transition: "transform 0.2s ease, box-shadow 0.2s ease",

        "&:hover": {

          transform: { sm: "translateY(-2px)" },

          boxShadow: (t) =>

            t.palette.mode === "dark"

              ? "0 8px 32px rgba(0,0,0,0.35)"

              : "0 16px 48px rgba(15,23,42,0.1)",

        },

      }}

    >

      <Box

        sx={{

          px: { xs: 2, sm: 2.5 },

          py: 1.5,

          borderBottom: 1,

          borderColor: "divider",

          background: (t) =>

            t.palette.mode === "dark"

              ? `linear-gradient(90deg, ${color}22, transparent 70%)`

              : `linear-gradient(90deg, ${color}14, transparent 70%)`,

          borderLeft: 4,

          borderLeftColor: color,

        }}

      >

        <Stack direction="row" spacing={1.25} alignItems="center">

          <Box

            sx={{

              width: 32,

              height: 32,

              borderRadius: 1.5,

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              background: `linear-gradient(135deg, ${color}, ${color}99)`,

              color: "#fff",

              boxShadow: `0 4px 12px ${color}44`,

            }}

          >

            <Icon icon={icon} size={18} />

          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>

            {title}

          </Typography>

        </Stack>

      </Box>

      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>

    </Paper>

  );

}



function CommitsTable({ commits }) {

  const { Table, TableHead, TableBody, TableRow, TableCell, Paper, Chip, Typography } = getMaterialUI();

  if (!commits?.length) return null;

  return (

    <Paper variant="outlined" sx={{ overflow: "auto", borderRadius: 2 }}>

      <Table size="small">

        <TableHead>

          <TableRow>

            {["Commit", "Proyecto", "Descripción", "Ins", "Del", "Tiempo"].map((h) => (

              <TableCell

                key={h}

                align={h === "Ins" || h === "Del" || h === "Tiempo" ? "right" : "left"}

                sx={{ fontWeight: 700, bgcolor: "action.hover" }}

              >

                {h}

              </TableCell>

            ))}

          </TableRow>

        </TableHead>

        <TableBody>

          {commits.map((c, i) => {

            const hash = String(c.hash ?? "");

            const url = tkCommitGithubUrl(String(c.proyecto ?? ""), hash);

            return (

              <TableRow key={i} sx={{ "&:hover": { bgcolor: "action.hover" } }}>

                <TableCell>

                  {hash ? (

                    <Typography

                      component="a"

                      href={url}

                      target="_blank"

                      rel="noopener noreferrer"

                      variant="caption"

                      sx={{ fontFamily: "monospace", color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}

                    >

                      {hash.slice(0, 9)}

                    </Typography>

                  ) : (

                    <Typography component="code" variant="caption">{hash.slice(0, 9)}</Typography>

                  )}

                </TableCell>

                <TableCell>{c.proyecto}</TableCell>

                <TableCell><span dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(c.descripcion ?? "")) }} /></TableCell>

                <TableCell align="right">

                  <Chip size="small" label={"+" + Number(c.insCount ?? 0)} color="success" variant="outlined" />

                </TableCell>

                <TableCell align="right">

                  <Chip size="small" label={"−" + Number(c.delCount ?? 0)} color="error" variant="outlined" />

                </TableCell>

                <TableCell align="right">{Number(c.minutos ?? 0)} min</TableCell>

              </TableRow>

            );

          })}

        </TableBody>

      </Table>

    </Paper>

  );

}



function HeroHeader({ tk, space, iticket, badges }) {

  const { Box, Stack, Typography, Chip } = getMaterialUI();

  const creadoPor = formatTiqueteCreadoPor(tk.solicitante);

  const documentador = resolveDocumentadorBlock(tk);

  return (

    <Box

      sx={(t) => {

        const dark = t.palette.mode === "dark";

        return {

          position: "relative",

          overflow: "hidden",

          borderRadius: { xs: 2.5, md: 3 },

          mb: 3,

          p: { xs: 2.5, sm: 3, md: 3.5 },

          color: dark ? "#fff" : t.palette.text.primary,

          background: dark

            ? "linear-gradient(135deg, #0b2e4e 0%, #1e5a8a 38%, #1e90ff 72%, #6366f1 100%)"

            : "linear-gradient(135deg, #dbeafe 0%, #e8f4ff 38%, #f0f7ff 72%, #ffffff 100%)",

          border: dark ? "none" : `1px solid ${t.palette.divider}`,

          boxShadow: dark

            ? "0 20px 60px rgba(30,144,255,0.25)"

            : "0 8px 32px rgba(30,144,255,0.12)",

        };

      }}

    >

      <Box

        sx={(t) => ({

          position: "absolute",

          top: -40,

          right: -20,

          width: 180,

          height: 180,

          borderRadius: "50%",

          background:

            t.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(30,144,255,0.1)",

          filter: "blur(2px)",

        })}

      />

      <Box

        sx={(t) => ({

          position: "absolute",

          bottom: -60,

          left: -30,

          width: 220,

          height: 220,

          borderRadius: "50%",

          background:

            t.palette.mode === "dark" ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.14)",

          filter: "blur(4px)",

        })}

      />

      <Stack spacing={1} sx={{ position: "relative", zIndex: 1 }}>

        <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
          {iticket && (
            <Chip
              size="small"
              label={iticket}
              sx={(t) => ({
                bgcolor: t.palette.mode === "dark" ? "#fff" : t.palette.primary.main,
                color: t.palette.mode === "dark" ? "#0b2e4e" : "#fff",
                fontWeight: 800,
                fontSize: "0.8rem",
                mr: 0.5,
              })}
            />
          )}
          <Typography
            variant="caption"
            sx={(t) => ({
              opacity: 0.85,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontWeight: 600,
              pl: 0.5,
              color: t.palette.mode === "dark" ? "inherit" : t.palette.text.secondary,
            })}
          >
            {space}
          </Typography>
        </Stack>

        <Typography

          variant="h4"

          sx={{

            fontWeight: 800,

            lineHeight: 1.2,

            letterSpacing: -0.5,

            fontSize: { xs: "1.35rem", sm: "1.65rem", md: "1.85rem" },

          }}

        >

          {tk.titulo ?? tk.title ?? ""}

        </Typography>

        {creadoPor && (

          <Typography variant="body1" sx={(t) => ({ opacity: 0.9, maxWidth: 560, color: t.palette.mode === "dark" ? "inherit" : t.palette.text.primary })}>

            {creadoPor}

          </Typography>

        )}

        {documentador && (

          <Box sx={{ maxWidth: 560, mt: 0.25 }}>

            <Typography

              component="small"

              variant="caption"

              sx={(t) => ({

                display: "block",

                opacity: 0.8,

                lineHeight: 1.4,

                color: t.palette.mode === "dark" ? "inherit" : t.palette.text.secondary,

              })}

            >

              {documentador.label}

            </Typography>

            <Typography

              variant="body2"

              sx={(t) => ({

                fontWeight: 700,

                lineHeight: 1.45,

                color: t.palette.mode === "dark" ? "inherit" : t.palette.text.primary,

              })}

            >

              {documentador.nombre}

            </Typography>

            {documentador.cargo && (

              <Typography

                variant="body2"

                sx={(t) => ({

                  lineHeight: 1.45,

                  opacity: 0.9,

                  color: t.palette.mode === "dark" ? "inherit" : t.palette.text.secondary,

                })}

              >

                {documentador.cargo}

              </Typography>

            )}

          </Box>

        )}

        {badges.length > 0 && (

          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ pt: 0.5 }}>

            {badges.map((b, i) => (

              <Chip

                key={i}

                size="small"

                label={b.payload?.label ?? b.payload?.text ?? ""}

                sx={(t) => ({

                  bgcolor:

                    t.palette.mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(30,144,255,0.1)",

                  color: t.palette.mode === "dark" ? "#fff" : t.palette.primary.dark,

                  borderColor:

                    t.palette.mode === "dark" ? "rgba(255,255,255,0.35)" : "rgba(30,144,255,0.35)",

                  backdropFilter: "blur(8px)",

                })}

                variant="outlined"

              />

            ))}

          </Stack>

        )}

      </Stack>

    </Box>

  );

}



function TimeSummary({ tiempos }) {

  const { Box, Stack, Typography, LinearProgress } = getMaterialUI();

  if (!tiempos.length) return null;

  const total = tiempos.reduce((s, t) => s + t.minutos, 0) || 1;

  return (

    <Stack spacing={1.75}>

      {tiempos.map((t) => (

        <Box key={t.name}>

          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>

            <Typography variant="body2" fontWeight={600}>

              {t.name}

              {t.detail ? (

                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>

                  ({t.detail})

                </Typography>

              ) : null}

            </Typography>

            <Typography variant="body2" fontWeight={700} color="primary.main">

              {t.minutos} min

            </Typography>

          </Stack>

          <LinearProgress

            variant="determinate"

            value={Math.min(100, (t.minutos / total) * 100)}

            sx={{

              height: 7,

              borderRadius: 4,

              bgcolor: "action.hover",

              "& .MuiLinearProgress-bar": {

                borderRadius: 4,

                background: "linear-gradient(90deg, #1e90ff, #6366f1)",

              },

            }}

          />

        </Box>

      ))}

      <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>

        Total registrado: {total} min

      </Typography>

    </Stack>

  );

}



function renderBlockSection(b, key) {

  const kind = String(b.kind || "text").toLowerCase();

  const meta = SECTION_META[kind] || { icon: "mdi:file-document-outline", title: "Detalle", accent: "#64748b" };

  const title = b.payload?.title || meta.title;

  return (

    <SectionCard key={key} icon={meta.icon} title={title} accent={meta.accent}>

      <BlockBody block={b} />

    </SectionCard>

  );

}



export function TicketDocWebView({ tk }) {

  const { Box, Paper, Typography } = getMaterialUI();

  if (!tk) return null;



  const space = String(tk.space ?? "").toUpperCase() || "PATYIA";

  const iticket = String(tk.iticket ?? "");

  const content = sortBlocks(tk.content).filter((b) => !isInfoTiquete(b));

  const badges = content.filter((b) => ["badge", "chip"].includes(String(b.kind).toLowerCase()));

  const blocks = content.filter((b) => !["badge", "chip"].includes(String(b.kind).toLowerCase()));



  const contexts = tk.contexts || [];

  const allCommits = [...contexts.flatMap((c) => c.commits || []), ...(tk.rootCommits || [])];



  const tiempos = (tk.tiempos || [])

    .map((t) => ({ name: String(t.name ?? ""), detail: String(t.detail ?? ""), minutos: Math.round(Number(t.minutos ?? 0)) }))

    .filter((t) => t.name && t.minutos > 0);



  return (

    <Box className="tk-doc-markdown" sx={{ maxWidth: 920, mx: "auto", width: "100%" }}>

      <HeroHeader tk={tk} space={space} iticket={iticket} badges={badges} />



      {tk.resumen && (

        <Paper

          elevation={0}

          sx={{

            mb: 2.5,

            p: { xs: 2, sm: 2.5 },

            borderRadius: 2.5,

            border: 1,

            borderColor: "divider",

            background: (t) =>

              t.palette.mode === "dark"

                ? "linear-gradient(145deg, rgba(30,41,59,0.6), rgba(15,23,42,0.8))"

                : "linear-gradient(145deg, #ffffff, #f0f7ff)",

            boxShadow: (t) => (t.palette.mode === "dark" ? "none" : "0 8px 32px rgba(30,144,255,0.08)"),

          }}

        >

          <Typography

            variant="body1"

            sx={{ lineHeight: 1.65 }}

            dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(tk.resumen)) }}

          />

        </Paper>

      )}



      {blocks.map((b, i) => renderBlockSection(b, i))}



      {contexts.map((ctx, ci) =>

        sortBlocks(ctx.content)

          .filter((b) => !isInfoTiquete(b))

          .map((b, bi) => renderBlockSection(b, `ctx-${ci}-${bi}`)),

      )}



      {allCommits.length > 0 && (

        <SectionCard icon="mdi:source-commit" title="Commits que entregan la solución" accent="#10b981">

          <CommitsTable commits={allCommits} />

        </SectionCard>

      )}



      {tiempos.length > 0 && (

        <SectionCard icon="mdi:clock-outline" title="Resumen de tiempos" accent="#f59e0b">

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>

            Distribución del esfuerzo según la naturaleza del trabajo.

          </Typography>

          <TimeSummary tiempos={tiempos} />

        </SectionCard>

      )}

    </Box>

  );

}


