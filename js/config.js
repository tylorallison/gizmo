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
    static getDefault(path) {
        return Util.getpath(path);
    }

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

    constructor(spec={}) {
        this.$atts = {};
        for (const [key, value] of Object.entries(spec)) {
            Util.setpath(this.$atts, key, value);
        }
        return this.constructor.cfgproxy(this);
    }

    scope(path, overrides={}) {
        return this.constructor.cfgproxy(this, path, overrides);
    }

    path(key, scope) {
        if (key && scope) return `${scope}.${key}`;
        if (scope) return scope;
        return key;
    }

}