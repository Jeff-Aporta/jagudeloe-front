/** proyecto TK → owner/repo en GitHub (enlace al commit). */
const GITHUB_REPO: Record<string, string> = {
  "ISS-AyudasCPIA": "Dev-InSoft/ISS-AyudasCPIA",
  PatyIA: "Dev-InSoft/ISS-AyudasCPIA",
  "isa-patyia": "Jeff-Aporta/isa-patyia",
  ISA: "Jeff-Aporta/isa-patyia",
  "ISW-ClientesIS": "Dev-InSoft/ISW-ClientesIS",
  "ISP-ClientesIS": "Dev-InSoft/ISP-ClientesIS",
  "ISP-CLientesISServer": "Dev-InSoft/ISP-CLientesISServer",
  "ISS-ClientesIS-ContaPymeU": "Dev-InSoft/ISS-ClientesIS-ContaPymeU",
  "ISP-SvelteComponents": "Dev-InSoft/ISP-SvelteComponents",
};

export function tkCommitGithubUrl(proyecto: string, hash: string): string {
  const h = String(hash ?? "").trim();
  if (!h) return "#";
  const slug = GITHUB_REPO[String(proyecto ?? "").trim()] ?? `Dev-InSoft/${proyecto}`;
  return `https://github.com/${slug}/commit/${h}`;
}
