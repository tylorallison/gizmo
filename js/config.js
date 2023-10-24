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
        this.defaults = {};
        this.values = {};
        if (spec.values) {
            for (const [key, value] of Object.entries(spec.values)) {
                Util.setpath(this.values, key, value);
            }
        }
    }

    apply(key, dflt) {
        let [clstag, atttag] = key.split('.');
        console.log(`clstag: ${clstag}`)
        console.log(`atttag: ${atttag}`)
        let cls = Gadget.$registry.get(clstag);
        console.log(`cls: ${cls.name}`)
        let schema = cls.prototype.$schema;
        console.log(`schema: ${schema} entries: ${schema._entries}`)
        let sentry;
        if (schema) {
            sentry = schema.get(atttag);
            console.log(`sentry: ${sentry} dflt: ${sentry.dflt}`)
            sentry.dflt = dflt;
        }
    }

    hasForGdt(gdt, key) {
        let path = `${gdt.constructor.cfgpath}.${key}`;
        return this.has(path);
    }
    getForGdt(gdt, key, dflt) {
        let path = `${gdt.constructor.cfgpath}.${key}`;
        return this.get(path, dflt);
    }
    setForGdt(gdt, key, value) {
        let path = `${gdt.constructor.cfgpath}.${key}`;
        this.set(path, value);
    }


    has(path) {
        if (Util.haspath(this.values, path)) return true;
        return false;
    }
    get(path, dflt) {
        if (Util.haspath(this.values, path)) return Util.getpath(this.values, path, dflt);
        return dflt;
    }
    set(path, value) {
        Util.setpath(this.values, path, value);
    }
    delete(path) {
        Util.delpath(this.values, path);
    }
    setValues(values) {
        for (const [key, value] of Object.entries(values)) {
            Util.setpath(this.values, key, value);
        }
    }
    deleteValues(values) {
        for (const key of Object.keys(values)) {
            Util.delpath(this.values, key);
        }
    }

    clear() {
        this.values = {};
    }
    

}

const Configs = new ConfigCtx();