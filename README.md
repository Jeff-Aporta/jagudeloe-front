<p align="center">
  <img src="https://api.iconify.design/mdi/notebook-outline.svg?color=%2337474f&width=96&height=96" width="96" height="96" alt="JAGUDELOE" />
</p>

<h1 align="center">jagudeloe-front</h1>

<p align="center"><strong>JAGUDELOE</strong> — bitácora, tickets y revisión para PatyIA y ClientesIS.</p>

## Arquitectura (checks en tiempo real)
![Diagrama de arquitectura](https://mermaid.ink/img/JSV7aW5pdDogeyJmbG93Y2hhcnQiOiB7ImN1cnZlIjogInN0ZXBBZnRlciIsICJodG1sTGFiZWxzIjogdHJ1ZSwgIm5vZGVTcGFjaW5nIjogNDQsICJyYW5rU3BhY2luZyI6IDUyLCAicGFkZGluZyI6IDE4fX19JSUKZmxvd2NoYXJ0IExSCiAgc3ViZ3JhcGggY2xpZW50cyBbRnJvbnRdCiAgICBKW2phZ3VkZWxvZS1mcm9udF0KICBlbmQKICBzdWJncmFwaCBvcmNoIFttYWluLW9yY2hlc3RyYXRvcl0KICAgIFdTWyIvYXBpL3dzIl0KICAgIERPW1NvY2tldEh1YiBET10KICAgIFBYW3Byb3h5XQogIGVuZAogIHN1YmdyYXBoIGJhY2sgW1dvcmtlcnNdCiAgICBDSFtqYWd1ZGVsb2UgUE9TVCAvYXBpL2lzYS8uLi4vY2hlY2tzXQogICAgVEtbamFndWRlbG9lLXRrcyAvYXBpL3RrLypdCiAgZW5kCiAgSiAtLT58V2ViU29ja2V0IHdzc3wgV1MgLS0-IERPCiAgSiAtLT58UkVTVHwgUFggLS0-IENIICYgVEsKICBQWCAtLT58Y2hlY2tzLnVwZGF0ZWQgYnJvYWRjYXN0fCBETwogIERPIC0tPnxwdXNofCBK)

> **Fuente del diagrama:** [`docs/arquitectura.mmd`](docs/arquitectura.mmd) — editar el `.mmd`; regenerar imagen: `node scripts/mermaid-ink-url.mjs jagudeloe/frontend/docs/arquitectura.mmd` (desde `apps/`).

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-2ea44f?logo=githubpages&logoColor=white)](https://jeff-aporta.github.io/jagudeloe-front/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Marked](https://img.shields.io/badge/Marked-12-000000)](https://marked.js.org/)
[![Cloudflare Workers](https://img.shields.io/badge/API-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://github.com/Jeff-Aporta/jagudeloe-back)
[![Neon](https://img.shields.io/badge/BD-Neon%20BD__ISADOC-00E599?logo=neon&logoColor=black)](https://neon.tech/)

## Demo

**https://jeff-aporta.github.io/jagudeloe-front/**

## Vista previa

![Spaces PatyIA · bitácora JAGUDELOE](./docs/gh-pages.png)

> La UI carga en GH Pages; los datos requieren el Worker [`jagudeloe-back`](https://github.com/Jeff-Aporta/jagudeloe-back) desplegado.

## Qué hace

- **PatyIA y ClientesIS**: dos espacios de trabajo en la misma pantalla.
- **Bitácora**: notas del día con texto y consultas SQL.
- **Tickets**: listado y detalle por estado.
- **Revisión**: marcar contenido como revisado (requiere login).
- **Tema** claro/oscuro y modo local o producción.

## Metadatos

Icono: `mdi:notebook-outline` · tema `#37474f` · [`JeffAppMeta`](https://github.com/Jeff-Aporta/front-shared/blob/main/cdn/isa/js/core/app-meta.js).

## Desarrollo local

```bash
cd frontend
npx serve .
# TargetSwitch → modo local si desarrollas backends en wrangler dev
```

Sirva **desde la carpeta `frontend`** (no desde `apps/` ni con Vite en :5173 sin alias). El arranque carga `boot-helper` desde jsDelivr (`@1dbb9fa`); no requiere `/front-shared` local. Tras cambios en front-shared, recargue sin caché (Ctrl+Shift+R).

## Repos relacionados

| Repo | Rol |
|------|-----|
| [jagudeloe-back](https://github.com/Jeff-Aporta/jagudeloe-back) | API JAGUDELOE (Worker) |
| [jagudeloe-front](https://github.com/Jeff-Aporta/jagudeloe-front) | Este panel (GH Pages) |

MIT · [Jeff-Aporta](https://github.com/Jeff-Aporta)
