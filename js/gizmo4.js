export { Gadget, Gizmo };

import { Fmt } from './fmt.js';

const FDEFINED=1;
const FREADONLY=2;
const FEVENTABLE=4;
const FUPDATABLE=8;

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

class GadgetLink {
    constructor(gdt) {
        this.gdt = gdt;
        this.leafs = [];
        this.trunk;
    }
}

class Gadget {

    static $registry = new Map();
    static register() {
        if (!this.$registry.has(this.name)) this.$registry.set(this.name, this);
    }

    static findInPath(gadget, filter) {
        for (; gadget; gadget=gadget.#trunk) {
            if (filter(gadget)) return gadget;
        }
        return null;
    }

    static *eachInLeafs(gadget, filter=() => true) {
        for (let i=leafs.length-1; i>=0; i--) {
            let leaf = gadget.#leafs[i];
            if (filter(leaf)) yield leaf;
            yield *this.eachInLeafs(leaf, filter);
        }
    }

    static $link(trunk, key, sentry, target) {
        if (trunk === target || this.findInPath(trunk, (gdt) => gdt === target)) {
            console.error(`hierarchy loop detected ${target} already in path: ${trunk}`);
            throw(`hierarchy loop detected ${target} already in path: ${trunk}`);
        }
        trunk.#leafs.push(target);
        target.#trunk = trunk;
        target.#trunkKey = key;
        target.#trunkSentry = sentry;
        target.#path = (trunk.path !== '') ? `${trunk.#path}.${key}` : key;
        // handle path and flag changes propagated to leafs
        let eventable = (trunk.#flags & FEVENTABLE) && sentry.eventable;
        let updatable = (trunk.#flags & FUPDATABLE) || (sentry.atUpdate !== undefined);
        let readonly = (trunk.#flags & FREADONLY) || sentry.readonly;
        for (const leaf of this.eachInLeafs(target)) {
            // update flags
            eventable &= leaf.#trunkSentry.eventable;
            updatable |= (leaf.#trunkSentry.atUpdate !== undefined);
            readonly |= leaf.#trunkSentry.readonly;
            leaf.#flags = (eventable) ? (leaf.flags|FEVENTABLE) : (leaf.flags&~FEVENTABLE);
            leaf.#flags = (updatable) ? (leaf.flags|FUPDATABLE) : (leaf.flags&~FUPDATABLE);
            leaf.#flags = (readonly) ? (leaf.flags|FREADONLY) : (leaf.flags&~FREADONLY);
            // update path
            leaf.#path = `${leaf.#trunk.#path}.${leaf.#trunkKey}`;
        }
    }

    static $unlink(trunk, target) {
        let idx = trunk.#leafs.indexOf(target);
        if (idx !== -1) trunk.$link.leafs.splice(idx, 1);
        target.$link.trunk = null;
        target.$link.sentry = null;
        target.$link.key = null;
        if (target.$schema) {
            for (const agk of target.$schema.trunkGenDeps) GizmoData.set(target, agk, '#autogen#');
        }
        this.linkUpdate(null, target);
        if ('atUnlink' in target) target.atUnlink(trunk);
    }

    static $get(target, key, sentry=null) {
        if (sentry.getter) return sentry.getter(target);
        return target.#values[key];
    }

    static $set(target, key, value, sentry) {
        //if (sentry && sentry.generator) value = sentry.generator(target, value);
        let storedValue;
        if (target.#flags & FDEFINED) {
            storedValue = target.#values[key];
            if (Object.is(storedValue, value)) return true;
            if (storedValue && typeof storedValue === 'object') GizmoDataLink.unlink(target, storedValue);
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
        target.#values[key] = value;
        target.#v++;
        //if (target.flags & FDEFINED) {
            //if (sentry) {
                //if (sentry.atUpdate) sentry.atUpdate( target, target, key, storedValue, value );
            //}
            //console.log(`target: ${target} key: ${key}`);
            //const watchers = (target.$link) ? target.$link.watchers : null;
            //if (watchers) {
                //for (const watcher of watchers) {
                    ////console.log(`-- target: ${target} key: ${key} watcher`);
                    //watcher.watcher(target, key, storedValue, value);
                //}
            //}
            //if (!target.$link || !target.$link.trunk) {
                //if (EvtSystem.isEmitter(target) && (!sentry || sentry.eventable)) {
                    //EvtSystem.trigger(target, 'gizmo.set', { 'set': { [key]: value }});
                //}
            //}
        //}
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
                return this.constructor.$get(this, key, sentry);
            },
        };
        if (!sentry.readonly) {
            property.set = function set(value) {
                return this.constructor.$set(this, key, value, sentry);
            }
        }
        Object.defineProperty(clsp, key, property);
    }

    static xparse(o, spec) {
        const schema = o.$schema;
        if (schema) {
            for (const sentry of schema.entries) {
                this.set(o, sentry.key, sentry.parser(o, spec), sentry);
            }
        }
    }

    static kvparse(o, key, value) {
        const sentry = (o.$schema) ? o.$schema.get(key): null;
        if (sentry && value === undefined) value = (sentry.dflter) ? sentry.dflter(o) : undefined;
        this.set(o, key, value, sentry);
    }

    #trunk;
    #trunkKey;
    #trunkSentry;
    #path;
    #leafs = [];
    #values = {};
    #flags;
    #v = 0;

    constructor(...args) {
        //this.$values = {};
        this.cparse(...args);
        this.#flags |= FDEFINED;
    }

    // FIXME: remove
    get v() {
        return this.#v;
    }

    cparse(spec={}) {
        this.constructor.xparse(this, spec);
    }
}

class Gizmo extends Gadget {
}
