/** Markdown seguro: sin enlaces YouTube (reuniones = solo texto). */
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

export function renderSafeMarkdown(raw: string): string {
  const cleaned = stripYoutubeFromMarkdown(raw);
  const html = mdToHtml(cleaned);
  return stripYoutubeFromHtml(String(html));
}
