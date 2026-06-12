/**
 * Carga módulos de la app (TS/JSX) como ESM vía blob URL + Babel standalone.
 * Imports relativos → blob del grafo; bare imports → URLs del import map (esm.sh).
 */

const blobUrls = new Map();

/** Mismas rutas que index.html import map (blob URL no hereda import map). */
const BARE_IMPORTS = {
  react: "https://esm.sh/react@18.3.1",
  "react-dom": "https://esm.sh/react-dom@18.3.1",
  "react-dom/client": "https://esm.sh/react-dom@18.3.1/client?external=react",
  "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
  "@emotion/react": "https://esm.sh/@emotion/react@11.14.0?external=react,react-dom",
  "@emotion/styled": "https://esm.sh/@emotion/styled@11.14.1?external=react,react-dom,@emotion/react",
  "@mui/material": "https://esm.sh/@mui/material@9.1.0?external=react,react-dom,@emotion/react,@emotion/styled",
};

function resolvePath(fromFile, spec) {
  if (!spec.startsWith(".")) return spec;
  const base = fromFile.includes("/") ? fromFile.replace(/\/[^/]*$/, "/") : "";
  const merged = (base + spec).split("/");
  const out = [];
  for (const part of merged) {
    if (part === "" || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}

function babelPresets(file) {
  const reactClassic = ["react", { runtime: "classic" }];
  if (file.endsWith(".jsx")) return [reactClassic];
  if (file.endsWith(".tsx")) return ["typescript", reactClassic];
  if (file.endsWith(".ts")) return ["typescript"];
  return [];
}

function parseImports(source) {
  const specs = new Set();
  const re = /\bfrom\s+['"]([^'"]+)['"]|\bimport\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(source))) specs.add(m[1] || m[2]);
  return [...specs];
}

function rewriteImports(source, urlMap) {
  let out = source;
  for (const [spec, url] of urlMap) {
    out = out.split(`from '${spec}'`).join(`from '${url}'`);
    out = out.split(`from "${spec}"`).join(`from "${url}"`);
    out = out.split(`import '${spec}'`).join(`import '${url}'`);
    out = out.split(`import "${spec}"`).join(`import "${url}"`);
  }
  return out;
}

async function resolveSpecifier(spec, fromFile, Babel, compiling) {
  if (spec.startsWith(".")) {
    const dep = resolvePath(fromFile, spec);
    return compileModule(dep, Babel, compiling);
  }
  if (BARE_IMPORTS[spec]) return BARE_IMPORTS[spec];
  if (spec.startsWith("@mui/material/")) {
    return "https://esm.sh/@mui/material@9.1.0/" + spec.slice("@mui/material/".length) + "?external=react,react-dom,@emotion/react,@emotion/styled";
  }
  return spec;
}

async function compileModule(file, Babel, compiling) {
  if (blobUrls.has(file)) return blobUrls.get(file);
  if (compiling.has(file)) throw new Error("Dependencia circular: " + file);
  compiling.add(file);

  const res = await fetch(file, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar " + file + " (" + res.status + ")");
  let source = await res.text();

  const urlMap = new Map();
  for (const spec of parseImports(source)) {
    const resolved = await resolveSpecifier(spec, file, Babel, compiling);
    urlMap.set(spec, resolved);
  }

  source = rewriteImports(source, urlMap);
  const code = Babel.transform(source, {
    presets: babelPresets(file),
    sourceType: "module",
    filename: file,
  }).code;

  const blob = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
  blobUrls.set(file, blob);
  compiling.delete(file);
  return blob;
}

/** @param {string} entry p.ej. js/main.jsx */
export async function importAppEntry(entry, Babel) {
  if (!Babel?.transform) throw new Error("Babel standalone no cargó");
  blobUrls.clear();
  const url = await compileModule(entry, Babel, new Set());
  return import(url);
}
