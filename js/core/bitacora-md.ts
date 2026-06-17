/** Bitácora: nunca mostrar enlaces a YouTube (reuniones grabadas = solo texto). */
import { mdToHtml } from "./platform.ts";

const YT_URL = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\s)\]<>]*/gi;
const YT_MD_LINK = /\[([^\]]*)\]\(\s*https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^)\s]*\s*\)/gi;
const YT_HTML_LINK = /<a\b[^>]*href="[^"]*(?:youtube\.com|youtu\.be)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

export function stripYoutubeFromMarkdown(raw: string): string {
  if (!raw) return raw;
  let s = String(raw);
  s = s.replace(YT_MD_LINK, "$1");
  s = s.replace(YT_URL, "");
  return s.replace(/  +/g, " ").replace(/ +\n/g, "\n").trim();
}

export function stripYoutubeFromHtml(html: string): string {
  if (!html) return html;
  return String(html).replace(YT_HTML_LINK, "$1");
}

const TODO_LINE = /^\s*-\s*\[( |x|X)\]\s+(.+)$/;

export function stripTodoCheckboxesFromMarkdown(raw: string): string {
  if (!raw) return raw;
  const lines = String(raw).split("\n");
  const out: string[] = [];
  let prevWasTodo = false;
  for (const line of lines) {
    if (TODO_LINE.test(line)) {
      prevWasTodo = true;
      continue;
    }
    if (prevWasTodo && line.trim() === "") continue;
    prevWasTodo = false;
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function renderBitacoraMarkdown(raw: string): string {
  const cleaned = stripYoutubeFromMarkdown(raw);
  const html = mdToHtml(cleaned);
  return stripYoutubeFromHtml(String(html));
}
