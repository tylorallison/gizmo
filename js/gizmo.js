export { Gizmo };

import { GizmoContext } from './gizmoContext.js';
import { ExtEvtEmitter, ExtEvtReceiver, EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { ExtHierarchy, Hierarchy } from './hierarchy.js';
import { GizmoData } from './gizmoData.js';
import { Schema } from './schema.js';

/** ========================================================================
 * Gizmo is the base class for all game state objects, including game model and view components.
 * - global gizmo events are triggered on creation/destruction
 */
class Gizmo extends GizmoData {

    // STATIC VARIABLES ----------------------------------------------------
    static gid = 1;

    // STATIC PROPERTIES ---------------------------------------------------
    static get gctx() {
        return GizmoContext.main;
    }

    // STATIC METHODS ------------------------------------------------------
    static listen(receiver, tag, fcn, opts={}) {
        EvtSystem.listen(this.gctx, receiver, tag, fcn, opts);
    }

    static ignore(receiver, tag, fcn) {
        EvtSystem.ignore(this.gctx, receiver, tag, fcn);
    }

    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'gctx', { readonly: true, serializable: false, parser: (obj, x) => (x.gctx || GizmoContext.main )});
        Schema.apply(this, 'gid', { readonly: true, parser: (obj, x) => (Gizmo.gid++) });
        Schema.apply(this, 'tag', { readonly: true, parser: (obj, x) => x.tag || `${obj.constructor.name}.${obj.gid}` });
        ExtEvtEmitter.apply(this);
        ExtEvtReceiver.apply(this);
        ExtHierarchy.apply(this);
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    constructor(spec={}) {
        super(spec, false);
        // pre constructor actions
        this.cpre(spec);
        // apply schema/parse properties
        for (const [key, schema] of Object.entries(this.constructor.schema)) {
            this.constructor.applySchema(schema, this, spec);
            //schema.assign(this, spec);
        }
        // -- post constructor actions
        this.cpost(spec);
        this.cfinal(spec);
        // -- trigger creation event
        EvtSystem.trigger(this, 'gizmo.created');
    }
    destroy() {
        super.destroy();
        for (const child of (Array.from(this.children || []))) {
            child.destroy();
        }
        Hierarchy.orphan(this);
        EvtSystem.trigger(this, 'gizmo.destroyed');
        EvtSystem.clearEmitterLinks(this);
        EvtSystem.clearReceiverLinks(this);
    }

    // -- overridable constructor functions
    cpre(spec={}) {
    }
    cpost(spec) {
    }
    cfinal(spec) {
    }

    // METHODS -------------------------------------------------------------
    
    toString() {
        return Fmt.toString(this.constructor.name, this.gid, this.tag);
    }

}