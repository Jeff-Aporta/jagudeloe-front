import { getReact, getMaterialUI } from "../../core/platform.ts";
import { UI } from "../../core/platform.ts";
import { blocksToEditableJson, parseEditableJson } from "../../core/tk-doc-persist.ts";
import { JsonCodeEditor } from "../../editors/jsonEditor.jsx";
import { TK_DOC_RADIUS } from "../../core/tk-table.ts";

export function TkDocJsonEditorDialog({ open, onClose, blocks, onSave, saving }) {
  const { useState, useEffect } = getReact();
  const {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Typography,
    Stack,
    Box,
  } = getMaterialUI();

  const [text, setText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setText(blocksToEditableJson(blocks ?? []));
  }, [open, blocks]);

  function handleSave() {
    setError("");
    try {
      const parsed = parseEditableJson(text, (blocks ?? []).length);
      onSave(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const sortKeys = (blocks ?? []).map((b) => b.sortKey).join(", ");

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ pb: 1 }}>
        JSON del bloque (TK_DOC)
        {sortKeys ? (
          <Typography component="span" variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5 }}>
            sortKey: {sortKeys}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: TK_DOC_RADIUS,
              overflow: "hidden",
            }}
          >
            {open ? (
              <JsonCodeEditor
                value={text}
                onChange={setText}
                fullPageTitle="JSON del bloque (TK_DOC)"
              />
            ) : null}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar en BD"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function TkDocJsonEditButton({ blocks, onSave, disabled }) {
  const { useState } = getReact();
  const { Tooltip, IconButton } = getMaterialUI();
  const { Icon, Toast } = UI;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!blocks?.length || !onSave) return null;

  async function handleSave(parsed) {
    setSaving(true);
    try {
      await onSave(parsed);
      setOpen(false);
      Toast.show({ message: "TK_DOC actualizado", severity: "success" });
    } catch (e) {
      Toast.show({
        message: e instanceof Error ? e.message : String(e),
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Tooltip title="Ver / editar JSON (TK_DOC)">
        <span>
          <IconButton
            size="small"
            aria-label="Editar JSON del bloque"
            disabled={disabled || saving}
            onClick={() => setOpen(true)}
            sx={{ ml: "auto", opacity: 0.72, "&:hover": { opacity: 1 } }}
          >
            <Icon icon="mdi:code-json" size={18} />
          </IconButton>
        </span>
      </Tooltip>
      <TkDocJsonEditorDialog
        open={open}
        onClose={() => !saving && setOpen(false)}
        blocks={blocks}
        onSave={handleSave}
        saving={saving}
      />
    </>
  );
}
