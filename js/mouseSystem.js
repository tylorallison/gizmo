export { MouseSystem };

import { Hierarchy } from './hierarchy.js';
import { System } from './system.js';
import { UiCanvas } from './uiCanvas.js';
import { EvtSystem } from './event.js';
import { Vect } from './vect.js';
import { Bounds } from './bounds.js';
import { Fmt } from './fmt.js';

class MouseSystem extends System {
    // STATIC VARIABLES ----------------------------------------------------
    static dfltIterateTTL = 0;
    static dfltMatchFcn = (v) => v.constructor.mousable;

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpre(spec={}) {
        super.cpre(spec);
        // -- bind event handlers
        this.onClicked = this.onClicked.bind(this);
        this.onMoved = this.onMoved.bind(this);
        this.onPressed = this.onPressed.bind(this);
        this.onUnpressed = this.onUnpressed.bind(this);
    }
    cpost(spec={}) {
        super.cpost(spec);
        // -- mouse is associated w/ doc canvas element...
        let canvasId = spec.canvasId || UiCanvas.dfltCanvasID;
        this.canvas = spec.canvas || UiCanvas.getCanvas(canvasId);
        // -- mouse state
        this.x = 0;
        this.y = 0;
        this.pressed = false;
        this.clicked = false;
        this.dbg = spec.dbg;
        // -- locator: use a locator to identify entities to be evaluated for mouse events
        this.locator = spec.locator;
        // -- register event handlers
        this.canvas.addEventListener('mousemove', this.onMoved.bind(this));
        this.canvas.addEventListener('click', this.onClicked.bind(this));
        this.canvas.addEventListener('mousedown', this.onPressed.bind(this));
        this.canvas.addEventListener('mouseup', this.onUnpressed.bind(this));
    }
    destroy() {
        this.canvas.removeEventListener('mousemove', this.onMoved);
        this.canvas.removeEventListener('click', this.onClicked);
        this.canvas.removeEventListener('mousedown', this.onPressed);
        this.canvas.removeEventListener('mouseup', this.onUnpressed);
    }

    // EVENT HANDLERS ------------------------------------------------------
    onClicked(evt) {
        // capture event data...
        let data = {
            actor: this,
            old_x: this.x,
            old_y: this.y,
            x: evt.offsetX,
            y: evt.offsetY,
        }
        // update mouse state
        this.x = evt.offsetX;
        this.y = evt.offsetY;
        this.active = true;
        this.clicked = true;
        // trigger event
        EvtSystem.trigger(this, 'mouse.clicked', data);
    }
    onMoved(evt) {
        // capture event data...
        let data = {
            actor: this,
            old_x: this.x,
            old_y: this.y,
            x: evt.offsetX,
            y: evt.offsetY,
        }
        // update mouse state
        this.x = evt.offsetX;
        this.y = evt.offsetY;
        this.active = true;
        // trigger event
        EvtSystem.trigger(this, 'mouse.moved', data);
    }

    onPressed(evt) {
        this.pressed = true;
        this.active = true;
    }
    onUnpressed(evt) {
        this.pressed = false;
        this.active = true;
    }

    // METHODS -------------------------------------------------------------
    prepare(evt) {
        this.targets = [];
    }

    iterate(evt, e) {
        // skip inactive entities
        if (!e.active) return;
        if (Hierarchy.findInParent(e, (v) => !v.active)) return;
        // determine if view bounds contains mouse point (bounds is in world coords)
        // -- translate to local position
        let lpos = e.xform.getLocal(new Vect(this.x, this.y));
        let contains = Bounds.contains(e.xform, lpos);
        if (contains) {
            this.targets.push(e);
        }
        if (e.mouseOver && !contains) {
            e.mouseOver = false;
            if (this.dbg) console.log(`${this} mouse left: ${e}`);
        }
        if (e.mousePressed && (!contains || !this.pressed)) {
            e.mousePressed = false;
            if (this.dbg) console.log(`${this} mouse unpressed: ${e}`);
        }
    }

    finalize(evt) {
        // handle targets (click, enter, down)
        if (this.targets.length) {
            this.targets.sort((a,b) => b.mousePriority-a.mousePriority);
            let mouseData = { x: this.x, y: this.y };
            for (const e of this.targets) {
                // trigger clicked
                if (this.clicked) {
                    if (this.dbg) console.log(`${this} mouse clicked: ${e}`);
                    EvtSystem.trigger(e, 'mouse.clicked', { mouse: mouseData });
                }
                if (!e.mouseOver) {
                    e.mouseOver = true;
                    if (this.dbg) console.log(`${this} mouse entered: ${e}`);
                }
                if (this.pressed && !e.mousePressed) {
                    e.mousePressed = true;
                    if (this.dbg) console.log(`${this} mouse pressed: ${e}`);
                }
                if (e.mouseBlock) break;
            }
        }
        // mouse system is only active if a mouse event is received
        this.active = false;
        this.clicked = false;
    }

}