/** Radio unificado jagudeloe — modales, cards, inputs y botones MUI. */

import { TK_DOC_RADIUS } from "./tk-table.ts";

type ThemeBag = {
  makeTheme: (mode: string) => object;
  useThemeMode: () => { mode: string; toggle: () => void; theme: object };
  __jagudeloeRadiusPatched?: boolean;
};

export function patchJagudeloeThemeRadius(): void {
  const bag = window.ISAJ;
  const Theme = bag?.Theme as ThemeBag | undefined;
  const React = window.React;
  const MUI = window.MaterialUI;
  if (!Theme || Theme.__jagudeloeRadiusPatched || !React || !MUI?.createTheme) return;

  const R = TK_DOC_RADIUS;
  const radiusLayer = {
    shape: { borderRadius: 8 },
    components: {
      MuiDialog: { styleOverrides: { paper: { borderRadius: R } } },
      MuiButton: { styleOverrides: { root: { borderRadius: R } } },
      MuiIconButton: { styleOverrides: { root: { borderRadius: R } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: R } } },
      MuiFilledInput: { styleOverrides: { root: { borderRadius: R } } },
      MuiInputBase: { styleOverrides: { root: { borderRadius: R } } },
      MuiPaper: { styleOverrides: { rounded: { borderRadius: R }, outlined: { borderRadius: R } } },
      MuiCard: { styleOverrides: { root: { borderRadius: R } } },
      MuiChip: { styleOverrides: { root: { borderRadius: R } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: R } } },
      MuiAutocomplete: { styleOverrides: { paper: { borderRadius: R, overflow: "hidden" } } },
    },
  };

  const baseMake = Theme.makeTheme.bind(Theme);
  const makeTheme = (mode: string) => MUI.createTheme(baseMake(mode), radiusLayer);
  Theme.makeTheme = makeTheme;

  const origUse = Theme.useThemeMode.bind(Theme);
  Theme.useThemeMode = function useJagudeloeThemeMode() {
    const result = origUse();
    const theme = React.useMemo(() => makeTheme(result.mode), [result.mode]);
    return { mode: result.mode, toggle: result.toggle, theme };
  };

  Theme.__jagudeloeRadiusPatched = true;
}
