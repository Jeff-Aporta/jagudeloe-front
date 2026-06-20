import { getMaterialUI } from "../../core/platform.ts";
import { TK_DOC_RADIUS, tkDocSoftBadgeSx } from "../../core/tk-table.ts";

export { tkDocSoftBadgeSx };

export function SoftBadges({ items }) {
  const { Box, Chip } = getMaterialUI();
  const list = Array.isArray(items) ? items : [];

  if (!list.length) return null;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, my: 1 }}>
      {list.map((item, i) => {
        const label = String(item?.label ?? item?.text ?? "");
        const tone = String(item?.tone ?? "secondary");
        return (
          <Chip
            key={i}
            size="small"
            label={label}
            sx={(t) => {
              const chip = tkDocSoftBadgeSx(tone, t);
              return {
                height: 24,
                fontSize: "0.72rem",
                fontWeight: 600,
                fontFamily: /[./]/.test(label) ? "monospace" : "inherit",
                borderRadius: TK_DOC_RADIUS,
                border: "1px solid",
                bgcolor: chip.bgcolor,
                color: chip.color,
                borderColor: chip.borderColor,
              };
            }}
          />
        );
      })}
    </Box>
  );
}
