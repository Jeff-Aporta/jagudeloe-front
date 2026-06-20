import { getReact, getMaterialUI } from "../core/platform.ts";
import { UI } from "../core/platform.ts";
import { inlineMdWeb } from "./tkHtml.ts";
import { TK_DOC_RADIUS } from "../core/tk-table.ts";
import {
  stepperSpecFromPayload,
  tk1437191StepperSpec,
} from "../core/tk-stepper.ts";
import { tkHueToHex } from "../core/tk-hue.ts";
import { iconifyApiUrl } from "../core/tk-iconify-inline.ts";
import { glassCardGradientSx, useGlassColors } from "./glassSurface.ts";

const { useMemo } = getReact();

const STEP_ICON_PX = 32;

function NeonStepIcon({ icon, specStep, dark }) {
  const { Box } = getMaterialUI();
  const stroke = specStep.error ? "#ef4444" : tkHueToHex(specStep.hue) ?? "#1e90ff";
  const num = typeof icon === "number" ? icon : 1;

  return (
    <Box
      className="tk-doc-stepper-icon"
      sx={{
        width: STEP_ICON_PX,
        height: STEP_ICON_PX,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: dark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.95)",
        border: "2px solid",
        borderColor: stroke,
        boxShadow: dark
          ? `0 0 14px ${stroke}55, inset 0 0 12px ${stroke}22`
          : `0 0 12px ${stroke}33`,
        backgroundImage: specStep.icon ? `url(${iconifyApiUrl(specStep.icon, specStep.hue)})` : undefined,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "16px 16px",
      }}
    >
      {!specStep.icon && (
        <Box component="span" sx={{ fontSize: "0.72rem", fontWeight: 700, color: stroke }}>
          {num}
        </Box>
      )}
    </Box>
  );
}

function StepLabelContent({ step, dark }) {
  const { Box, Typography } = getMaterialUI();
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="body2"
        component="div"
        sx={{ fontWeight: 700, lineHeight: 1.45, color: dark ? "#e2e8f0" : "#0b2e4e" }}
        dangerouslySetInnerHTML={{ __html: inlineMdWeb(step.label) }}
      />
    </Box>
  );
}

export function TkDocStepper({ payload }) {
  const { Box, Stepper, Step, StepLabel, StepContent, Typography, Paper, useTheme } = getMaterialUI();
  const { Icon } = UI;
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const c = useGlassColors();

  const spec = useMemo(() => {
    if (payload?.preset === "tk1437191") return tk1437191StepperSpec();
    return stepperSpecFromPayload(payload ?? {});
  }, [payload]);

  if (!spec?.steps?.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Stepper no disponible (JSON inválido).
      </Typography>
    );
  }

  const vertical = spec.orientation !== "horizontal";
  const caption = payload?.caption ?? payload?.note ?? spec.subtitle ?? "";

  return (
    <Box className="tk-doc-stepper" sx={{ my: 0.5 }}>
      <Paper
        variant="outlined"
        elevation={0}
        className={`tk-doc-stepper-neon${dark ? " is-dark" : ""}`}
        sx={{
          borderRadius: TK_DOC_RADIUS,
          overflow: "hidden",
          border: 1,
          borderColor: dark ? "rgba(30,144,255,0.22)" : "rgba(30,144,255,0.14)",
          boxShadow: dark
            ? "0 0 24px rgba(30,144,255,0.12), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 4px 24px rgba(15,23,42,0.06), 0 0 20px rgba(30,144,255,0.06)",
          ...glassCardGradientSx(c, { tone: "node" }),
        }}
      >
        {(spec.title || spec.subtitle) && (
          <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
            {spec.title && (
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: dark ? "#e2e8f0" : "#0b2e4e" }}
                dangerouslySetInnerHTML={{ __html: inlineMdWeb(spec.title) }}
              />
            )}
            {spec.subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.25 }}
                dangerouslySetInnerHTML={{ __html: inlineMdWeb(spec.subtitle) }}
              />
            )}
          </Box>
        )}

        <Stepper
          orientation={vertical ? "vertical" : "horizontal"}
          alternativeLabel={!vertical && spec.alternativeLabel}
          nonLinear={!spec.linear}
          activeStep={spec.steps.length}
          sx={{
            p: 2,
            pr: vertical ? 2.5 : 2,
            bgcolor: "transparent",
            "--StepIcon-size": `${STEP_ICON_PX}px`,
            "& .MuiStepLabel-iconContainer": {
              width: STEP_ICON_PX,
              minWidth: STEP_ICON_PX,
              flexShrink: 0,
              justifyContent: "center",
            },
            "& .MuiStepConnector-root": {
              marginLeft: `calc(${STEP_ICON_PX}px / 2 - 1px)`,
            },
            "& .MuiStepConnector-line": {
              minHeight: vertical ? 18 : undefined,
              borderColor: dark ? "rgba(56,189,248,0.35)" : "rgba(30,144,255,0.28)",
            },
            "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line, & .MuiStepConnector-root.Mui-completed .MuiStepConnector-line": {
              borderColor: dark ? "rgba(56,189,248,0.55)" : "rgba(30,144,255,0.45)",
            },
            "& .MuiStepContent-root": {
              borderLeft: vertical ? "1px solid" : "none",
              borderColor: c.border,
              marginLeft: `calc(${STEP_ICON_PX}px / 2 - 1px)`,
              paddingLeft: 2,
            },
            "& .MuiStep-root": {
              "&:last-of-type .MuiStepContent-root": { pb: 0 },
            },
          }}
        >
          {spec.steps.map((step, idx) => (
            <Step key={step.id ?? idx} active completed expanded={vertical}>
              <StepLabel
                error={step.error}
                optional={
                  step.optional ? (
                    <Typography variant="caption" color="text.secondary">
                      {step.optionalLabel ?? "Opcional"}
                    </Typography>
                  ) : undefined
                }
                StepIconComponent={(props) => (
                  <NeonStepIcon {...props} specStep={step} dark={dark} />
                )}
              >
                <StepLabelContent step={step} dark={dark} />
              </StepLabel>
              {vertical && step.description && (
                <StepContent TransitionProps={{ unmountOnExit: false }}>
                  <Box
                    sx={{
                      pt: 0.25,
                      pb: 1.5,
                      pl: 0.5,
                      "& .tk-inline-code": {
                        fontFamily: "Consolas, Menlo, monospace",
                        fontSize: "0.82em",
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.65 }}
                      dangerouslySetInnerHTML={{ __html: inlineMdWeb(step.description) }}
                    />
                    {step.error && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1 }}>
                        <Icon icon="mdi:alert-circle-outline" size={16} />
                        <Typography variant="caption" color="error">
                          Validación de error esperada
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </StepContent>
              )}
            </Step>
          ))}
        </Stepper>
      </Paper>
      {caption && !spec.subtitle && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1 }}
          dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(caption)) }}
        />
      )}
    </Box>
  );
}
