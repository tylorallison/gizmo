export { Config };

    import { Fmt } from './fmt.js';
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
    static getDefault(path) {
        return Util.getpath(path);
    }

    /*
    static cfgproxy(cfg, scope, overrides={}) {
        let atts;
        let dflts;
        if (scope) {
            dflts = Util.getpath(this.defaults, scope, {});
            if (!Util.haspath(cfg.$atts, scope)) Util.setpath(cfg.$atts, scope, {});
            atts = Util.getpath(cfg.$atts, scope);
        } else {
            dflts = this.defaults;
            atts = cfg.$atts;
        }
        atts = Util.update({}, atts);
        for (const [key, value] of Object.entries(overrides)) {
            Util.setpath(atts, key, value);
        }
        return new Proxy(cfg, {
            get(target, key, receiver) {
                if (key === 'path') {
                    return function (...args) {
                        args.push(scope);
                        let value = target[key];
                        return value.apply(this === receiver ? target : this, args);
                    };
                }
                if (key === 'scope') {
                    return function (path, overrides={}) {
                        if (scope) path = `${scope}.${path}`;
                        return target.scope(path, overrides);
                    }
                }
                if (key === 'get') {
                    return function get(path, dflt) {
                        if (Util.haspath(atts, path)) return Util.getpath(atts, path, dflt);
                        if (Util.haspath(dflts, path)) return Util.getpath(atts, path, dflt);
                        return dflt;
                    }
                }
                if (key === 'set') {
                    return function set(path, value) {
                        Util.setpath(atts, path, value);
                    }
                }
                if (key === 'has') {
                    return function has(path) {
                        if (Util.haspath(atts, path)) return true;
                        if (Util.haspath(dflts, path)) return true;
                        return false;
                    }
                }
                if ((key in target) && (target[key] instanceof Function)) {
                    return function (...args) {
                        let value = target[key];
                        return value.apply(this === receiver ? target : this, args);
                    };
                }
                if (key in atts) return atts[key];
                if (key in dflts) return dflts[key];
                return undefined;
            },
            set(target, key, value, receiver) {
                atts[key] = value;
                return true;
            },
            has(target, key) {
                return (key in atts) || (key in dflts);
            },
            ownKeys(target) {
                let set = new Set([...Object.keys(atts), ...Object.keys(dflts)]);
                return Array.from(set.keys);
            },
            getOwnPropertyDescriptor(target, key) {
                let value = undefined;
                if (key in atts) value = atts[key];
                if (key in dflts) value = dflts[key];
                return {
                    value: value,
                    enumerable: true,
                    configurable: true,
                    writable: true
                };
            },
        });
    }
    */

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