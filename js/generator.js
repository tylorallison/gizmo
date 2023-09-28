export { Generator };

import { Fmt } from './fmt.js';
import { Util } from './util.js';
import { Gadget } from './gizmo.js';
import { AssetCtx } from './assetCtx.js';
import { GizmoSingleton } from './singleton.js';

/**
 * The Generator class creates instances of {@link Gadget} or {@link Gizmo} based on specified GadgetSpec object specification.
 */
class Generator extends GizmoSingleton {
    /*
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
    */

    // STATIC METHODS ------------------------------------------------------
    static generate(spec={}) {
        return this.$instance.generate(spec);
    }

    // CONSTRUCTOR ---------------------------------------------------------
    constructor(spec={}) {
        super();
        this.registry = spec.registry || Gadget.$registry;
        this.assets = spec.assets || AssetCtx.instance;
    }

    // METHODS -------------------------------------------------------------
    resolve(spec) {
        let nspec = Util.copy(spec);
        for (const [k,v,o] of Util.kvWalk(nspec)) {
            if (v && v.cls === '$Asset') {
                const tag = v.args[0].tag;
                o[k] = this.assets.get(tag);
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
        // look up class definition
        let cls = this.registry.get(spec.cls);
        if (!cls) {
            console.error(`generator failed for ${Fmt.ofmt(spec)} -- undefined class ${spec.cls}`);
            return undefined;
        }
        if (cls) return new cls(...spec.args);
        console.error(`generator failed for ${Fmt.ofmt(spec)} -- constructor failed`);
        return undefined;
    }

}