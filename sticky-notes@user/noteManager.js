import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

const DATA_DIR = GLib.build_filenamev([GLib.get_home_dir(), '.local', 'share', 'sticky-notes']);
const DATA_FILE = GLib.build_filenamev([DATA_DIR, 'notes.json']);

export class NoteManager {
    constructor() {
        this._notes = [];
        this._saveTimer = null;
    }

    loadNotes() {
        this._notes = [];
        try {
            const file = Gio.File.new_for_path(DATA_FILE);
            const [, contents] = file.load_contents(null);
            this._notes = JSON.parse(new TextDecoder().decode(contents));
        } catch (e) {
            if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
                console.warn('StickyNotes: could not load notes:', e.message);
            this._notes = [];
        }
    }

    getAllNotes() {
        return [...this._notes];
    }

    createNote() {
        const monitor = global.display.get_primary_monitor();
        const geo = global.display.get_monitor_geometry(monitor);
        const note = {
            id: GLib.uuid_string_random(),
            x: Math.round(geo.x + (geo.width - 260) / 2),
            y: Math.round(geo.y + (geo.height - 240) / 2),
            width: 260,
            height: 240,
            content: '',
        };
        this._notes.push(note);
        this._scheduleSave();
        return note;
    }

    updateNote(id, delta) {
        const note = this._notes.find(n => n.id === id);
        if (note)
            Object.assign(note, delta);
        this._scheduleSave();
    }

    deleteNote(id) {
        this._notes = this._notes.filter(n => n.id !== id);
        this._scheduleSave();
    }

    flushNow() {
        if (this._saveTimer) {
            GLib.source_remove(this._saveTimer);
            this._saveTimer = null;
        }
        this._writeNow();
    }

    _scheduleSave() {
        if (this._saveTimer) {
            GLib.source_remove(this._saveTimer);
            this._saveTimer = null;
        }
        this._saveTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
            this._writeNow();
            this._saveTimer = null;
            return GLib.SOURCE_REMOVE;
        });
    }

    _writeNow() {
        try {
            GLib.mkdir_with_parents(DATA_DIR, 0o755);
            const file = Gio.File.new_for_path(DATA_FILE);
            const bytes = new TextEncoder().encode(JSON.stringify(this._notes, null, 2));
            file.replace_contents(bytes, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        } catch (e) {
            console.error('StickyNotes: save failed:', e.message);
        }
    }
}
