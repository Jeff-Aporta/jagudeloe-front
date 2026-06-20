/** proyecto TK → owner/repo en GitHub (enlace al commit). */
const GITHUB_REPO: Record<string, string> = {
  ISS: "Dev-InSoft/ISS-AyudasCPIA",
  "ISS-AyudasCPIA": "Dev-InSoft/ISS-AyudasCPIA",
  PatyIA: "Dev-InSoft/ISS-AyudasCPIA",
  "ISA-DOC": "Dev-InSoft/ISA-DOC",
  "isa-patyia": "Jeff-Aporta/isa-patyia",
  ISA: "Jeff-Aporta/isa-patyia",
  "ISW-ClientesIS": "Dev-InSoft/ISW-ClientesIS",
  "ISP-ClientesIS": "Dev-InSoft/ISP-ClientesIS",
  "ISP-CLientesISServer": "Dev-InSoft/ISP-CLientesISServer",
  "ISS-ClientesIS-ContaPymeU": "Dev-InSoft/ISS-ClientesIS-ContaPymeU",
  "ISP-SvelteComponents": "Dev-InSoft/ISP-SvelteComponents",
};

function githubSlug(proyecto: string): string {
  const key = String(proyecto ?? "").trim();
  return GITHUB_REPO[key] ?? `Dev-InSoft/${key || proyecto}`;
}

/** Quita prefijo de repo duplicado (p. ej. ISS-AyudasCPIA/src/… → src/…). */
function normalizeGithubBlobPath(proyecto: string, filePath: string): string {
  let path = String(filePath ?? "").trim().replace(/^\/+/, "");
  const slug = githubSlug(proyecto);
  const repoName = slug.split("/").pop() ?? "";
  if (repoName && path.toLowerCase().startsWith(`${repoName.toLowerCase()}/`)) {
    path = path.slice(repoName.length + 1);
  }
  return path;
}

export function tkCommitGithubUrl(proyecto: string, hash: string): string {
  const h = String(hash ?? "").trim();
  if (!h) return "#";
  return `https://github.com/${githubSlug(proyecto)}/commit/${h}`;
}

/** Archivo en un commit concreto (vista blob en GitHub). */
export function tkCommitGithubBlobUrl(proyecto: string, hash: string, filePath: string): string {
  const h = String(hash ?? "").trim();
  const path = normalizeGithubBlobPath(proyecto, filePath);
  if (!h || !path) return "";
  return `https://github.com/${githubSlug(proyecto)}/blob/${h}/${path}`;
}

/** Commit más reciente del ticket (fecha meta desc; si no, mayor sortKey). */
export function latestTkCommit(commits: unknown[]): { hash: string; proyecto: string } | null {
  const rows = [...(commits as Record<string, unknown>[])].filter((c) => String(c.hash ?? "").trim());
  if (!rows.length) return null;

  const ranked = rows
    .map((c) => {
      const meta = (c.meta ?? {}) as Record<string, unknown>;
      const fecha = String(c.fecha ?? meta.fecha ?? "");
      const ts = fecha ? Date.parse(fecha) : NaN;
      return {
        c,
        meta,
        sortKey: Number(c.sortKey ?? 0),
        ts: Number.isFinite(ts) ? ts : NaN,
      };
    })
    .sort((a, b) => {
      if (Number.isFinite(a.ts) && Number.isFinite(b.ts) && a.ts !== b.ts) return b.ts - a.ts;
      if (Number.isFinite(a.ts) && !Number.isFinite(b.ts)) return -1;
      if (!Number.isFinite(a.ts) && Number.isFinite(b.ts)) return 1;
      return b.sortKey - a.sortKey;
    });

  const last = ranked[0]?.c;
  if (!last) return null;
  const meta = (last.meta ?? {}) as Record<string, unknown>;
  const hash = String(last.hash ?? "").trim();
  return {
    hash,
    proyecto: String(meta.repo ?? last.proyecto ?? "").trim(),
  };
}
