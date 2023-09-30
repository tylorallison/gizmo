export { SystemMgr };

import { Evts } from './evt.js';
import { Gizmo } from './gizmo.js';
import { System } from './system.js';

class SystemMgr extends Gizmo {
    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('dbg', { dflt: false });
        this.schema('systems', { link: false, parser: () => ({}) });
    }

    // CONSTRUCTOR ---------------------------------------------------------
    cpre(spec) {
        this.onGizmoCreated = this.onGizmoCreated.bind(this);
        this.onGizmoDestroyed = this.onGizmoDestroyed.bind(this);
    }

    cpost(spec) {
        Evts.listen(null, 'GizmoCreated', this.onGizmoCreated, this);
        Evts.listen(null, 'GizmoDestroyed', this.onGizmoDestroyed, this);
    }

    // EVENT HANDLERS ------------------------------------------------------
    onGizmoCreated(evt) {
        if (evt.actor && (evt.actor instanceof System)) {
            let system = evt.actor;
            // pre-existing?
            if (this.systems[system.tag]) if (this.dbg) console.log(`${this} replacing system for tag: ${system.tag}`);
            if (this.dbg) console.log(`${this} adding system: ${system} tag: ${system.tag}`);
            this.systems[system.tag] = system;
        }
    }

    onGizmoDestroyed(evt) {
        if (evt.actor && (evt.actor instanceof System)) {
            let system = evt.actor;
            if (system.tag in this.systems) {
                delete this.systems[system.tag];
            }
        }
    }

    // METHODS -------------------------------------------------------------
    get(tag) {
        return this.systems[tag];
    }

}
