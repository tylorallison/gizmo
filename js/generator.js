export { Generator };

import { Assets } from './assets.js';
import { Fmt } from './fmt.js';
import { Util } from './util.js';
import { Gadget, GizmoContext } from './gizmo.js';

/**
 * The Generator class creates instances of {@link Gadget} or {@link Gizmo} based on specified GadgetSpec object specification.
 */
class Generator {
    // STATIC VARIABLES ----------------------------------------------------
    static _dflt;

    // STATIC PROPERTIES ---------------------------------------------------
    static get dflt() {
        if (!this._dflt) {
            this._dflt = new this();
        }
        return this._dflt;
    }
    static set dflt(v) {
        this._dflt = v;
    }

    // STATIC METHODS ------------------------------------------------------
    static generate(spec={}) {
        let obj = this.dflt.generate(spec);
        if (!obj) console.error(`generator failed for ${Fmt.ofmt(spec)}`);
        return obj;
    }

    // CONSTRUCTOR ---------------------------------------------------------
    constructor(spec={}) {
        this.registry = spec.registry || Gadget.$registry;
        this.gctx = spec.gctx || GizmoContext.dflt;
        this.assets = spec.assets || ((this.gctx.game) ? this.gctx.game.assets : new Assets());
    }

    // METHODS -------------------------------------------------------------
    resolve(spec) {
        let nspec = Util.copy(spec);
        for (const [k,v,o] of Util.kvWalk(nspec)) {
            if (v && v.cls === 'AssetRef') {
                o[k] = this.generate(this.assets.get(v.assetTag));
            } else if (v && typeof v === 'object' && v.$gzx) {
                let nv = this.generate(v);
                o[k] = nv;
                if (this.dbg) console.log(`-- generator: resolve ${k}->${Fmt.ofmt(v)} to ${k}->${nv}`);
            }
        }
        return nspec;
    }

    generate(spec) {
        if (!spec) return undefined;
        // resolve sub references within spec...
        // -- sub references are tagged w/ the '$gzx' property and are replaced with the generated object
        spec = this.resolve(spec);
        if (!spec.gctx) spec.gctx = this.gctx;
        // look up class definition
        let cls = this.registry.get(spec.cls);
        if (!cls) return undefined;
        if (cls) return new cls(...spec.args);
        return undefined;
    }

}