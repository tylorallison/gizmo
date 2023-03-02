export { GizmoContext };

import { ExtEvtEmitter } from './event.js';
import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';
import { Schema } from './schema.js';

/**
 * The GizmoContext class provides a global context that is attached to all classes derived from the {@link Gizmo} class.  It groups
 * all Gizmo instances to the context as well as provides access to global context variables such as the main {@link Game} class.
 * @extends GizmoData
 * @mixes ExtEvtEmitter
 */
class GizmoContext extends GizmoData {
    // STATIC VARIABLES ----------------------------------------------------
    static _main;
    static ctxid = 1;

    // STATIC PROPERTIES ---------------------------------------------------
    /**
     * @member {GizmoContext} - get/set singleton/global instance of GizmoContext
     */
    static get main() {
        if (!this._main) {
            this._main = new GizmoContext();
        }
        return this._main;
    }
    static set main(v) {
        this._main = v;
    }

    // SCHEMA --------------------------------------------------------------
    /** @member {int} GizmoContext#ctxid - global id associated with context */
    /** @member {string} GizmoContext#tag - tag associated with context */
    /** @member {Game} GizmoContext#game - game instance */
    /** @member {boolean} GizmoContext#userActive - indicates if user has interacted with UI/game by clicking or pressing a key */
    static {
        Schema.apply(this, 'ctxid', { readonly: true, parser: (obj, x) => obj.constructor.ctxid++ });
        Schema.apply(this, 'tag', { readonly: true, parser: (obj, x) => x.tag || `${obj.constructor.name}.${obj.ctxid}` });
        Schema.apply(this, 'game', { dflt: null });
        Schema.apply(this, 'userActive', { dflt: false });
        ExtEvtEmitter.apply(this);
    }

    // METHODS -------------------------------------------------------------
    /**
     * returns string representation of object
     * @returns {string}
     */
    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }

}