export { Config };

import { Util } from './util.js';

class Config {
    static defaults = {};
    static setDefault(key, value) {
        Util.setpath(this.defaults, key, value);
    }
    static setDefaults(atts={}) {
        for (const [key, value] of Object.entries(atts)) {
            Util.setpath(this.defaults, key, value);
        }
    }
    static setPathDefaults(path, atts={}) {
        for (const [key, value] of Object.entries(atts)) {
            let p = `${path}.${key}`;
            //console.log(`set: ${p} to ${value}`);
            Util.setpath(this.defaults, p, value);
        }
    }
    static getDefault(path) {
        return Util.getpath(path);
    }

    static has(o, key) {
        return false;
    }

    static get(o, key) {
        return undefined;
    }

    constructor(spec={}) {
        this.$path;
        this.values = {};
        if (spec.path) this.$path = spec.path;
        if (spec.values) {
            for (const [key, value] of Object.entries(spec.values)) {
                Util.setpath(this.values, key, value);
            }
        }
        if (this.$path) {
            this.dflts = {};
            for (const [key, value] of Object.entries(Util.getpath(this.constructor.defaults, this.$path, {}))) {
                Util.setpath(this.dflts, key, value);
            }
        } else {
            this.dflts = this.constructor.defaults;
        }
    }

    get(path, dflt) {
        if (Util.haspath(this.values, path)) return Util.getpath(this.values, path, dflt);
        if (Util.haspath(this.dflts, path)) return Util.getpath(this.dflts, path, dflt);
        return dflt;
    }

    has(path) {
        if (Util.haspath(this.values, path)) return true;
        if (Util.haspath(this.dflts, path)) return true;
        return false;
    }

    set(path, value) {
        Util.setpath(this.values, path, value);
    }

    scope(path, overrides={}) {
        let spec = {
            path: this.path(path),
            values: Util.getpath(this.values, path, {}),
        };
        for (const [key, value] of Object.entries(overrides)) {
            Util.setpath(spec.values, key, value);
        }
        return new Config(spec);
    }

    path(path) {
        if (path) {
            if (this.$path) return `${this.$path}.${path}`;
            return path;
        }
        return this.$path;
    }

}
