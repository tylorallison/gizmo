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
        //Object.assign(this.defaults, atts);
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
                console.log(`get: ${key}`);
                if (key === 'path') {
                    return function (...args) {
                        args.push(scope);
                        let value = target[key];
                        return value.apply(this === receiver ? target : this, args);
                    };
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
                return [...Object.keys(atts), ...Object.keys(dflts)];
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

    get(path, scope, dflt) {
        if (scope) path = `${scope}.${path}`;
        console.log(`path: ${path}`);
        return Util.getpath(this, path, dflt);
    }

    path(key, scope) {
        if (key && scope) return `${scope}.${key}`;
        if (scope) return scope;
        return key;
    }

}