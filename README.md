# Sticky Notes (GNOME Shell Extension)

Place draggable sticky notes on your GNOME desktop. Notes are editable, resizable, and persist across sessions.

## Features

1. Create notes from the panel menu
2. Drag notes by the header and resize from the bottom-right corner
3. Hide/show all notes quickly
4. Remove all notes in one click
5. Auto-save on every change with persisted size and position

## Requirements

1. GNOME Shell 46
2. GNOME Extensions app or the `gnome-extensions` CLI

## Installation (local)

1. Copy the extension directory:

```
mkdir -p ~/.local/share/gnome-shell/extensions
cp -r sticky-notes@user ~/.local/share/gnome-shell/extensions/
```

2. Restart GNOME Shell:
   - Xorg: press `Alt` + `F2`, type `r`, press `Enter`
   - Wayland: log out and back in

3. Enable the extension:

```
gnome-extensions enable sticky-notes@user
```

You can also enable it from the Extensions app.

## Usage

From the panel icon:

1. **New Note** creates a new note centered on the primary monitor
2. **Hide all notes** / **Show all notes** toggles visibility
3. **Remove all** deletes every note

Inside a note:

1. Drag the header to move the note
2. Drag the bottom-right handle to resize (minimum 120x80, maximum 600x600)
3. Click **✕** to delete a note
4. Press **Esc** to release text focus

## Data Storage

Notes are stored as JSON in:

```
~/.local/share/sticky-notes/notes.json
```

Each note includes `id`, `x`, `y`, `width`, `height`, and `content`. Changes are auto-saved with a short debounce to avoid excessive disk writes.

## Project Structure

| Path | Purpose |
| --- | --- |
| `sticky-notes@user/extension.js` | Extension entry point; loads notes and registers the panel indicator |
| `sticky-notes@user/noteManager.js` | Note persistence and CRUD operations |
| `sticky-notes@user/stickyNote.js` | Note UI, drag/resize behavior, text handling |
| `sticky-notes@user/panelIndicator.js` | Panel menu, visibility toggles, bulk actions |
| `sticky-notes@user/metadata.json` | Extension metadata (name, UUID, shell version) |

## Development

1. Edit files under `sticky-notes@user/`
2. Reload the extension:

```
gnome-extensions disable sticky-notes@user
gnome-extensions enable sticky-notes@user
```

## Uninstall

```
gnome-extensions disable sticky-notes@user
rm -rf ~/.local/share/gnome-shell/extensions/sticky-notes@user
rm -rf ~/.local/share/sticky-notes
```


