/** Tipos compartidos del visor doc TK — sin dependencias de layout/interpreter. */

export type TkDocBlock = {
  kind?: string;
  payload?: Record<string, unknown>;
  sortKey?: number;
  blocks?: TkDocBlock[];
};

/** Bloque editable TK_DOC (persistencia / editor JSON). */
export type TkDocEditableBlock = {
  kind: string;
  sortKey: number;
  payload: Record<string, unknown>;
  blocks?: TkDocEditableBlock[];
};
