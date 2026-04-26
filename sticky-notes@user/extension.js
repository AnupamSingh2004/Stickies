import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class StickyNotesExtension extends Extension {
    enable() {
        console.log('StickyNotes: enabled');
    }

    disable() {
        console.log('StickyNotes: disabled');
    }
}
