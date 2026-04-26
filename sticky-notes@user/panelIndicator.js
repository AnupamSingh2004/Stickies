import GObject from 'gi://GObject';
import St from 'gi://St';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {StickyNote} from './stickyNote.js';

export const PanelIndicator = GObject.registerClass(
class PanelIndicator extends PanelMenu.Button {
    _init(noteManager, notes) {
        super._init(0.0, 'Sticky Notes', false);
        this._noteManager = noteManager;
        // Pre-populated array of StickyNote instances shared with extension.js.
        // Mutate in place only (push / length=0) — never reassign.
        this._notes = notes;
        this._notesVisible = true;
        this._buildUI();
    }

    _buildUI() {
        const icon = new St.Icon({
            icon_name: 'emblem-documents-symbolic',
            style_class: 'system-status-icon',
        });
        this.add_child(icon);

        const newItem = new PopupMenu.PopupMenuItem('New Note');
        newItem.connect('activate', () => this._onNewNote());
        this.menu.addMenuItem(newItem);

        this._toggleItem = new PopupMenu.PopupMenuItem('Hide all notes');
        this._toggleItem.connect('activate', () => this._onToggle());
        this.menu.addMenuItem(this._toggleItem);

        const removeItem = new PopupMenu.PopupMenuItem('Remove all');
        removeItem.connect('activate', () => this._onRemoveAll());
        this.menu.addMenuItem(removeItem);
    }

    _onNewNote() {
        const data = this._noteManager.createNote();
        const note = new StickyNote(data, this._noteManager);
        if (!this._notesVisible)
            note.hide();
        this._notes.push(note);
    }

    _onToggle() {
        this._notesVisible = !this._notesVisible;
        this._notes.forEach(n => this._notesVisible ? n.show() : n.hide());
        this._toggleItem.label.text = this._notesVisible ? 'Hide all notes' : 'Show all notes';
    }

    _onRemoveAll() {
        [...this._notes].forEach(n => {
            this._noteManager.deleteNote(n.id);
            n.destroy();
        });
        this._notes.length = 0;
        this._notesVisible = true;
        this._toggleItem.label.text = 'Hide all notes';
    }
});
