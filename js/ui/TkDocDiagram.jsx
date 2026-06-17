/** Diagrama TK — fuente en payload; mermaid.ink por defecto, fallback Kroki. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMaterialUI } from "../core/platform.ts";
import {
  diagramEngine,
  fetchKrokiBlobUrl,
  mermaidInkDiagramUrl,
  resolveDiagramSource,
} from "../core/tk-diagram.ts";
import { TkLightboxImage } from "./TkLightbox.jsx";

export function TkDocDiagram({ payload }) {
  const { Box, Typography, useTheme } = getMaterialUI();
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const p = payload || {};
  const engine = diagramEngine(p);
  const source = useMemo(() => resolveDiagramSource(p, dark), [p, dark]);
  const inkUrl = useMemo(() => (engine === "mermaid" ? mermaidInkDiagramUrl(p, dark, "svg") : ""), [p, dark, engine]);

  const [src, setSrc] = useState("");
  const [via, setVia] = useState("");
  const blobRef = useRef(null);

  const revokeBlob = useCallback(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
  }, []);

  useEffect(() => {
    revokeBlob();
    setSrc("");
    setVia("");
    if (!source) return undefined;

    let cancelled = false;

    async function load() {
      if (engine === "plantuml") {
        try {
          const blob = await fetchKrokiBlobUrl("plantuml", source);
          if (cancelled) {
            URL.revokeObjectURL(blob);
            return;
          }
          blobRef.current = blob;
          setSrc(blob);
          setVia("kroki");
        } catch {
          if (!cancelled) setVia("error");
        }
        return;
      }

      setSrc(inkUrl);
      setVia("mermaid.ink");
    }

    load();
    return () => {
      cancelled = true;
      revokeBlob();
    };
  }, [source, engine, inkUrl, revokeBlob]);

  const onInkError = useCallback(async () => {
    if (engine !== "mermaid" || !source || via === "kroki" || via === "error") return;
    try {
      revokeBlob();
      const blob = await fetchKrokiBlobUrl("mermaid", source);
      blobRef.current = blob;
      setSrc(blob);
      setVia("kroki");
    } catch {
      setVia("error");
    }
  }, [engine, source, via, revokeBlob]);

  if (!source) return null;

  return (
    <Box
      className="tk-doc-diagram"
      sx={{
        textAlign: "center",
        my: 1,
        p: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: dark ? "rgba(30,144,255,0.22)" : "rgba(30,144,255,0.14)",
        bgcolor: "transparent",
      }}
    >
      {src ? (
        <TkLightboxImage
          href={src}
          src={src}
          caption={p.caption ?? p.alt ?? ""}
          alt={p.alt ?? p.caption ?? ""}
          onImgError={onInkError}
          imgSx={{
            maxWidth: "100%",
            bgcolor: "transparent",
            display: "block",
            mx: "auto",
          }}
          linkSx={{ mx: "auto" }}
        />
      ) : (
        <Typography variant="caption" color="text.secondary">
          Generando diagrama…
        </Typography>
      )}
      {via === "error" && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
          No se pudo renderizar el diagrama (mermaid.ink y Kroki).
        </Typography>
      )}
      {p.caption && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {p.caption}
          {via === "kroki" ? " · Kroki" : via === "mermaid.ink" ? "" : ""}
        </Typography>
      )}
    </Box>
  );
}
