import { getReact } from "../core/platform.ts";
import { isStandardMappedTitle } from "../core/tk-doc-sections.ts";
import {
  tableSpecFromPayload,
  tk1437191ArchivosTableSpec,
} from "../core/tk-doc-table.ts";
import { DataTable } from "./tkDoc/DataTable.jsx";

const { useMemo } = getReact();

/** Intérprete payload BD → tabla MUI (headers + rows 2D). */
export function TkDocTable({ payload }) {
  const spec = useMemo(() => {
    if (payload?.preset === "tk1437191-archivos") return tk1437191ArchivosTableSpec();
    return tableSpecFromPayload(payload);
  }, [payload]);

  if (!spec?.rows?.length) return null;

  const title = isStandardMappedTitle(String(spec.title ?? "")) ? undefined : spec.title;

  return (
    <DataTable
      headers={spec.headers}
      rows={spec.rows}
      title={title}
      caption={spec.caption}
    />
  );
}
