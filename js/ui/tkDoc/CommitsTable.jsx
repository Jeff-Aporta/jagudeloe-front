import { getMaterialUI } from "../../core/platform.ts";
import { tkCommitGithubUrl } from "../tkCommitGithub.ts";
import {
  TK_TABLE_DESC_CLAMP_SX,
  tkTablePlainText,
  formatTkCommitFecha,
  TK_DOC_TABLE_PAPER_SX,
  TK_DOC_TABLE_HEAD_CELL_SX,
  TK_DOC_TABLE_ROW_SX,
  TK_DOC_TABLE_BODY_CELL_SX,
  TK_DOC_TABLE_TOTAL_ROW_SX,
  TK_COMMIT_INS_CHIP_SX,
  TK_COMMIT_DEL_CHIP_SX,
  computeCommitTotals,
} from "../../core/tk-table.ts";
import { useGlassColors, glassInnerSx } from "../glassSurface.ts";

function commitFecha(c) {
  const meta = c.meta ?? {};
  return formatTkCommitFecha(c.fecha ?? meta.fecha);
}

function commitProyecto(c) {
  const meta = c.meta ?? {};
  return String(meta.repo ?? c.proyecto ?? "PatyIA");
}

export function CommitsTable({ commits }) {
  const { Table, TableHead, TableBody, TableRow, TableCell, Paper, Chip, Typography } = getMaterialUI();
  const c = useGlassColors();

  if (!commits?.length) return null;

  const headers = ["Commit", "Fecha", "Descripción", "Ins", "Del", "Tiempo"];
  const totals = computeCommitTotals(commits);
  const totalLabel = totals.count === 1 ? "1 commit" : `${totals.count} commits`;

  return (
    <Paper variant="outlined" sx={{ ...TK_DOC_TABLE_PAPER_SX, borderColor: c.border, ...glassInnerSx(c, "node") }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((h) => (
              <TableCell
                key={h}
                align={h === "Ins" || h === "Del" || h === "Tiempo" ? "right" : "left"}
                sx={TK_DOC_TABLE_HEAD_CELL_SX}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {commits.map((commit, i) => {
            const hash = String(commit.hash ?? "");
            const url = tkCommitGithubUrl(commitProyecto(commit), hash);
            const descripcion = String(commit.descripcion ?? "");
            return (
              <TableRow key={i} sx={TK_DOC_TABLE_ROW_SX}>
                <TableCell sx={TK_DOC_TABLE_BODY_CELL_SX}>
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
                <TableCell sx={{ ...TK_DOC_TABLE_BODY_CELL_SX, color: "text.secondary", whiteSpace: "nowrap" }}>
                  {commitFecha(commit)}
                </TableCell>
                <TableCell sx={{ ...TK_DOC_TABLE_BODY_CELL_SX, maxWidth: 420 }} title={tkTablePlainText(descripcion)}>
                  <Typography variant="body2" sx={TK_TABLE_DESC_CLAMP_SX}>
                    {descripcion}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={TK_DOC_TABLE_BODY_CELL_SX}>
                  <Chip size="small" label={"+" + Number(commit.insCount ?? 0)} sx={TK_COMMIT_INS_CHIP_SX} />
                </TableCell>
                <TableCell align="right" sx={TK_DOC_TABLE_BODY_CELL_SX}>
                  <Chip size="small" label={"−" + Number(commit.delCount ?? 0)} sx={TK_COMMIT_DEL_CHIP_SX} />
                </TableCell>
                <TableCell align="right" sx={{ ...TK_DOC_TABLE_BODY_CELL_SX, color: "text.secondary" }}>
                  {Number(commit.minutos ?? 0)} min
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow sx={TK_DOC_TABLE_TOTAL_ROW_SX}>
            <TableCell sx={TK_DOC_TABLE_BODY_CELL_SX} />
            <TableCell sx={TK_DOC_TABLE_BODY_CELL_SX} />
            <TableCell sx={TK_DOC_TABLE_BODY_CELL_SX}>
              <Typography variant="body2" fontWeight={700}>
                Total · {totalLabel}
              </Typography>
            </TableCell>
            <TableCell align="right" sx={TK_DOC_TABLE_BODY_CELL_SX}>
              <Chip size="small" label={"+" + totals.ins} sx={TK_COMMIT_INS_CHIP_SX} />
            </TableCell>
            <TableCell align="right" sx={TK_DOC_TABLE_BODY_CELL_SX}>
              <Chip size="small" label={"−" + totals.del} sx={TK_COMMIT_DEL_CHIP_SX} />
            </TableCell>
            <TableCell align="right" sx={{ ...TK_DOC_TABLE_BODY_CELL_SX, fontWeight: 700 }}>
              {totals.minutos} min
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Paper>
  );
}
