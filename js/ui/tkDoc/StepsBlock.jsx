import { getMaterialUI } from "../../core/platform.ts";
import { inlineMdWeb } from "../tkHtml.ts";
import { TK_DOC_RADIUS } from "../../core/tk-table.ts";
import { parsePhaseItems, phaseListFromPayload } from "../../core/tk-doc-steps.ts";
import { glassCardGradientSx, useGlassColors } from "../glassSurface.ts";
import { SoftBadges } from "./SoftBadges.jsx";
import { CodeBlock } from "../CodeBlock.jsx";
import { tkCodeLanguageForRender } from "../../core/tk-code-policy.ts";

function StepRowContent({ row }) {
  const { Box, Typography } = getMaterialUI();

  if (row.type === "step") {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "flex-start",
          mb: 1.5,
        }}
      >
        <Box
          sx={{
            mt: 0.15,
            minWidth: 26,
            height: 26,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "primary.contrastText",
            bgcolor: "primary.main",
          }}
        >
          {row.num}
        </Box>
        <Typography
          variant="body2"
          sx={{ lineHeight: 1.65, flex: 1, pt: 0.25 }}
          dangerouslySetInnerHTML={{ __html: inlineMdWeb(row.text) }}
        />
      </Box>
    );
  }

  if (row.type === "badges") {
    return (
      <Box sx={{ mb: 1.5, pl: 4.75 }}>
        <SoftBadges items={row.items} />
      </Box>
    );
  }

  if (row.type === "code") {
    return (
      <Box sx={{ mb: 1.5, pl: 4.75 }}>
        <CodeBlock code={row.code} language={tkCodeLanguageForRender(row.language)} />
      </Box>
    );
  }

  return null;
}

/** Stepper vertical MUI — fases con pasos numerados y bloques anidados (badges, sql, json). */
export function StepsBlock({ phases }) {
  const { Box, Stepper, Step, StepLabel, StepContent, Typography, Paper } = getMaterialUI();
  const c = useGlassColors();
  const list = phaseListFromPayload(phases);

  if (!list.length) return null;

  let counter = 1;
  const steps = list.map((phase, idx) => {
    const { rows, stepCount } = parsePhaseItems(phase.items ?? [], counter);
    counter += stepCount;
    return {
      key: idx,
      title: String(phase?.title ?? phase?.label ?? ""),
      rows,
      stepCount,
    };
  });

  return (
    <Paper
      variant="outlined"
      elevation={0}
      sx={{
        borderRadius: TK_DOC_RADIUS,
        overflow: "hidden",
        ...glassCardGradientSx(c, { tone: "node" }),
      }}
    >
      <Stepper
        orientation="vertical"
        nonLinear
        sx={{
          p: 2,
          pr: 2.5,
          bgcolor: "transparent",
          "& .MuiStepConnector-line": { minHeight: 16, borderColor: c.border },
          "& .MuiStepLabel-label": { fontWeight: 600, lineHeight: 1.4 },
          "& .MuiStepContent-root": {
            borderLeft: "1px solid",
            borderColor: c.border,
            ml: 1.75,
          },
          "& .MuiStep-root": { "&:last-of-type .MuiStepContent-root": { pb: 0 } },
        }}
      >
        {steps.map((phase) => (
          <Step key={phase.key} active expanded completed>
            <StepLabel
              optional={(
                <Typography variant="caption" color="text.secondary">
                  {phase.stepCount} paso{phase.stepCount === 1 ? "" : "s"}
                </Typography>
              )}
            >
              {phase.title}
            </StepLabel>
            <StepContent TransitionProps={{ unmountOnExit: false }}>
              <Box sx={{ pt: 0.5, pb: 1.5, pl: 0.5 }}>
                {phase.rows.map((row) => (
                  <StepRowContent key={row.key} row={row} />
                ))}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
}
