import{mdToHtml as s}from"./platform.js";const i=/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\s)\]<>]*/gi,u=/\[([^\]]*)\]\(\s*https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^)\s]*\s*\)/gi,c=/<a\b[^>]*href="[^"]*(?:youtube\.com|youtu\.be)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;function g(t){if(!t)return t;let n=String(t);return n=n.replace(u,"$1"),n=n.replace(i,""),n.replace(/  +/g," ").replace(/ +\n/g,`
`).trim()}function p(t){return t&&String(t).replace(c,"$1")}const f=/^\s*-\s*\[( |x|X)\]\s+(.+)$/;function a(t){if(!t)return t;const n=String(t).split(`
`),r=[];let e=!1;for(const o of n){if(f.test(o)){e=!0;continue}e&&o.trim()===""||(e=!1,r.push(o))}return r.join(`
`).replace(/\n{3,}/g,`

`).trim()}function m(t){const n=g(t),r=s(n);return p(String(r))}export{m as renderBitacoraMarkdown,a as stripTodoCheckboxesFromMarkdown,p as stripYoutubeFromHtml,g as stripYoutubeFromMarkdown};
