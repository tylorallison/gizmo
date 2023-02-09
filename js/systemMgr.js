export { SystemMgr };

import { EvtSystem } from './event.js';
import { Gizmo } from './gizmo.js';
import { Schema } from './schema.js';
import { System } from './system.js';

class SystemMgr extends Gizmo {
    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'dbg', { dflt: false });
        Schema.apply(this, 'systems', { readonly: true, parser: () => ({}) });
    }

    // CONSTRUCTOR ---------------------------------------------------------
    cpre(spec) {
        this.onGizmoCreated = this.onGizmoCreated.bind(this);
        this.onGizmoDestroyed = this.onGizmoDestroyed.bind(this);
    }

    cpost(spec) {
        EvtSystem.listen(this.gctx, this, 'gizmo.created', this.onGizmoCreated)
        EvtSystem.listen(this.gctx, this, 'gizmo.destroyed', this.onGizmoDestroyed)
    }

    // EVENT HANDLERS ------------------------------------------------------
    onGizmoCreated(evt) {
        if (evt.actor && (evt.actor instanceof System)) {
            let system = evt.actor;
            // pre-existing?
            if (this.systems[system.tag]) console.log(`${this} replacing system for tag: ${system.tag}`);
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