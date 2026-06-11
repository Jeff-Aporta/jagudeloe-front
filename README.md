<p align="center">
  <img src="https://api.iconify.design/mdi/notebook-outline.svg?color=%2337474f&width=96&height=96" width="96" height="96" alt="JAGUDELOE" />
</p>

<h1 align="center">jagudeloe-front</h1>

<p align="center"><strong>JAGUDELOE</strong> — bitácora, tickets tk_* y checks de revisión para PatyIA y ClientesIS.</p>

## Arquitectura (checks en tiempo real)

```mermaid
flowchart LR
  subgraph clients [Front]
    J[jagudeloe-front]
  end
  subgraph orch [main-orchestrator]
    WS["/api/ws"]
    DO[SocketHub DO]
    PX[proxy]
  end
  subgraph back [Workers]
    CH[jagudeloe POST /api/isa/.../checks]
    TK[jagudeloe-tks /api/tk/*]
  end
  J -->|WebSocket wss| WS --> DO
  J -->|REST| PX --> CH & TK
  PX -->|checks.updated broadcast| DO
  DO -->|push| J
```

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

- **Spaces**: PatyIA · ClientesIS (sidebar permanente).
- **Bitácora**: layout + segmentos MD/SQL renderizados (Marked + estilos dedicados).
- **Tickets**: consulta pública del entity store con filtro por estado.
- **Checks**: revisados de bitácora; lectura pública, escritura con JWT.
- **Estado en URL** (`?s=`) para space/subspace.
- **Tema** dodgerblue dark/light y toggle **orquestador local / producción**.

## Metadatos

Icono: `mdi:notebook-outline` · tema `#37474f` · [`JeffAppMeta`](https://github.com/Jeff-Aporta/front-shared/blob/main/cdn/isa/js/core/app-meta.js).

## Desarrollo local

```bash
npx serve .
# main-orchestrator en :8780
```

## Repos relacionados

| Repo | Rol |
|------|-----|
| [jagudeloe-back](https://github.com/Jeff-Aporta/jagudeloe-back) | API JAGUDELOE (Worker) |
| [jagudeloe-front](https://github.com/Jeff-Aporta/jagudeloe-front) | Este panel (GH Pages) |

MIT · [Jeff-Aporta](https://github.com/Jeff-Aporta)
