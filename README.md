# jagudeloe-front

Panel **ISA-DOC** tipo Notion para documentación operativa de proyectos **PatyIA** y **ClientesIS**. Organiza la información en *spaces* y subspaces: **bitácora** (markdown + SQL segmentado), **tickets** del entity store y **checks** de revisión — todo contra la BD `BD_ISADOC` vía el microservicio `jagudeloe`.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-2ea44f?logo=githubpages&logoColor=white)](https://jeff-aporta.github.io/jagudeloe-front/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MUI](https://img.shields.io/badge/MUI-5-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![Babel Standalone](https://img.shields.io/badge/Babel%20Standalone-7-F9DC3E?logo=babel&logoColor=black)](https://babeljs.io/)
[![Marked](https://img.shields.io/badge/Marked-12-000000)](https://marked.js.org/)
[![SignalR](https://img.shields.io/badge/SignalR-opcional-512BD4?logo=.net&logoColor=white)](https://github.com/dotnet/aspnetcore)
[![Cloudflare Workers](https://img.shields.io/badge/API-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://github.com/Jeff-Aporta/jagudeloe-back)
[![Neon](https://img.shields.io/badge/BD-Neon%20BD__ISADOC-00E599?logo=neon&logoColor=black)](https://neon.tech/)
[![system-login](https://img.shields.io/badge/auth-system--login-007FFF)](https://github.com/Jeff-Aporta/system-login-front)
[![Sin build](https://img.shields.io/badge/build-sin%20paso%20de%20build-555)](https://github.com/Jeff-Aporta/jagudeloe-front)

## Demo

**https://jeff-aporta.github.io/jagudeloe-front/**

## Vista previa

![Spaces PatyIA · bitácora ISA-DOC](./docs/gh-pages.png)

> La UI carga en GH Pages; los datos requieren el Worker [`jagudeloe-back`](https://github.com/Jeff-Aporta/jagudeloe-back) desplegado.

## Qué hace

- **Spaces**: PatyIA · ClientesIS (sidebar permanente).
- **Bitácora**: layout + segmentos MD/SQL renderizados (Marked + estilos dedicados).
- **Tickets**: consulta pública del entity store con filtro por estado.
- **Checks**: revisados de bitácora; lectura pública, escritura con JWT.
- **Estado en URL** (`?s=`) para space/subspace; almacenamiento extenso en localStorage / IndexedDB.
- **Tema** dodgerblue dark/light y toggle **local :8787 / online**.

Sustituye el front legacy `ISA-JAGUDELOE` y deja de depender de langlab Azure para datos ISA.

## Desarrollo local

```bash
cd ../back && npm run dev    # Worker :8787
npx serve .                  # front + switch "local"
```

## Repos relacionados

| Repo | Rol |
|------|-----|
| [jagudeloe-back](https://github.com/Jeff-Aporta/jagudeloe-back) | API ISA-DOC (privado) |
| [jagudeloe-front](https://github.com/Jeff-Aporta/jagudeloe-front) | Este panel (público, GH Pages) |

MIT · [Jeff-Aporta](https://github.com/Jeff-Aporta)
