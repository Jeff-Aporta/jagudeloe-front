# jagudeloe-front

Panel ISA-DOC (GitHub Pages) — bitácora, tickets y checks por proyecto.

## Demo

`https://jeff-aporta.github.io/jagudeloe-front/`

## Local

1. API: `cd ../back && npm run dev` (puerto 8787).
2. Front: servir esta carpeta (`npx serve .`) y activar switch **local** en la barra.

## Auth

Login vía **system-login** (`system-login:session` en sessionStorage).  
GET de datos ISA es público; POST checks requiere JWT.

## API

Worker **jagudeloe** — `https://jagudeloe.jeffaporta.workers.dev`  
Neon **BD_ISADOC** (sin migración).

## Deploy

Repo público `jagudeloe-front` — GitHub Pages desde rama `main`, carpeta raíz.  
Incluir `.nojekyll` en la raíz.
