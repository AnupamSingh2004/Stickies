import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export const StickyNote = GObject.registerClass(
class StickyNote extends GObject.Object {
    _init(data, noteManager) {
        super._init();
        this._id = data.id;
        this._noteManager = noteManager;
        this._buildActors(data);
    }

    get id() {
        return this._id;
    }

    show() {
        this._body.show();
        this._resizeHandle.show();
    }

    hide() {
        this._body.hide();
        this._resizeHandle.hide();
    }

    destroy() {
        this._resizeHandle.destroy();
        this._body.destroy();
    }

    _buildActors(data) {
        // Body
        this._body = new St.Widget({
            reactive: true,
            width: data.width,
            height: data.height,
            x: data.x,
            y: data.y,
            style: `background-color: #ffff88; border-radius: 6px;
                    box-shadow: 2px 2px 6px rgba(0,0,0,0.4);`,
        });
        this._body.layout_manager = new Clutter.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
        });
        Main.uiGroup.add_child(this._body);

        // Header — full row is the drag target
        this._header = new St.BoxLayout({
            reactive: true,
            style: 'background-color: #e6e600; border-radius: 6px 6px 0 0; padding: 4px 8px; min-height: 28px;',
        });
        this._body.add_child(this._header);

        // Spacer that fills header so user has a wide drag target
        this._spacer = new St.Label({text: '', x_expand: true});
        this._header.add_child(this._spacer);

        this._closeBtn = new St.Button({
            label: '✕',
            style: 'color: #555; padding: 0 2px; font-size: 13px;',
        });
        this._header.add_child(this._closeBtn);

        // Text area
        this._text = new Clutter.Text({
            editable: true,
            reactive: true,
            single_line_mode: false,
            line_wrap: true,
            x_expand: true,
            y_expand: true,
            text: data.content,
        });
        this._body.add_child(this._text);

        // Resize handle — separate child of global.stage, bound to body's bottom-right
        this._resizeHandle = new St.Widget({
            reactive: true,
            width: 16,
            height: 16,
            style: 'background-color: #cccc00; border-radius: 0 0 6px 0;',
        });
        this._resizeHandle.add_constraint(new Clutter.BindConstraint({
            source: this._body,
            coordinate: Clutter.BindCoordinate.X,
            offset: data.width - 20,
        }));
        this._resizeHandle.add_constraint(new Clutter.BindConstraint({
            source: this._body,
            coordinate: Clutter.BindCoordinate.Y,
            offset: data.height - 20,
        }));
        Main.uiGroup.add_child(this._resizeHandle);

        this._connectEvents();
    }

    _connectEvents() {
        // Bring note to front on any click
        this._body.connect('button-press-event', () => {
            Main.uiGroup.set_child_above_sibling(this._body, null);
            Main.uiGroup.set_child_above_sibling(this._resizeHandle, null);
            return Clutter.EVENT_PROPAGATE;
        });

        // Drag — use global.stage.grab() for Wayland-compatible pointer capture
        this._header.connect('button-press-event', (_actor, event) => {
            [this._dragStartX, this._dragStartY] = event.get_coords();
            this._noteStartX = this._body.x;
            this._noteStartY = this._body.y;
            this._dragGrab = global.stage.grab(this._header);
            this._motionId = this._header.connect('motion-event', this._onDragMotion.bind(this));
            this._releaseId = this._header.connect('button-release-event', this._onDragRelease.bind(this));
            return Clutter.EVENT_STOP;
        });

        // Resize — same grab pattern
        this._resizeHandle.connect('button-press-event', (_actor, event) => {
            [this._resizePX, this._resizePY] = event.get_coords();
            this._resizeStartW = this._body.width;
            this._resizeStartH = this._body.height;
            this._resizeGrab = global.stage.grab(this._resizeHandle);
            this._resizeMotionId = this._resizeHandle.connect('motion-event', this._onResizeMotion.bind(this));
            this._resizeReleaseId = this._resizeHandle.connect('button-release-event', this._onResizeRelease.bind(this));
            return Clutter.EVENT_STOP;
        });

        // Escape releases text focus
        this._text.connect('key-press-event', (_actor, event) => {
            if (event.get_key_symbol() === Clutter.KEY_Escape) {
                global.stage.set_key_focus(null);
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });

        // Auto-save on every keystroke
        this._text.connect('text-changed', () => {
            this._noteManager.updateNote(this._id, {content: this._text.get_text()});
        });

        // Delete note
        this._closeBtn.connect('clicked', () => {
            this._noteManager.deleteNote(this._id);
            this._resizeHandle.destroy();
            this._body.destroy();
        });
    }

    _onDragMotion(_actor, event) {
        const [x, y] = event.get_coords();
        this._body.set_position(
            this._noteStartX + (x - this._dragStartX),
            this._noteStartY + (y - this._dragStartY)
        );
        return Clutter.EVENT_STOP;
    }

    _onDragRelease() {
        if (this._dragGrab) {
            this._dragGrab.dismiss();
            this._dragGrab = null;
        }
        this._header.disconnect(this._motionId);
        this._header.disconnect(this._releaseId);
        this._motionId = null;
        this._releaseId = null;
        this._noteManager.updateNote(this._id, {x: this._body.x, y: this._body.y});
        return Clutter.EVENT_STOP;
    }

    _onResizeMotion(_actor, event) {
        const [x, y] = event.get_coords();
        const newW = Math.max(120, Math.min(600, this._resizeStartW + (x - this._resizePX)));
        const newH = Math.max(80, Math.min(600, this._resizeStartH + (y - this._resizePY)));
        this._body.set_size(newW, newH);
        this._updateResizeConstraints(newW, newH);
        return Clutter.EVENT_STOP;
    }

    _onResizeRelease() {
        if (this._resizeGrab) {
            this._resizeGrab.dismiss();
            this._resizeGrab = null;
        }
        this._resizeHandle.disconnect(this._resizeMotionId);
        this._resizeHandle.disconnect(this._resizeReleaseId);
        this._resizeMotionId = null;
        this._resizeReleaseId = null;
        this._noteManager.updateNote(this._id, {
            width: this._body.width,
            height: this._body.height,
        });
        return Clutter.EVENT_STOP;
    }

    _updateResizeConstraints(width, height) {
        const constraints = this._resizeHandle.get_constraints();
        constraints[0].offset = width - 20;
        constraints[1].offset = height - 20;
    }
});
