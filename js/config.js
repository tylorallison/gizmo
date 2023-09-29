export { ConfigCtx, Configs };

import { GizmoCtx } from './gizmoCtx.js';
import { Util } from './util.js';

class ConfigCtx extends GizmoCtx {

    constructor(spec={}) {
        super(spec);
        this.values = {};
        if (spec.values) {
            for (const [key, value] of Object.entries(spec.values)) {
                Util.setpath(this.values, key, value);
            }
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
    setValues(values) {
        for (const [key, value] of Object.entries(values)) {
            Util.setpath(this.values, key, value);
        }
    }

}

const Configs = new ConfigCtx();