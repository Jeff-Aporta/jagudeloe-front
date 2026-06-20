import { getMaterialUI } from "../../core/platform.ts";
import { inlineMdWeb } from "../tkHtml.ts";
import { splitMarkdownBlocks } from "../../core/tk-markdown.ts";
import { DataTable } from "./DataTable.jsx";
import { MdList } from "./MdList.jsx";

const BLOCK_HTML = /<(p|div|ul|ol|table|h[1-6]|section|blockquote|pre)\b/i;

const LEGACY_HTML_SX = {
  "& p": { mb: 1.25, lineHeight: 1.65 },
  "& ul, & ol": { pl: 2.5, mb: 1.25 },
  "& h3": { fontSize: "0.95rem", fontWeight: 700, mt: 2, mb: 0.75 },
};

function usesBlockHtmlLayout(text) {
  const raw = String(text ?? "");
  if (!raw.trim()) return false;
  if (/^#{1,3}\s/m.test(raw)) return false;
  return BLOCK_HTML.test(raw);
}

export function MdBody({ text }) {
  const { Box, Typography } = getMaterialUI();
  const raw = String(text ?? "");

  if (usesBlockHtmlLayout(raw)) {
    return (
      <Box
        className="tk-doc-markdown tk-doc-legacy-html tk-doc-rich-text"
        sx={LEGACY_HTML_SX}
        dangerouslySetInnerHTML={{ __html: inlineMdWeb(raw) }}
      />
    );
  }

  const out = [];

  for (const block of splitMarkdownBlocks(raw)) {
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

  return <Box className="tk-doc-markdown tk-doc-rich-text">{out}</Box>;
}
