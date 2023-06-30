export { Gadget, Gizmo };

import { Fmt } from './fmt.js';
import { Evt, EvtSystem } from './event.js';

const FDEFINED=1;
const FREADONLY=2;
const FEVENTABLE=4;
const FUPDATABLE=8;

class GadgetSchemaEntry {
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
        // link - if the value is an object, setup Gadget links between the trunk and leaf.
        this.link = ('link' in spec) ? spec.link : true;
        // generated fields are not serializable
        this.serializable = (this.generator) ? false : ('serializable' in spec) ? spec.serializable : true;
        this.serializer = spec.serializer || ((sdata, target, value) => (typeof value === 'object') ? JSON.parse(JSON.stringify(value)) : value);
    }
    toString() {
        return Fmt.toString(this.constructor.name, this.key);
    }
}

class GadgetSchema {
    constructor(base) {
        if (!base) base = {};
        this.map = Object.assign({}, base.map);
    }

    get entries() {
        return Object.values(this.map);
    }

    has(key) {
        return key in this.map;
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

    static *eachInPath(gadget, filter=() => true) {
        for (; gadget; gadget=gadget.#trunk) {
            if (filter(gadget)) yield gadget;
        }
    }

    static *eachInLeafs(gadget, filter=() => true) {
        for (let i=gadget.#leafs.length-1; i>=0; i--) {
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
        target.#path = (trunk.#path) ? `${trunk.#path}.${key}` : key;
        target.#v++;
        // handle path and flag changes propagated to leafs
        let eventable = (trunk.#flags & FEVENTABLE) && sentry.eventable;
        let updatable = (trunk.#flags & FUPDATABLE) || (sentry.atUpdate !== undefined);
        let readonly = (trunk.#flags & FREADONLY) || sentry.readonly;
        target.#flags = (eventable) ? (target.#flags|FEVENTABLE) : (target.#flags&~FEVENTABLE);
        target.#flags = (updatable) ? (target.#flags|FUPDATABLE) : (target.#flags&~FUPDATABLE);
        target.#flags = (readonly) ? (target.#flags|FREADONLY) : (target.#flags&~FREADONLY);
        for (const leaf of this.eachInLeafs(target)) {
            // update flags
            eventable &= leaf.#trunkSentry.eventable;
            updatable |= (leaf.#trunkSentry.atUpdate !== undefined);
            readonly |= leaf.#trunkSentry.readonly;
            leaf.#flags = (eventable) ? (leaf.#flags|FEVENTABLE) : (leaf.#flags&~FEVENTABLE);
            leaf.#flags = (updatable) ? (leaf.#flags|FUPDATABLE) : (leaf.#flags&~FUPDATABLE);
            leaf.#flags = (readonly) ? (leaf.#flags|FREADONLY) : (leaf.#flags&~FREADONLY);
            console.log(`-- updated leaf: ${leaf} flags: ${leaf.#flags}`);
            // update path
            leaf.#path = `${leaf.#trunk.#path}.${leaf.#trunkKey}`;
        }
        if ('atLinkLeaf' in trunk) trunk.atLinkLeaf(target);
        if ('atLinkTrunk' in target) target.atLinkTrunk(trunk);
    }

    static $unlink(trunk, target) {
        let idx = trunk.#leafs.indexOf(target);
        if (idx !== -1) trunk.#leafs.splice(idx, 1);
        target.#trunk = null;
        target.#trunkSentry = null;
        target.#path = null;
        target.#v++;
        let eventable = EvtSystem.isEmitter(target);
        let updatable = false;
        let readonly = false;
        for (const leaf of this.eachInLeafs(target)) {
            // update flags
            eventable &= leaf.#trunkSentry.eventable;
            updatable |= (leaf.#trunkSentry.atUpdate !== undefined);
            readonly |= leaf.#trunkSentry.readonly;
            leaf.#flags = (eventable) ? (leaf.#flags|FEVENTABLE) : (leaf.#flags&~FEVENTABLE);
            leaf.#flags = (updatable) ? (leaf.#flags|FUPDATABLE) : (leaf.#flags&~FUPDATABLE);
            leaf.#flags = (readonly) ? (leaf.#flags|FREADONLY) : (leaf.#flags&~FREADONLY);
            // update path
            leaf.#path = (leaf.#trunk.#path) ? `${leaf.#trunk.#path}.${leaf.#trunkKey}` : leaf.#trunkKey;
        }
        if ('atUnlinkLeaf' in trunk) trunk.atUnlinkLeaf(target);
        if ('atUnlinkTrunk' in target) target.atUnlinkTrunk(trunk);
    }

    static $get(target, key, sentry=null) {
        if (sentry.getter) return sentry.getter(target);
        if (sentry.generator) {
            let value;
            if (!(key in target.#values)) {
                //console.log(`-- not in : ${target.#values[key]}`);
                value = sentry.generator(target, (sentry.dflter) ? sentry.dflter(target) : undefined);
                target.#values[key] = [target.#v, value];
            } else {
                //console.log(`-- #values[${key}]: ${target.#values[key]}`);
                let ov = target.#values[key][0];
                value = target.#values[key][1];
                if (ov !== target.#v) {
                    value = sentry.generator(target, (sentry.dflter) ? sentry.dflter(target) : undefined);
                    target.#values[key] = [target.#v, value];
                }
            }
            return value;
        }
        return target.#values[key];
    }

    static $set(target, key, value, sentry) {
        let storedValue;
        if (target.#flags & FDEFINED) {
            storedValue = target.#values[key];
            if (Object.is(storedValue, value)) return true;
            if (sentry.link && (storedValue instanceof Gadget) && !(storedValue instanceof Gizmo)) this.$unlink(target, storedValue);
        }
        if (sentry.link && (value instanceof Gadget) && !(value instanceof Gizmo)) {
            this.$link(target, key, sentry, value);
        } else if (sentry.link && Array.isArray(value)) {
            value = new GadgetArray(value);
        }
        target.#values[key] = value;
        if (target.#flags & FDEFINED) {
            target.#v++;
            if (sentry.atUpdate) sentry.atUpdate( target, key, storedValue, value );
            let pgdt = target;
            while (pgdt.#flags & FUPDATABLE) {
                if (pgdt.#trunkSentry.atUpdate) pgdt.#trunkSentry.atUpdate(pgdt.#trunk, pgdt.#trunkKey, pgdt, pgdt);
                pgdt = pgdt.#trunk;
            }
            if ((target.#flags & FEVENTABLE) && sentry.eventable) {
                let gemitter = this.findInPath(target, (gdt) => EvtSystem.isEmitter(gdt));
                if (gemitter) EvtSystem.trigger(gemitter, 'gizmo.set', { 'set': { [`${target.#path}.${key}`]: value }});
            }
        }
        return true;
    }

    static schema(key, spec={}) {
        this.register();
        let schema;
        let clsp = this.prototype;
        if (!clsp.hasOwnProperty('$schema')) {
            schema = new GadgetSchema(Object.getPrototypeOf(clsp).$schema);
            clsp.$schema = schema;
        } else {
            schema = clsp.$schema;
        }
        let sentry = new GadgetSchemaEntry(key, spec);
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
                if (sentry.generator) continue;
                this.$set(o, sentry.key, sentry.parser(o, spec), sentry);
            }
        }
    }

    static kvparse(o, key, value, sentry) {
        if (!sentry && o.$schema) sentry = o.$schema.get(key);
        if (sentry && value === undefined) value = (sentry.dflter) ? sentry.dflter(o) : undefined;
        this.$set(o, key, value, sentry);
    }

    /**
     * xspec provides an GizmoSpec which can be used by a {@link Generator} class to create a Gadget object.
     * @param {Object} spec={} - overrides for properties to create in the GizmoSpec
     * @returns {...GizmoSpec}
     */
    static xspec(spec={}) {
        return Object.assign({
            $gzx: true,
            cls: this.name,
        }, spec);
    }

    #trunk;
    #trunkKey;
    #trunkSentry;
    #path;
    #leafs = [];
    #values = {};
    #flags = 0;
    #v = 0;

    constructor(...args) {
        if (EvtSystem.isEmitter(this)) this.#flags |= FEVENTABLE;
        this.cparse(...args);
        this.#flags |= FDEFINED;
    }

    cparse(spec={}) {
        this.constructor.xparse(this, spec);
    }

    /*
    xify(sdata) {
        return Serializer.xifyData(sdata, this.$values, { 
            $gzx: true,
            cls: this.constructor.name,
        }, this.$schema );
    }
    */

    get $dbg() {
        return `${this.#v},${this.#trunk},${this.#trunkKey},${this.#trunkSentry},${this.#path},${this.#leafs},${this.#values},${this.flags}`;
    }

    get $values() {
        return Object.values(this.#values);
    }


    toString() {
        return Fmt.toString(this.constructor.name);
    }

}

/**
 * The GizmoContext class provides a global context that is attached to all classes derived from the {@link Gizmo} class.  It groups
 * all Gizmo instances to the context as well as provides access to global context variables such as the main {@link Game} class.
 * @extends Gadget
 * @mixes ExtEvtEmitter
 */
class GizmoContext extends Gadget {
    // STATIC VARIABLES ----------------------------------------------------
    static _dflt;
    static gid = 1;

    // STATIC PROPERTIES ---------------------------------------------------
    /**
     * @member {GizmoContext} - get/set global/default instance of GizmoContext
     */
    static get dflt() {
        if (!this._dflt) {
            this._dflt = new GizmoContext();
        }
        return this._dflt;
    }
    static set dflt(v) {
        this._dflt = v;
    }

    // SCHEMA --------------------------------------------------------------
    /** @member {int} GizmoContext#gid - global id associated with context */
    /** @member {string} GizmoContext#tag - tag associated with context */
    /** @member {Game} GizmoContext#game - game instance */
    /** @member {boolean} GizmoContext#userActive - indicates if user has interacted with UI/game by clicking or pressing a key */
    static {
        this.schema('gid', { readonly: true, parser: (gdt, x) => gdt.constructor.gid++ });
        this.schema('tag', { readonly: true, parser: (gdt, x) => x.tag || `${gdt.constructor.name}.${gdt.gid}` });
        this.schema('game', { dflt: null });
        this.schema('userActive', { dflt: false });
        //ExtEvtEmitter.apply(this);
    }

    // METHODS -------------------------------------------------------------
    /**
     * returns string representation of object
     * @returns {string}
     */
    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }

}

/**
 * Gizmo is the base class for all game state objects, including game model and view components.
 * - Global gizmo events are triggered on creation/destruction.
 * - Every gizmo is associated with a {@link GizmoContext} that provides access to the global run environment and events.
 * - Gizmos can have parent/child hierarchical relationships
 * @extends Gadget
 */
class Gizmo extends Gadget {

    // SCHEMA --------------------------------------------------------------
    /** @member {GizmoContext} Gizmo#gctx - reference to gizmo context */
    static { this.schema('gctx', { readonly: true, serializable: false, link: false, parser: (gdt, x) => (x.gctx || GizmoContext.dflt )}); }
    /** @member {int} Gizmo#gid - unique gizmo identifier*/
    static { this.schema('gid', { readonly: true, parser: (gdt, x) => (Gizmo.gid++) }); }
    /** @member {string} Gizmo#tag - tag for this gizmo */
    static { this.schema('tag', { readonly: true, parser: (gdt, x) => x.tag || `${gdt.constructor.name}.${gdt.gid}` }); }
    static {
        //ExtEvtEmitter.apply(this);
        //ExtEvtReceiver.apply(this);
        //ExtHierarchy.apply(this);
    }

    // STATIC VARIABLES ----------------------------------------------------
    static gid = 1;

    // STATIC PROPERTIES ---------------------------------------------------
    /**
     * @member {GizmoContext} - get singleton/global instance of GizmoContext
     */
    static get gctx() {
        return GizmoContext.main;
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    /**
     * Create a Gizmo
     * @param {Object} spec - object with key/value pairs used to pass properties to the constructor
     */
    constructor(spec={}) {
        super(spec);
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

    // -- overridable constructor functions
    /**
     * To allow for more flexible constructor methods, three sub constructors are used in all classes derived by the {@link Gizmo} class: cpre, cpost, cfinal.  
     * cpost is called after applying schema-defined properties to the object.
     * @param {*} spec 
     * @abstract
     */
    cpost(spec) {
    }
    /**
     * To allow for more flexible constructor methods, three sub constructors are used in all classes derived by the {@link Gizmo} class: cpre, cpost, cfinal.  
     * cfinal is called directly after cpost.
     * @param {*} spec 
     * @abstract
     */
    cfinal(spec) {
    }

    // METHODS -------------------------------------------------------------

    /*
    xify(sdata) {
        // save new serialized gzo
        if (!sdata.xgzos[this.gid]) {
            sdata.xgzos[this.gid] = Serializer.xifyData(sdata, this.$values, { 
                $gzx: true,
                cls: this.constructor.name,
            }, this.$schema);
        }
        return {
            cls: '$GizmoRef',
            gid: this.gid,
        }
    }
    */

    /**
     * create string representation of object
     * @returns {string}
     */
    toString() {
        return Fmt.toString(this.constructor.name, this.gid, this.tag);
    }

}

class GadgetArray extends Gadget {

    cparse(values) {
        if (!values) values = [];
        // FIXME
        this.esentry = new GadgetSchemaEntry('wrap', {})
        for (let i=0; i<values.length; i++) {
            console.log(`this: ${this} ${i} ${values[i]}`);
            this.constructor.$set(this, i, values[i], this.esentry);
        }
    }

    constructor(...args) {
        super(...args);
        const proxy = new Proxy(this, {
            get(target, key, receiver) {
                if (key === '$proxy') return receiver;
                if (key === '$target') return target;
                const value = target[key];
                if (value instanceof Function) {
                    return function (...args) {
                        return value.apply(this === receiver ? target : this, args);
                    };
                }
                console.log(`returning gadget get for ${key.toString()}`);
                return target.constructor.$get(target, key, target.esentry);
            },
            set(target, key, value, receiver) {
                target.constructor.$set(target, key, value, target.esentry);
                return true;
            },
            deleteProperty(target, key) {
                /*
                if (key in target) {
                    //console.log(`target: ${target} link: ${target.$link}`);
                    const storedValue = target[key];
                    if (storedValue && typeof storedValue === 'object') GizmoDataLink.unlink(target, storedValue);
                    delete target[key];
                    const watchers = (target.$link) ? target.$link.watchers : null;
                    if (watchers) {
                        for (const watcher of watchers) {
                            //console.log(`trigger delete watcher for node: ${watcher.node}`);
                            watcher.watcher(target, key, storedValue, undefined);
                        }
                    }
                    if (!target.$link || !target.$link.trunk) {
                        //console.log(`trigger delete`);
                        if (EvtSystem.isEmitter(target) && (!sentry || sentry.eventable)) {
                            //console.log(`target: ${target} sentry: ${sentry} emit delete: ${key}:${value}`);
                            EvtSystem.trigger(target, 'gizmo.delete', { 'set': { [key]: undefined }});
                        }
                    }
                }
                */
                return true;
            }
        });
        /*
        let i = 0;
        for (const v of array) {
            //console.log(`---- array[${i} v: ${v}`);
            GizmoData.set(proxy, i++, v);
        }
        */
        //defined = true;
        return proxy;
    }

    *[Symbol.iterator]() {
        for (const v of this.$values) yield v;
    }

    toString() {
        return Fmt.toString(this.constructor.name, ...this.$values);
    }


                /*
                if (key === '$values') return target;
                if (key === '$defined') return defined;
                */
                /*
                if (target.$link) {
                    switch (key) {
                        */
                        /*
                        case 'destroy': 
                            return () => {
                                if (target.$link) target.$link.destroy();
                                delete target['$link'];
                                if (target.destroy) target.destroy();
                            }
                            */
                           /*
                        case 'push':
                            return (...v) => {
                                let i=target.length;
                                for (const el of v) {
                                    this.$set(receiver, i++, el, sentry);
                                    //this.$set(o, sentry.key, sentry.parser(o, spec), sentry);
                                }
                                return target.length;
                            }
                            */
                            /*
                        case 'unshift':
                            return (...v) => {
                                let i=0;
                                for (const el of v) {
                                    target.splice(i, 0, undefined);
                                    GizmoData.set(receiver, i++, el);
                                }
                                return target.length;
                            }
                        case 'pop': return () => {
                            let idx = target.length-1;
                            if (idx < 0) return undefined;
                            const v = target[idx];
                            GizmoData.set(receiver, idx, undefined);
                            target.pop();
                            return v;
                        }
                        case 'shift': return () => {
                            if (target.length < 0) return undefined;
                            const v = target[0];
                            GizmoData.set(receiver, 0, undefined);
                            target.shift();
                            return v;
                        }
                        case 'splice': return (start, deleteCount=0, ...avs) => {
                            let tidx = start;
                            let aidx = 0;
                            let dvs = [];
                            // splice out values to delete, replace w/ items to add (if any)
                            for (let i=0; i<deleteCount; i++ ) {
                                dvs.push(target[tidx])
                                if (aidx < avs.length) {
                                    GizmoData.set(receiver, tidx++, avs[aidx++]);
                                } else {
                                    GizmoData.set(receiver, tidx, undefined);
                                    target.splice(tidx++, 1);
                                }
                            }
                            // splice in any remainder of items to add
                            for ( ; aidx<avs.length; aidx++ ) {
                                target.splice(tidx, 0, undefined);
                                GizmoData.set(receiver, tidx++, avs[aidx]);
                            }
                            return dvs;
                        }
                        */
                    /*
                    }
                }
                */

    static $wrapArray(trunk, key, array, sentry) {
        let defined = false;
        const setter = this.$set;
        let target = new class GadgetArray extends Gadget {
            cparse(arr=[]) {
                console.log(`-- arr: ${arr}`);
            }
        }(array);
        console.log(`target: ${target}`);
        console.log(`wrapping: ${array}`);
        const proxy = new Proxy(target, {
            get(target, key, receiver) {
                if (key === '$proxy') return receiver;
                if (key === '$target') return target;
                /*
                if (key === '$values') return target;
                if (key === '$defined') return defined;
                */
                if (target.$link) {
                    switch (key) {
                        /*
                        case 'destroy': 
                            return () => {
                                if (target.$link) target.$link.destroy();
                                delete target['$link'];
                                if (target.destroy) target.destroy();
                            }
                            */
                        case 'push':
                            return (...v) => {
                                let i=target.length;
                                for (const el of v) {
                                    this.$set(receiver, i++, el, sentry);
                                    //this.$set(o, sentry.key, sentry.parser(o, spec), sentry);
                                }
                                return target.length;
                            }
                            /*
                        case 'unshift':
                            return (...v) => {
                                let i=0;
                                for (const el of v) {
                                    target.splice(i, 0, undefined);
                                    GizmoData.set(receiver, i++, el);
                                }
                                return target.length;
                            }
                        case 'pop': return () => {
                            let idx = target.length-1;
                            if (idx < 0) return undefined;
                            const v = target[idx];
                            GizmoData.set(receiver, idx, undefined);
                            target.pop();
                            return v;
                        }
                        case 'shift': return () => {
                            if (target.length < 0) return undefined;
                            const v = target[0];
                            GizmoData.set(receiver, 0, undefined);
                            target.shift();
                            return v;
                        }
                        case 'splice': return (start, deleteCount=0, ...avs) => {
                            let tidx = start;
                            let aidx = 0;
                            let dvs = [];
                            // splice out values to delete, replace w/ items to add (if any)
                            for (let i=0; i<deleteCount; i++ ) {
                                dvs.push(target[tidx])
                                if (aidx < avs.length) {
                                    GizmoData.set(receiver, tidx++, avs[aidx++]);
                                } else {
                                    GizmoData.set(receiver, tidx, undefined);
                                    target.splice(tidx++, 1);
                                }
                            }
                            // splice in any remainder of items to add
                            for ( ; aidx<avs.length; aidx++ ) {
                                target.splice(tidx, 0, undefined);
                                GizmoData.set(receiver, tidx++, avs[aidx]);
                            }
                            return dvs;
                        }
                        */
                    }
                }
                const value = target.constructor.$get(target, key, esentry);
                if (value instanceof Function) {
                    return function (...args) {
                        return value.apply(this === receiver ? target : this, args);
                    };
                }
                return value;
            },
            set(target, key, value, receiver) {
                /*
                if (key.startsWith('$')) {
                    target[key] = value;
                } else {
                    GizmoData.set(receiver, key, value);
                }
                */
                return true;
            },
            deleteProperty(target, key) {
                /*
                if (key in target) {
                    //console.log(`target: ${target} link: ${target.$link}`);
                    const storedValue = target[key];
                    if (storedValue && typeof storedValue === 'object') GizmoDataLink.unlink(target, storedValue);
                    delete target[key];
                    const watchers = (target.$link) ? target.$link.watchers : null;
                    if (watchers) {
                        for (const watcher of watchers) {
                            //console.log(`trigger delete watcher for node: ${watcher.node}`);
                            watcher.watcher(target, key, storedValue, undefined);
                        }
                    }
                    if (!target.$link || !target.$link.trunk) {
                        //console.log(`trigger delete`);
                        if (EvtSystem.isEmitter(target) && (!sentry || sentry.eventable)) {
                            //console.log(`target: ${target} sentry: ${sentry} emit delete: ${key}:${value}`);
                            EvtSystem.trigger(target, 'gizmo.delete', { 'set': { [key]: undefined }});
                        }
                    }
                }
                */
                return true;
            }
        });
        /*
        let i = 0;
        for (const v of array) {
            //console.log(`---- array[${i} v: ${v}`);
            GizmoData.set(proxy, i++, v);
        }
        */
        defined = true;
        return proxy;
    }
}