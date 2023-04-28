export { Gizmo };

import { GizmoContext } from './gizmoContext.js';
import { ExtEvtEmitter, ExtEvtReceiver, EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { ExtHierarchy, Hierarchy } from './hierarchy.js';
import { GizmoData, GizmoObject } from './gizmoData.js';
import { Schema } from './schema.js';
import { Serializer } from './serializer.js';

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
     * @param {ExtEvtReceiver} receiver - event receiver, which object is "listening" for this event?
     * @param {string} tag - event tag to listen for
     * @param {EvtSystem~handler} fcn - event handler function
     * @param {Object} [opts] - options for event listen
     * @param {int} opts.priority - priority associated with listener, event callbacks will be sorted based on ascending priority.
     * @param {boolean} opts.once - indicates if event listener should only be triggered once (after which the listener will automatically be removed).
     * @param {EvtSystem~filter} opts.filter - event filter for listener allowing for fine-grained event management.
     */
    static listen(receiver, tag, fcn, opts={}) {
        EvtSystem.listen(this.gctx, receiver, tag, fcn, opts);
    }

    /**
     * ignore removes an event handler for an event, where the emitter is the global game context {@link GizmoContext} and
     * the receiver is given.
     * @param {ExtEvtReceiver} receiver - event receiver, which object is "listening" for this event?
     * @param {*} [tag] - optional event tag associated with listener to remove.  If not specified, all events associated with receiver
     * will be removed.
     * @param {EvtSystem~handler} [fcn] - optional event handler function, specifying specific event callback to remove.  If not specified, 
     * all events associated with the receiver and the given tag will be removed.
     */
    static ignore(receiver, tag, fcn) {
        EvtSystem.ignore(this.gctx, receiver, tag, fcn);
    }

    // SCHEMA --------------------------------------------------------------
    /** @member {GizmoContext} Gizmo#gctx - reference to gizmo context */
    static { Schema.apply(this, 'gctx', { readonly: true, serializable: false, parser: (obj, x) => (x.gctx || GizmoContext.main )}); }
    /** @member {int} Gizmo#gid - unique gizmo identifier*/
    static { Schema.apply(this, 'gid', { readonly: true, parser: (obj, x) => (Gizmo.gid++) }); }
    /** @member {string} Gizmo#tag - tag for this gizmo */
    static { Schema.apply(this, 'tag', { readonly: true, parser: (obj, x) => x.tag || `${obj.constructor.name}.${obj.gid}` }); }
    static {
        ExtEvtEmitter.apply(this);
        ExtEvtReceiver.apply(this);
        ExtHierarchy.apply(this);
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    /**
     * Create a Gizmo
     * @param {Object} spec - object with key/value pairs used to pass properties to the constructor
     */
    constructor(spec={}) {
        let gctx = spec.gctx || GizmoContext.main;
        let proxied = gctx.proxied;
        super(spec, false, proxied);
        // pre constructor actions
        this.cpre(spec);
        // apply schema/parse properties
        this.constructor.parser(this, spec);
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
    /**
     * To allow for more flexible constructor methods, three sub constructors are used in all classes derived by the {@link Gizmo} class: cpre, cpost, cfinal.  
     * cpre is called at the very beginning before any properties are applied to the object.
     * @param {Object} spec - object with key/value pairs used to pass properties to the constructor
     * @abstract
     */
    cpre(spec={}) {
    }
    /**
     * To allow for more flexible constructor methods, three sub constructors are used in all classes derived by the {@link Gizmo} class: cpre, cpost, cfinal.  
     * cpost is called after applying schema-defined properties to the object.
     * @param {*} spec 
     * @abstract
     */
    cpost(spec) {
    }
    /**
     * To allow for more flexible constructor methods, three sub constructors are used in all classes derived by the {@link Gizmo} class: cpre, cpost, cfinal.  
     * cfinal is called directly after cpost.
     * @param {*} spec 
     * @abstract
     */
    cfinal(spec) {
    }

    // METHODS -------------------------------------------------------------

    xify(sdata) {
        // save new serialized gzo
        if (!sdata.xgzos[this.gid]) {
            sdata.xgzos[this.gid] = Serializer.xifyData(sdata, this, { 
                $gzx: true,
                cls: this.constructor.name,
            });
        }
        return {
            cls: '$GizmoRef',
            gid: this.gid,
        }
    }
    
    /**
     * create string representation of object
     * @returns {string}
     */
    toString() {
        return Fmt.toString(this.constructor.name, this.gid, this.tag);
    }

}