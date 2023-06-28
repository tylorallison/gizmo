export { Gizmo };

import { Fmt } from './fmt.js';

class GizmoSchemaEntry {
    constructor(key, spec={}) {
        this.key = key;
        this.dflter = spec.dflter;
        // getter function of format (object, specification) => { <function returning value> };
        // -- is treated as a dynamic value
        // -- setting getter will disable all set functions and notifications for this key
        this.getter = spec.getter;
        // generator function of format (object, value) => { <function returning final value> };
        this.generator = spec.generator;
        this.readonly = (this.getter || this.generator) ? true : ('readonly' in spec) ? spec.readonly : false;
        this.parser = spec.parser || ((o, x) => {
            if (this.key in x) return x[this.key];
            const dflt = (this.dflter) ? this.dflter(o) : undefined;
            if (this.generator) return this.generator(o,dflt);
            return dflt;
        });
        this.eventable = (this.getter) ? false : ('eventable' in spec) ? spec.eventable : true;
        this.atUpdate = spec.atUpdate;
        // link - if the value is an object, setup GizmoData links between the trunk and leaf.
        this.link = ('link' in spec) ? spec.link : true;
        // autogen fields are not serializable
        this.serializable = (this.autogen) ? false : ('serializable' in spec) ? spec.serializable : true;
        this.serializer = spec.serializer || ((sdata, target, value) => (typeof value === 'object') ? JSON.parse(JSON.stringify(value)) : value);
    }
    toString() {
        return Fmt.toString(this.constructor.name, this.key);
    }
}

class GizmoSchema {
    constructor(base) {
        if (!base) base = {};
        this.map = Object.assign({}, base.map);
    }

    get entries() {
        return Object.values(this.map);
    }

    get(key) {
        return this.map[key];
    }

    set(key, entry) {
        this.map[key] = entry;
    }

    clear(key) {
        delete this.map[key];
    }
}

class Gizmo {

    static $registry = new Map();
    static register() {
        console.log(`register ${this.name}`);
        if (!this.$registry.has(this.name)) this.$registry.set(this.name, this);
    }

    static get(target, key, sentry=null) {
        if (!target) return undefined;
        if (!sentry) sentry = (target.$schema) ? target.$schema.map[key] : null;
        if (sentry && sentry.getter) return sentry.getter(target);
        return (target.$values) ? target.$values[key] : undefined;
    }

    static set(target, key, value, sentry=null) {
        if (!target || !target.$values) return false;
        if (!sentry) sentry = (target.$schema) ? target.$schema.get(key) : null;
        //if (sentry && sentry.generator) value = sentry.generator(target, value);
        let storedValue;
        if (target.$defined) {
            storedValue = target.$values[key];
            if (Object.is(storedValue, value)) return true;
            //if (storedValue && typeof storedValue === 'object') GizmoDataLink.unlink(target, storedValue);
        }
        //console.log(`== set ${target} ${key}=>${value} sentry: ${sentry}`);
        // FIXME: link
        //if (value && (typeof value === 'object') && (!sentry || sentry.link)) {
            //console.log(` . do proxy: ${sentry.proxy}`);
            //if (sentry && sentry.proxy) {
                //value = (Array.isArray(value)) ? GizmoArray.wrap(value) : GizmoObject.wrap(value);
            //}
            //console.log(`set linking ${target}.${key} to ${value}`);
            //GizmoDataLink.link(target, key, sentry, value);
        //}
        target.$values[key] = value;
        /*
        if (target.$defined) {
            if (sentry) {
                if (sentry.atUpdate) sentry.atUpdate( target, target, key, storedValue, value );
                for (const agk of sentry.autogendeps) this.set(target, agk, '#autogen#');
            }
            //console.log(`target: ${target} key: ${key}`);
            const watchers = (target.$link) ? target.$link.watchers : null;
            if (watchers) {
                for (const watcher of watchers) {
                    //console.log(`-- target: ${target} key: ${key} watcher`);
                    watcher.watcher(target, key, storedValue, value);
                }
            }
            if (!target.$link || !target.$link.trunk) {
                if (EvtSystem.isEmitter(target) && (!sentry || sentry.eventable)) {
                    EvtSystem.trigger(target, 'gizmo.set', { 'set': { [key]: value }});
                }
            }
        }
        */
        return true;
    }

    static schema(key, spec={}) {
        this.register();
        let schema;
        let clsp = this.prototype;
        if (!clsp.hasOwnProperty('$schema')) {
            schema = new GizmoSchema(Object.getPrototypeOf(clsp).$schema);
            clsp.$schema = schema;
        } else {
            schema = clsp.$schema;
        }
        let sentry = new GizmoSchemaEntry(key, spec);
        schema.set(key, sentry);
        let property = {
            enumerable: true,
            get() {
                return this.constructor.get(this, key, sentry);
            },
        };
        if (!sentry.readonly) {
            property.set = function set(value) {
                return this.constructor.set(this, key, value, sentry);
            }
        }
        Object.defineProperty(clsp, key, property);
    }

    static parser(o, spec) {
        const schema = o.$schema;
        console.log(`schema: ${schema}`);
        if (schema) {
            for (const sentry of schema.entries) {
                console.log(`sentry: ${sentry}`);
                this.set(o, sentry.key, sentry.parser(o, spec), sentry);
            }
        }
        o.$defined = true;
    }

    static xparse(o, key, value) {
        const sentry = (o.$schema) ? o.$schema.get(key): null;
        if (sentry && value === undefined) value = (sentry.dflter) ? sentry.dflter(o) : undefined;
        console.log(`key: ${key} value: ${value}`);
        this.set(o, key, value, sentry);
    }

    constructor(...args) {
        this.$values = {};
        this.cparse(...args);
    }

    cparse(spec) {
        if (spec) {
            this.constructor.parser(this, spec);
        }
    }
}

class Gadget {
}
