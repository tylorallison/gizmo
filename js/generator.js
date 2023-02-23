export { Generator };

import { Assets } from './assets.js';
import { GizmoContext } from './gizmoContext.js';
import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';
import { Util } from './util.js';

/**
 * The Generator class creates instances of {@link GizmoData} or {@link Gizmo} based on specified GizmoSpec object specification.
 */
class Generator {
    // STATIC VARIABLES ----------------------------------------------------
    static _main;

    // STATIC PROPERTIES ---------------------------------------------------
    static get main() {
        if (!this._main) {
            this._main = new this();
        }
        return this._main;
    }
    static set main(v) {
        this._main = v;
    }

    // STATIC METHODS ------------------------------------------------------
    static generate(spec={}) {
        let obj = this.main.generate(spec);
        if (!obj) console.error(`generator failed for ${Fmt.ofmt(spec)}`);
        return obj;
    }

    // CONSTRUCTOR ---------------------------------------------------------
    constructor(spec={}) {
        this.registry = spec.registry || GizmoData.registry;
        this.gctx = spec.gctx || GizmoContext.main;
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
        // -- sub references all start with 'x_' and are replaced with the generated object under a new key where the 'x_' has been stripped
        spec = this.resolve(spec);
        if (!spec.gctx) spec.gctx = this.gctx;
        // look up class definition
        let cls = this.registry[spec.cls];
        if (!cls) return undefined;
        if (cls) return new cls(spec);
        return undefined;
    }

}