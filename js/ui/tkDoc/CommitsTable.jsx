import { getMaterialUI } from "../../core/platform.ts";
import { inlineMdWeb } from "../tkHtml.ts";
import { tkCommitGithubUrl } from "../tkCommitGithub.ts";
import { TK_TABLE_DESC_CLAMP_SX, tkTablePlainText, TK_DOC_TABLE_PAPER_SX, TK_DOC_TABLE_HEAD_CELL_SX, TK_DOC_TABLE_ROW_SX, TK_DOC_TABLE_BODY_CELL_SX, TK_COMMIT_INS_CHIP_SX, TK_COMMIT_DEL_CHIP_SX } from "../../core/tk-table.ts";

export function CommitsTable({ commits }) {
  const { Table, TableHead, TableBody, TableRow, TableCell, Paper, Chip, Typography, Box, Tooltip } = getMaterialUI();

  if (!commits?.length) return null;

  return (
    <Paper variant="outlined" sx={TK_DOC_TABLE_PAPER_SX}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {["Commit", "Proyecto", "Descripción", "Ins", "Del", "Tiempo"].map((h) => (
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
          {commits.map((c, i) => {
            const hash = String(c.hash ?? "");
            const url = tkCommitGithubUrl(String(c.proyecto ?? ""), hash);
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
                <TableCell sx={TK_DOC_TABLE_BODY_CELL_SX}>{c.proyecto}</TableCell>
                <TableCell sx={{ ...TK_DOC_TABLE_BODY_CELL_SX, maxWidth: 420 }}>
                  <Tooltip title={tkTablePlainText(c.descripcion ?? "")} arrow placement="top">
                    <Box
                      component="span"
                      sx={TK_TABLE_DESC_CLAMP_SX}
                      dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(c.descripcion ?? "")) }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell align="right" sx={TK_DOC_TABLE_BODY_CELL_SX}>
                  <Chip size="small" label={"+" + Number(c.insCount ?? 0)} sx={TK_COMMIT_INS_CHIP_SX} />
                </TableCell>
                <TableCell align="right" sx={TK_DOC_TABLE_BODY_CELL_SX}>
                  <Chip size="small" label={"−" + Number(c.delCount ?? 0)} sx={TK_COMMIT_DEL_CHIP_SX} />
                </TableCell>
                <TableCell align="right" sx={TK_DOC_TABLE_BODY_CELL_SX}>{Number(c.minutos ?? 0)} min</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}
