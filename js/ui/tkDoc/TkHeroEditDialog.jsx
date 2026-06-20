import { getReact, getMaterialUI } from "../../core/platform.ts";
import { UI } from "../../core/platform.ts";
import { patchTicketHead } from "../../api/client.ts";
import {
  resolveDocumentadorBlock,
  resolveDocumentadorCargo,
  resolveDocumentadorNombre,
} from "../tkHeroAuthors.ts";

function readForm(tk) {
  return {
    titulo: String(tk?.titulo ?? tk?.title ?? ""),
    solicitante: String(tk?.solicitante ?? ""),
    resumen: String(tk?.resumen ?? ""),
    documentadorNombre: resolveDocumentadorNombre(tk ?? {}),
    documentadorCargo: resolveDocumentadorCargo(tk ?? {}),
  };
}

export function TkHeroEditDialog({ open, onClose, tk, project, onSaved, saving, setSaving }) {
  const { useState, useEffect } = getReact();
  const {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Alert,
    Typography,
  } = getMaterialUI();

  const [form, setForm] = useState(() => readForm(tk));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(readForm(tk));
  }, [open, tk]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setError("");
    const titulo = form.titulo.trim();
    if (!titulo) {
      setError("El título es obligatorio.");
      return;
    }

    const space = String(project || tk?.space || "patyia").toLowerCase();
    const iticket = String(tk?.iticket ?? "");
    if (!iticket) {
      setError("iticket requerido.");
      return;
    }

    setSaving(true);
    try {
      const res = await patchTicketHead(space, iticket, {
        titulo,
        solicitante: form.solicitante.trim() || null,
        resumen: form.resumen.trim() || null,
        documentadorNombre: form.documentadorNombre.trim() || null,
        documentadorCargo: form.documentadorCargo.trim() || null,
      });
      if (!res?.ticket) throw new Error("Respuesta inválida del worker");
      onSaved?.(res.ticket);
      onClose();
      UI.Toast.show({ message: "Información general actualizada", severity: "success" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const docBlock = resolveDocumentadorBlock(tk ?? {});

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ pb: 1 }}>
        Información general del ticket
        <Typography component="span" variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5 }}>
          Cabecera TK_TICKET · no modifica bloques del doc
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Título"
            value={form.titulo}
            onChange={(e) => setField("titulo", e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Solicitante (Tiquete creado por)"
            value={form.solicitante}
            onChange={(e) => setField("solicitante", e.target.value)}
            fullWidth
            placeholder="Asesora Viviana Restrepo Quintero"
          />
          <TextField
            label="Resumen / solicitud (párrafo intro)"
            value={form.resumen}
            onChange={(e) => setField("resumen", e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          <TextField
            label={docBlock?.label || "Documentador"}
            value={form.documentadorNombre}
            onChange={(e) => setField("documentadorNombre", e.target.value)}
            fullWidth
            placeholder="Jeffrey Alexander Agudelo Espitia"
          />
          <TextField
            label="Cargo del documentador"
            value={form.documentadorCargo}
            onChange={(e) => setField("documentadorCargo", e.target.value)}
            fullWidth
            placeholder="Desarrollador Semi senior de InSoft SAS"
          />
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

export function TkHeroEditButton({ tk, project, onSaved, disabled }) {
  const { useState } = getReact();
  const { Tooltip, IconButton } = getMaterialUI();
  const { Icon } = UI;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <>
      <Tooltip title="Editar información general">
        <span>
          <IconButton
            size="small"
            aria-label="Editar información general del ticket"
            disabled={disabled || saving}
            onClick={() => setOpen(true)}
            sx={(t) => ({
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 2,
              bgcolor: t.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(30,144,255,0.08)",
              color: t.palette.mode === "dark" ? "#fff" : t.palette.primary.main,
              "&:hover": {
                bgcolor: t.palette.mode === "dark" ? "rgba(255,255,255,0.22)" : "rgba(30,144,255,0.16)",
              },
            })}
          >
            <Icon icon="mdi:form-select" size={18} />
          </IconButton>
        </span>
      </Tooltip>
      <TkHeroEditDialog
        open={open}
        onClose={() => !saving && setOpen(false)}
        tk={tk}
        project={project}
        onSaved={onSaved}
        saving={saving}
        setSaving={setSaving}
      />
    </>
  );
}
