/* Modal — especificaciones del sistema de calificación de TKs. */
import { getReact, getMaterialUI } from "../core/platform.ts";
import { UI } from "../core/platform.ts";
import { TK_CALIFICACION_SPECS } from "../core/tk-calificacion.ts";
import { useGlassColors, glassInnerSx } from "./glassSurface.ts";

const { useState } = getReact();

const PESO_COLORS = {
  45: "#1e90ff",
  30: "#7c3aed",
  15: "#0891b2",
  10: "#d97706",
};

export function TkCalificacionInfoButton({ sx }) {
  const [open, setOpen] = useState(false);
  const { IconButton, Tooltip } = getMaterialUI();

  return (
    <>
      <Tooltip title="Sistema de calificación de TKs">
        <IconButton
          size="small"
          aria-label="Información sistema de calificación"
          onClick={() => setOpen(true)}
          sx={{ color: "text.secondary", ...sx }}
        >
          <UI.Icon icon="mdi:information-outline" size={22} />
        </IconButton>
      </Tooltip>
      <TkCalificacionInfoModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function TkCalificacionInfoModal({ open, onClose }) {
  const c = useGlassColors();
  const { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Stack, Chip } = getMaterialUI();
  const { Icon } = UI;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
        <Icon icon="mdi:clipboard-check-outline" size={24} />
        Sistema de calificación de TKs
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: c.pageBg }}>
        <Typography variant="body2" sx={{ color: c.muted, mb: 2, lineHeight: 1.6 }}>
          Modelo de gestión para medir desempeño en producción. Cuatro componentes con pesos que suman 100%.
          Los tiempos de atención y solución se calculan en <strong>horario hábil</strong> (lun–vie, 7:00–17:00, almuerzo excluido).
        </Typography>
        <Stack spacing={1.5}>
          {TK_CALIFICACION_SPECS.map((spec) => (
            <Box
              key={spec.key}
              sx={{
                p: 1.75,
                borderRadius: 1.5,
                border: 1,
                borderColor: c.border,
                ...glassInnerSx(c, "node"),
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.75 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: c.text, flex: 1, minWidth: 160 }}>
                  {spec.titulo}
                </Typography>
                <Chip
                  size="small"
                  label={`${spec.peso}%`}
                  sx={{
                    height: 24,
                    fontWeight: 700,
                    bgcolor: `${PESO_COLORS[spec.peso] ?? c.text}22`,
                    color: PESO_COLORS[spec.peso] ?? c.text,
                    border: "1px solid",
                    borderColor: `${PESO_COLORS[spec.peso] ?? c.text}44`,
                  }}
                />
              </Stack>
              <Typography variant="body2" sx={{ color: c.text, lineHeight: 1.55, mb: 0.75 }}>
                {spec.descripcion}
              </Typography>
              <Typography variant="body2" sx={{ color: c.muted, lineHeight: 1.5 }}>
                <strong>Meta:</strong> {spec.meta}
              </Typography>
              {spec.notas && (
                <Typography variant="caption" sx={{ display: "block", color: c.muted, mt: 0.75, fontStyle: "italic", lineHeight: 1.45 }}>
                  {spec.notas}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} variant="contained" size="small">
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}
