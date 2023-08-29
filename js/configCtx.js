export { ConfigCtx };

import { GizmoCtx } from './gizmoCtx.js';
import { Util } from './util.js';

class ConfigCtx extends GizmoCtx {

    static hasForGdt(gdt, key) {
        return this.instance.hasForGdt(gdt, key);
    }
    static getForGdt(gdt, key, dflt) {
        return this.instance.getForGdt(gdt, key, dflt);
    }
    static setForGdt(gdt, key, value) {
        return this.instance.setForGdt(gdt, key, value);
    }

    static has(path) {
        return this.instance.has(path);
    }
    static get(path, dflt) {
        return this.instance.get(path, dflt);
    }
    static set(path, value) {
        this.instance.set(path, value);
    }
    static setValues(values) {
        this.instance.setValues(values);
    }

    constructor(spec={}) {
        super(spec);
        this.values = {};
        // optionally inherit values from current config context
        if (spec.inherit) {
            Util.update(this.values, this.constructor.instance.values);
        }
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
