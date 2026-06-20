import { getMaterialUI } from "../../core/platform.ts";
import { inlineMdWeb } from "../tkHtml.ts";
import { isTkDescColumn, TK_TABLE_DESC_CLAMP_SX, tkTablePlainText, TK_DOC_TABLE_PAPER_SX, TK_DOC_TABLE_HEAD_CELL_SX, TK_DOC_TABLE_ROW_SX, TK_DOC_TABLE_BODY_CELL_SX } from "../../core/tk-table.ts";
import { useGlassColors, glassInnerSx } from "../glassSurface.ts";

export function DataTable({ headers, rows, title, caption }) {
  const { Table, TableHead, TableBody, TableRow, TableCell, Typography, Paper, Box, Tooltip } = getMaterialUI();
  const c = useGlassColors();

  return (
    <Box sx={{ my: 0.5 }}>
      {title && (
        <Typography
          variant="subtitle2"
          sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}
          dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(title)) }}
        />
      )}
      {caption && (
        <Typography
          variant="caption"
          sx={{ display: "block", mb: 0.75, color: "text.secondary" }}
          dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(caption)) }}
        />
      )}
      <Paper variant="outlined" sx={{ ...TK_DOC_TABLE_PAPER_SX, borderColor: c.border, ...glassInnerSx(c, "node") }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {(headers || []).map((h) => (
                <TableCell key={h} sx={TK_DOC_TABLE_HEAD_CELL_SX}>
                  <Box component="span" dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(h ?? "")) }} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(rows || []).map((row, i) => (
              <TableRow key={i} sx={TK_DOC_TABLE_ROW_SX}>
                {(row || []).map((c, j) => {
                  const header = (headers || [])[j];
                  const clampDesc = isTkDescColumn(header);
                  const raw = String(c ?? "");
                  const html = inlineMdWeb(raw);
                  const inner = (
                    <Box
                      component="span"
                      sx={clampDesc ? TK_TABLE_DESC_CLAMP_SX : undefined}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                  return (
                    <TableCell
                      key={j}
                      sx={{
                        ...TK_DOC_TABLE_BODY_CELL_SX,
                        ...(clampDesc ? { maxWidth: 420 } : {}),
                      }}
                    >
                      {clampDesc ? (
                        <Tooltip title={tkTablePlainText(raw)} arrow placement="top">
                          {inner}
                        </Tooltip>
                      ) : inner}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
