/**
 * Chip de usuario con menú: entorno (TargetSwitchMenu), test unitario, cerrar sesión.
 * Suplantación (view-as de usuario) erradicada (21-jul-2026) de todos los workers y fronts.
 */
(function () {
  "use strict";
  const React = window.React;
  const MUI = MaterialUI;

  /** Fallback local — preferir ISAFront.buildUserAvatarUrl (isa-patyia / canónico). */
  var AVATAR_BG_PALETTE = [
    "1e90ff", "0ea5e9", "14b8a6", "22c55e", "84cc16",
    "eab308", "f97316", "ef4444", "ec4899", "a855f7",
    "6366f1", "64748b",
  ];
  function avatarBgFromName(name) {
    var h = 0;
    var s = String(name || "");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return AVATAR_BG_PALETTE[h % AVATAR_BG_PALETTE.length];
  }
  function buildAvatarUrl(name, size) {
    var shared = window.ISAFront && window.ISAFront.buildUserAvatarUrl;
    if (typeof shared === "function") return shared(name, size || 64);
    // Fallback local: SVG inline (data URL) — sin ui-avatars.com ni red externa.
    var label = String(name || "").trim() || "Usuario";
    var initials = label.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase() || "U";
    var s = size || 64;
    var half = s / 2;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + " " + s + '"><circle cx="' + half + '" cy="' + half + '" r="' + half + '" fill="#' + avatarBgFromName(label.toLowerCase()) + '"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="' + Math.round(s * 0.42) + '" font-weight="bold" fill="#ffffff">' + initials + "</text></svg>";
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  function isLocalHost() {
    const h = window.location?.hostname || "";
    return h === "localhost" || /^127\.0\.0(?:\.|$)/.test(h) || h === "::1" || h === "[::1]";
  }

  function UserSessionMenu(props) {
    const ns = props.ns || "ISA";
    const bag = window[ns] || {};
    const Session = bag.Session;
    const UI = bag.UI || window.ISAFront.UI || {};
    const Icon = UI.Icon;
    const TargetSwitchMenu = UI.TargetSwitchMenu;
    const ViewAsRoleMenu = UI.ViewAsRoleMenu;
    const UnitTestModal = UI.UnitTestStreamModal;
    const [anchor, setAnchor] = React.useState(null);
    const [testOpen, setTestOpen] = React.useState(false);
    const [, authRev] = React.useState(0);
    const open = Boolean(anchor);

    React.useEffect(function () {
      if (!Session?.EVENT) return undefined;
      function onAuth() { authRev(function (n) { return n + 1; }); }
      window.addEventListener(Session.EVENT, onAuth);
      return function () { window.removeEventListener(Session.EVENT, onAuth); };
    }, [Session]);

    React.useEffect(function () {
      function onCaps() { authRev(function (n) { return n + 1; }); }
      window.addEventListener("patyia-apptools:caps-changed", onCaps);
      return function () { window.removeEventListener("patyia-apptools:caps-changed", onCaps); };
    }, []);

    void authRev;

    const fmt = window.ISAFront || {};
    const chipLabel = fmt.formatSessionChipLabel || function (n) { return String(n || "").trim(); };
    const displayNameFmt = fmt.formatSessionDisplayName || function (n) { return String(n || "").trim(); };
    const headerLabelFn = fmt.resolveSessionHeaderLabel || function (dn, un, fb) {
      return chipLabel(dn || un, fb || un || "Usuario");
    };
    const username = props.username || Session?.username?.() || "";
    const sessionDisplayName = props.displayName !== undefined
      ? (props.displayName || "")
      : (Session?.displayName?.() || "");
    const viewAsRole = String(bag.AppSession?.getViewAsRole?.() || "").trim();
    const viewingAsRole = !!viewAsRole;
    const sessionRole = String(
      props.role
      || bag.AppSession?.resolveDisplayRole?.()
      || bag.AppSession?.getSession?.()?.role
      || Session?.current?.()?.role
      || "",
    ).trim();
    const headerLabel = headerLabelFn(sessionDisplayName, username, username || "Usuario");
    const tooltipLabel = displayNameFmt(sessionDisplayName || username);
    const chipSx = props.chipSx || {};
    const avatarName = sessionDisplayName || username;
    const avatarUrl = props.buildAvatarUrl
      ? props.buildAvatarUrl(avatarName, 64)
      : buildAvatarUrl(avatarName, 64);
    const ariaLabel = (tooltipLabel || headerLabel) + (sessionRole ? " · rol " + sessionRole : "");
    const useChipFallback = !Icon && !String(sessionDisplayName || "").trim();

    function closeMenu() { setAnchor(null); }

    function envSwitchAllowed() {
      if (props.showTarget === false) return false;
      if (props.showTarget === true) return true;
      if (isLocalHost()) return true;
      const Session = bag.Session;
      return !!(Session && Session.can && Session.can("infra.target.switch"));
    }

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        MUI.Box,
        {
          component: "span",
          className: "header-session-wrap",
          sx: { display: "inline-flex", alignItems: "center", flexShrink: 0 },
        },
        React.createElement(
          MUI.Stack,
          { direction: "row", spacing: 0.75, alignItems: "center", className: "header-session-btn" },
          props.signalDot || null,
          React.createElement(
            MUI.Tooltip,
            { title: tooltipLabel || headerLabel, arrow: true },
            useChipFallback
              ? React.createElement(MUI.Chip, {
                size: "small",
                variant: "filled",
                className: "header-session-chip",
                clickable: true,
                label: headerLabel,
                onClick: function (e) { setAnchor(e.currentTarget); },
                sx: Object.assign({ cursor: "pointer" }, chipSx),
                "aria-label": ariaLabel,
                "aria-haspopup": "true",
                "aria-expanded": open ? "true" : "false",
              })
              : React.createElement(MUI.Chip, {
                size: "small",
                variant: "filled",
                className: "header-session-chip",
                clickable: true,
                /* Rol original → avatar UI Avatars; simulación de rol → ojo */
                avatar: viewingAsRole
                  ? undefined
                  : React.createElement(MUI.Avatar, {
                    className: "header-session-avatar",
                    src: avatarUrl,
                    alt: "",
                    sx: { width: 22, height: 22, fontSize: 11 },
                  }),
                icon: viewingAsRole && Icon
                  ? React.createElement(Icon, { icon: "mdi:eye-outline", size: 18 })
                  : undefined,
                label: headerLabel,
                onClick: function (e) { setAnchor(e.currentTarget); },
                sx: Object.assign({
                  cursor: "pointer",
                  height: "auto",
                  minHeight: 28,
                  py: 0.375,
                  px: 1.25,
                  "& .MuiChip-label": { px: 0.25, py: 0.25 },
                  "& .MuiChip-avatar": { width: 22, height: 22, marginLeft: "4px", marginRight: "-2px" },
                }, chipSx, viewingAsRole ? {
                  bgcolor: "rgba(245, 158, 11, 0.18)",
                  border: "1px solid rgba(245, 158, 11, 0.45)",
                } : {}),
                "aria-label": ariaLabel,
                "aria-haspopup": "true",
                "aria-expanded": open ? "true" : "false",
              }),
          ),
        ),
      ),
      React.createElement(
        MUI.Menu,
        {
          anchorEl: anchor,
          open: open,
          onClose: closeMenu,
          disableScrollLock: true,
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          transformOrigin: { vertical: "top", horizontal: "right" },
          slotProps: {
            paper: {
              className: "isa-user-session-menu-paper",
              sx: { minWidth: 240, maxWidth: 280, mt: 0.5, overflow: "hidden" },
            },
            root: { className: "isa-user-session-menu" },
            backdrop: {
              className: "isa-user-session-menu-backdrop",
              sx: {
                backgroundColor: "rgba(0, 0, 0, 0.01)",
                backdropFilter: "none",
                WebkitBackdropFilter: "none",
              },
            },
          },
        },
        React.createElement(
          MUI.Box,
          { sx: { px: 2, py: 1.25 } },
          React.createElement(MUI.Typography, { variant: "subtitle2" }, tooltipLabel),
          sessionRole
            ? React.createElement(MUI.Typography, { variant: "caption", color: "text.secondary" }, "Rol: " + sessionRole)
            : null,
        ),
        React.createElement(MUI.Divider, null),
        // «Ver como rol» — Select embebido (UI.ViewAsRoleMenu; re-render vía caps-changed)
        (typeof (UI.ViewAsRoleMenu || ViewAsRoleMenu) === "function"
          ? React.createElement(UI.ViewAsRoleMenu || ViewAsRoleMenu, { onPicked: closeMenu, key: "view-as-role" })
          : null),
        envSwitchAllowed() && TargetSwitchMenu
          ? React.createElement(
              MUI.MenuItem,
              {
                disableRipple: true,
                sx: {
                  cursor: "default",
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  pl: 2,
                  pr: 1.5,
                  py: 0,
                  minHeight: 36,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  "&:hover": { bgcolor: "transparent" },
                  "& > .MuiBox-root": { width: "100%", maxWidth: "100%" },
                },
                onClick: function (e) { e.stopPropagation(); },
              },
              React.createElement(TargetSwitchMenu, null),
            )
          : null,
        props.runUnitTestUrl && UnitTestModal
          ? React.createElement(
              MUI.MenuItem,
              {
                onClick: function () {
                  closeMenu();
                  setTestOpen(true);
                },
              },
              Icon
                ? React.createElement(
                    MUI.ListItemIcon,
                    { sx: { minWidth: 32 } },
                    React.createElement(Icon, { icon: "mdi:flask-outline", size: 18 }),
                  )
                : null,
              React.createElement(MUI.ListItemText, { primary: "Ejecutar test unitario" }),
            )
          : null,
        React.createElement(MUI.Divider, null),
        React.createElement(
          MUI.MenuItem,
          {
            onClick: function () {
              closeMenu();
              if (props.onLogout) props.onLogout();
            },
          },
          Icon
            ? React.createElement(
                MUI.ListItemIcon,
                { sx: { minWidth: 32 } },
                React.createElement(Icon, { icon: "mdi:logout", size: 18 }),
              )
            : null,
          React.createElement(MUI.ListItemText, { primary: "Cerrar sesión" }),
        ),
      ),
      UnitTestModal && props.runUnitTestUrl
        ? React.createElement(UnitTestModal, {
            open: testOpen,
            onClose: function () { setTestOpen(false); },
            runUrl: props.runUnitTestUrl,
            getAuthHeaders: props.getAuthHeaders,
            title: props.unitTestTitle || "Test unitario",
          })
        : null,
    );
  }

  window.ISAFront = window.ISAFront || {};
  window.ISAFront.UI = window.ISAFront.UI || {};
  window.ISAFront.UI.UserSessionMenu = UserSessionMenu;
})();
