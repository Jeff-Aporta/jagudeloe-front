import { getMaterialUI } from "../../core/platform.ts";
import { inlineMdWeb } from "../tkHtml.ts";
import { splitMarkdownBlocks } from "../../core/tk-markdown.ts";
import { DataTable } from "./DataTable.jsx";
import { MdList } from "./MdList.jsx";

export function MdBody({ text }) {
  const { Box, Typography } = getMaterialUI();
  const out = [];

  for (const block of splitMarkdownBlocks(text)) {
    if (block.type === "heading") {
      out.push(
        <Typography key={out.length} variant="subtitle1" sx={{ mt: 2, mb: 0.75, fontWeight: 700, letterSpacing: -0.2 }}>
          <span dangerouslySetInnerHTML={{ __html: inlineMdWeb(block.text) }} />
        </Typography>,
      );
      continue;
    }

    if (block.type === "bullet") {
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
            <span dangerouslySetInnerHTML={{ __html: inlineMdWeb(block.text) }} />
          </Typography>
        </Box>,
      );
      continue;
    }

    if (block.type === "ordered-list") {
      out.push(<MdList key={out.length} ordered items={block.items} />);
      continue;
    }

    if (block.type === "table") {
      out.push(
        <Box key={out.length} sx={{ my: 1 }}>
          <DataTable headers={block.table.headers} rows={block.table.rows} />
        </Box>,
      );
      continue;
    }

    out.push(
      <Typography
        key={out.length}
        variant="body1"
        sx={{ mb: 1.25, lineHeight: 1.65, color: "text.primary" }}
        dangerouslySetInnerHTML={{ __html: inlineMdWeb(block.text) }}
      />,
    );
  }

  return <Box>{out}</Box>;
}
