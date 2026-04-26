import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {NoteManager} from './noteManager.js';
import {StickyNote} from './stickyNote.js';
import {PanelIndicator} from './panelIndicator.js';

export default class StickyNotesExtension extends Extension {
    enable() {
        this._noteManager = new NoteManager();
        this._noteManager.loadNotes();
        this._notes = this._noteManager.getAllNotes().map(
            data => new StickyNote(data, this._noteManager)
        );
        this._indicator = new PanelIndicator(this._noteManager, this._notes);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        // flushNow cancels pending save timer then writes synchronously
        this._noteManager.flushNow();
        [...this._notes].forEach(n => n.destroy());
        this._notes.length = 0;
        this._indicator.destroy();
        this._indicator = null;
        this._noteManager = null;
    }
}
