

class GizmoSchemaEntry {
    constructor(key, spec={}) {
        this.key = key;
        this.dflter = spec.dflter;
        // getter function of format (object, specification) => { <function returning value> };
        // -- is treated as a dynamic value
        // -- setting getter will disable all set functions and notifications for this key
        this.getter = spec.getter;
        // readonly attributes cannot be modified
        this.readonly = (this.getter) ? true : ('readonly' in spec) ? spec.readonly : false;
        // generator function of format (object, value) => { <function returning final value> };
        this.generator = spec.generator;
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
        // generated fields are not serializable
        this.serializable = (this.generator) ? false : ('serializable' in spec) ? spec.serializable : true;
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
        this.entries = Array.from(base.entries || []);
    }
}

class GizmoContext {
}

class GizmoLink {
    constructor(gzo) {
        this.gzo = gzo;
    }
}

class Gizmo {
    static registry = new Map();
    static init() {
        if (!this.registry.has(this.name)) this.registry.set(this.name, this);
    }

    static get(target, key, sentry=null) {
        if (!target) return undefined;
        if (!sentry) sentry = (target.$schema) ? target.$schema.map[key] : null;
        if (sentry && sentry.getter) return sentry.getter(target);
        return (target.$values) ? target.$values[key] : undefined;
    }

    static set(target, key, value, sentry=null) {
        if (!target || !target.$values) return false;
        if (!sentry) sentry = (target.$schema) ? target.$schema.map[key] : null;
        if (sentry && sentry.getter) return false;
        if (sentry && sentry.generator) value = sentry.generator(target, value);
        let storedValue;
        if (target.$defined) {
            storedValue = target.$values[key];
            if (Object.is(storedValue, value)) return true;
            if (storedValue && typeof storedValue === 'object') GizmoDataLink.unlink(target, storedValue);
        }
        //console.log(`== set ${target} ${key}=>${value} sentry: ${sentry}`);
        // FIXME: link
        if (value && (typeof value === 'object') && (!sentry || sentry.link)) {
            //console.log(` . do proxy: ${sentry.proxy}`);
            if (sentry && sentry.proxy) {
                value = (Array.isArray(value)) ? GizmoArray.wrap(value) : GizmoObject.wrap(value);
            }
            //console.log(`set linking ${target}.${key} to ${value}`);
            GizmoDataLink.link(target, key, sentry, value);
        }
        target.$values[key] = value;
        //if (sentry) {
        //}
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
        return true;
    }

    static parser(o, spec, setter) {
        const schema = o.$schema;
        if (schema) {
            for (const sentry of schema.entries) {
                //console.log(`${o} parser run sentry: ${sentry}`);
                if (setter) {
                    setter(o, sentry.key, sentry.parser(o, spec));
                } else {
                    this.set(o, sentry.key, sentry.parser(o, spec), sentry);
                }
            }
        }
        o.$defined = true;
    }

    static schema(key, spec={}) {
        let schema;
        let cls = this;
        let clsp = cls.prototype;
        if (!clsp.hasOwnProperty('$schema')) {
            schema = new Schema(Object.getPrototypeOf(clsp).$schema);
            clsp.$schema = schema;
        } else {
            schema = clsp.$schema;
        }
        let oldSentry = schema.map[key];
        if (oldSentry) {
            let idx = schema.entries.indexOf(oldSentry);
            if (idx !== -1) schema.entries.splice(idx, 1);
            for (const entry of schema.entries) entry.autogendeps.delete(key);
            schema.trunkGenDeps.delete(key);
        }
        let sentry = new SchemaEntry(key, spec);
        schema.map[key] = sentry;
        schema.entries.push(sentry);
        if (sentry.autogen && (typeof sentry.autogen !== 'function' || sentry.autogen('$trunk'))) {
            schema.trunkGenDeps.add(key);
        }
        for (const oentry of Object.values(schema.map)) {
            if (oentry.key === key) continue;
            // handle existing schema which might have an autogen dependency
            if (oentry.autogen && (typeof oentry.autogen !== 'function' || oentry.autogen(key))) {
                sentry.autogendeps.add(oentry.key);
            }
            // handle if this new schema has an autogen dependency
            if (sentry.autogen && (typeof sentry.autogen !== 'function' || sentry.autogen(oentry.key))) {
                oentry.autogendeps.add(key);
            }
        }

        let desc = {
            enumerable: true,
            get() {
                return this.constructor.get(this, key, sentry);
            },
        };
        if (!sentry.readonly) {
            desc.set = function set(value) {
                return this.constructor.set(this, key, value, sentry);
            }
        }
        Object.defineProperty(cls.prototype, key, desc);

    }

    constructor(spec={}, applySchema=true) {
        this.constructor.init();
        this.$values = {};
        if (applySchema) this.constructor.parser(this, spec);
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    /**
     * Create a Gizmo
     * @param {Object} spec - object with key/value pairs used to pass properties to the constructor
     */
    constructor(spec={}) {
        let gctx = spec.gctx || GizmoContext.main;
        // pre constructor actions
        this.cpre(spec);
        // apply schema/parse properties
        this.constructor.parser(this, spec);
        // -- post constructor actions
        this.cpost(spec);
        this.cfinal(spec);
        // -- trigger creation event
        EvtSystem.trigger(this, 'gizmo.created');
    }
    
    /**
     * destroy the Gizmo.  Can be called directly to drive clean up of state.
     */
    destroy() {
        super.destroy();
        for (const child of (Array.from(this.children || []))) {
            child.destroy();
        }
        Hierarchy.orphan(this);
        EvtSystem.trigger(this, 'gizmo.destroyed');
        EvtSystem.clearEmitterLinks(this);
        EvtSystem.clearReceiverLinks(this);
    }
}