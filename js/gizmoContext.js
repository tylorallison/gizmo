export { GizmoContext };

import { ExtEvtEmitter } from './event.js';
import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';
import { Schema } from './schema.js';

class GizmoContext extends GizmoData {
    // STATIC VARIABLES ----------------------------------------------------
    static _main;
    static ctxid = 1;

    // STATIC PROPERTIES ---------------------------------------------------
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
    static {
        Schema.apply(this, 'ctxid', { readonly: true, parser: (obj, x) => obj.constructor.ctxid++ });
        Schema.apply(this, 'tag', { readonly: true, parser: (obj, x) => x.tag || `${obj.constructor.name}.${obj.ctxid}` });
        Schema.apply(this, 'game', { dflt: null });
        Schema.apply(this, 'userActive', { dflt: false });
        ExtEvtEmitter.apply(this);
    }

    // METHODS -------------------------------------------------------------
    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }

}