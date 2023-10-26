export { ConfigCtx, Configs };

import { Gadget } from './gizmo.js';
import { GizmoCtx } from './gizmoCtx.js';
import { Util } from './util.js';

/**
 * ConfigCtx allows for overriding and restoring Gadget schema defaults for any key
 * When new defaults are set in the context, the target class schema will be updated to reflect
 * the new specified default, which can be either a value or a function
 * The original class schema default is retained and can be restored by deleting the context setting.
 */
class ConfigCtx extends GizmoCtx {

    constructor(spec={}) {
        super(spec);
        this.values = {};
        this.setValues(spec.values || {});
    }

    apply(key, dflt) {
        let [clstag, atttag] = key.split('.');
        let cls = Gadget.$registry.get(clstag);
        if (!cls) return;
        let schema = cls.prototype.$schema;
        schema.$dflts.set(atttag, dflt);
    }

    revert(key) {
        let [clstag, atttag] = key.split('.');
        let cls = Gadget.$registry.get(clstag);
        if (!cls) return;
        let schema = cls.prototype.$schema;
        schema.$dflts.clear(atttag);
    }


    set(key, dflt) {
        this.values[key] = dflt;
        this.apply(key, dflt);
    }

    delete(key) {
        delete this.values[key];
        this.revert(key);
    }

    setValues(values) {
        for (const [key, value] of Object.entries(values)) {
            this.set(key, value);
        }
    }
    deleteValues(values) {
        for (const key of Object.keys(values)) {
            this.delete(key);
        }
    }

    clear() {
        for (const key of Array.from(Object.keys(this.values))) {
            this.delete(key);
        }
        this.values = {};
    }
    

}

const Configs = new ConfigCtx();