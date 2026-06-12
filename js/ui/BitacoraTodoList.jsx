/* ui/BitacoraTodoList — checklist interactivo sincronizado con BD. */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";
import { useSession } from "../core/useSession.ts";
import { createBitacoraTodo, deleteBitacoraTodo, updateBitacoraTodo } from "../api/client.ts";
import { renderBitacoraMarkdown } from "../core/bitacora-md.ts";

export function BitacoraTodoList(props) {
  const { useState, useEffect } = getReact();
  const {
    Box, Stack, Checkbox, IconButton, Typography, Tooltip, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  } = getMaterialUI();
  const { Icon } = UI;
  const { loggedIn } = useSession();
  const project = props.project;
  const segmentId = props.segmentId;
  const [todos, setTodos] = useState(() => (Array.isArray(props.todos) ? props.todos : []));
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addText, setAddText] = useState("");

  useEffect(() => {
    setTodos(Array.isArray(props.todos) ? props.todos : []);
  }, [props.todos, props.reloadKey]);

  function notify(next) {
    setTodos(next);
    if (props.onChange) props.onChange(next);
  }

  function fail(e) {
    setError(e instanceof Error ? e.message : String(e));
  }

  function toggleTodo(todo) {
    if (!loggedIn || busyId) return;
    setBusyId(todo.id);
    setError(null);
    const nextChecked = !todo.checked;
    updateBitacoraTodo(project, segmentId, todo.id, { checked: nextChecked })
      .then((r) => notify(r.todos || []))
      .catch(fail)
      .finally(() => setBusyId(null));
  }

  function openEdit(todo) {
    if (!loggedIn) return;
    setEditId(todo.id);
    setEditText(todo.text || "");
    setEditOpen(true);
    setError(null);
  }

  function saveEdit() {
    const text = editText.trim();
    if (!text || !editId || busyId) return;
    setBusyId(editId);
    setError(null);
    updateBitacoraTodo(project, segmentId, editId, { text })
      .then((r) => {
        notify(r.todos || []);
        setEditOpen(false);
      })
      .catch(fail)
      .finally(() => setBusyId(null));
  }

  function removeTodo(todo) {
    if (!loggedIn || busyId) return;
    setBusyId(todo.id);
    setError(null);
    deleteBitacoraTodo(project, segmentId, todo.id)
      .then((r) => notify(r.todos || []))
      .catch(fail)
      .finally(() => setBusyId(null));
  }

  function saveAdd() {
    const text = addText.trim();
    if (!text || busyId) return;
    setBusyId("__add__");
    setError(null);
    createBitacoraTodo(project, segmentId, text)
      .then((r) => {
        notify(r.todos || []);
        setAddOpen(false);
        setAddText("");
      })
      .catch(fail)
      .finally(() => setBusyId(null));
  }

  if (!todos.length && !loggedIn) return null;

  return (
    <Box className="bitacora-todos" sx={{ my: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>{error}</Alert>}
      <Stack spacing={0.25}>
        {todos.map((todo) => {
          const html = renderBitacoraMarkdown(todo.text || "");
          const busy = busyId === todo.id;
          return (
            <Stack key={todo.id} direction="row" alignItems="flex-start" spacing={0.5} className={"bitacora-todo" + (todo.checked ? " is-checked" : "")}>
              <Checkbox
                size="small"
                checked={!!todo.checked}
                disabled={!loggedIn || busy}
                onChange={() => toggleTodo(todo)}
                sx={{ mt: -0.25, flexShrink: 0 }}
                inputProps={{ "aria-label": "Marcar pendiente" }}
              />
              <Box
                className="bitacora-todo-text md-body"
                sx={{ flex: 1, minWidth: 0, pt: 0.5, opacity: todo.checked ? 0.65 : 1, textDecoration: todo.checked ? "line-through" : "none" }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
              {loggedIn && (
                <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
                  <Tooltip title="Editar texto">
                    <span>
                      <IconButton size="small" disabled={busy} onClick={() => openEdit(todo)} aria-label="Editar">
                        <Icon icon="mdi:pencil-outline" size={18} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <span>
                      <IconButton size="small" disabled={busy} onClick={() => removeTodo(todo)} aria-label="Eliminar">
                        <Icon icon="mdi:delete-outline" size={18} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              )}
            </Stack>
          );
        })}
      </Stack>
      {loggedIn && (
        <Button size="small" startIcon={<Icon icon="mdi:plus" size={18} />} sx={{ mt: 1 }} onClick={() => { setAddOpen(true); setAddText(""); setError(null); }}>
          Agregar pendiente
        </Button>
      )}

      <Dialog open={editOpen} onClose={() => !busyId && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar pendiente</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Markdown inline: **negrilla**, `código`, [enlace](url)
          </Typography>
          <TextField
            autoFocus
            multiline
            minRows={3}
            fullWidth
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            disabled={!!busyId}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={!!busyId}>Cancelar</Button>
          <Button variant="contained" onClick={saveEdit} disabled={!!busyId || !editText.trim()}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addOpen} onClose={() => busyId !== "__add__" && setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo pendiente</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            minRows={2}
            fullWidth
            placeholder="Texto del pendiente…"
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            disabled={busyId === "__add__"}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)} disabled={busyId === "__add__"}>Cancelar</Button>
          <Button variant="contained" onClick={saveAdd} disabled={busyId === "__add__" || !addText.trim()}>Agregar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
