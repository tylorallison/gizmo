export { Gizmo };

import { GizmoContext } from './gizmoContext.js';
import { ExtEvtEmitter, ExtEvtReceiver, EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { ExtHierarchy, Hierarchy } from './hierarchy.js';
import { GizmoData } from './gizmoData.js';
import { Schema } from './schema.js';

/**
 * Gizmo is the base class for all game state objects, including game model and view components.
 * - Global gizmo events are triggered on creation/destruction.
 * - Every gizmo is associated with a {@link GizmoContext} that provides access to the global run environment and events.
 * - Gizmos can have parent/child hierarchical relationships
 * @extends GizmoData
 */
class Gizmo extends GizmoData {

    // STATIC VARIABLES ----------------------------------------------------
    static gid = 1;

    // STATIC PROPERTIES ---------------------------------------------------
    /**
     * @member {GizmoContext} - get singleton/global instance of GizmoContext
     */
    static get gctx() {
        return GizmoContext.main;
    }

    // STATIC METHODS ------------------------------------------------------
    /**
     * listen sets a new event handler for an event, where the emitter is the global game context {@link GizmoContext} and
     * the receiver is given along with the event tag and event handler function {@link EvtSystem~handler}.
     * @param {ExtEvtReceiver} receiver - event receiver
     * @param {string} tag - event tag to listen for
     * @param {EvtSystem~handler} fcn - event handler function
     * @param {Object} opts - options for event listen
     * @param {int} opts.priority - priority associated with listener, event callbacks will be sorted based on ascending priority.
     * @param {boolean} opts.once - indicates if event listener should only be triggered once (after which the listener will automatically be removed).
     * @param {EvtSystem~filter} opts.filter - event filter for listener allowing for fine-grained event management.
     */
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
    /**
     * Create a Gizmo
     * @param {object} spec - object with key/value pairs used to pass properties to the constructor
     */
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
    
    /**
     * destroy the Gizmo.  Can be called directly to drive clean up of state.
     */
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