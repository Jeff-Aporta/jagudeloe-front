import { getReact } from "../core/platform.ts";
import {
  fileTreeHintsFromSpec,
  fileTreeSpecFromPayload,
  tk1437191FileTreeSpec,
} from "../core/tk-file-tree.ts";
import { FileTree } from "./tkDoc/FileTree.jsx";

const { useMemo } = getReact();

/** Intérprete payload BD → árbol MUI (List + Collapse). */
export function TkDocFileTree({ payload, commits }) {
  const spec = useMemo(() => {
    if (payload?.preset === "tk1437191") return tk1437191FileTreeSpec();
    return fileTreeSpecFromPayload(payload);
  }, [payload]);

  if (!spec?.tree?.length) return null;

  const hints = useMemo(() => fileTreeHintsFromSpec(spec), [spec]);

  return (
    <FileTree
      spec={spec}
      hints={hints}
      commits={commits}
      commitHash={payload?.commitHash ?? payload?.hash}
      commitProyecto={payload?.commitProyecto ?? payload?.proyecto}
    />
  );
}
