export { Gadget, GadgetSchemaEntry, GadgetArray, GadgetObject, Gizmo };

import { Fmt } from './fmt.js';
import { Hierarchy } from './hierarchy.js';
import { Serializer } from './serializer.js';
import { Evts } from './evt.js';
//import { GizmoCtx } from './gizmoCtx.js';

const FDEFINED=1;
const FREADONLY=2;
const FEVENTABLE=4;

// parse behavior
// -- key in spec: spec[key]
// -- key in config: cfg[key]
// -- key in config.dflts: cfg.dflts[key]
// -- schema.dflt

class GadgetSchemaEntry {
    constructor(key, spec={}) {
        this.key = key;
        this.xkey = spec.xkey || this.key;
        this.dflt = spec.dflt;
        // getter function of format (object, specification) => { <function returning value> };
        // -- is treated as a dynamic value
        // -- setting getter will disable all set functions and notifications for this key
        this.getter = spec.getter;
        // generator function of format (object, value) => { <function returning final value> };
        this.generator = spec.generator;
        this.readonly = (this.getter || this.generator) ? true : ('readonly' in spec) ? spec.readonly : false;
        this.parser = spec.parser || ((o, x) => {
            if (this.xkey in x) return x[this.xkey];
            const dflt = this.getDefault(o);
            if (this.generator) return this.generator(o,dflt);
            return dflt;
        });
        this.eventable = (this.getter) ? false : ('eventable' in spec) ? spec.eventable : true;
        this.atUpdate = spec.atUpdate;
        // link - if the value is an object, setup Gadget links between the trunk and leaf.
        this.link = ('link' in spec) ? spec.link : false;
        // generated fields are not serializable
        this.serializable = (this.generator) ? false : ('serializable' in spec) ? spec.serializable : true;
        this.serializer = spec.serializer;
        this.order = spec.order || 0;
    }
    getDefault(o) {
        // class schema $dflts overrides sentry defaults
        if (o.$schema && o.$schema.$dflts.has(this.key)) {
            return o.$schema.$dflts.get(this.key);
        }
        // sentry default
        return (this.dflt instanceof Function) ? this.dflt(o) : this.dflt;
    }
    toString() {
        return Fmt.toString(this.constructor.name, this.key);
    }
}

class GadgetDflts {
    constructor(base) {
        if (base) Object.setPrototypeOf(this, base);
    }
    set(key, dflt) {
        this[key] = dflt;
    }
    has(key) {
        return key in this;
    }
    get(key) {
        return this[key];
    }
    clear(key) {
        if (Object.hasOwn(this, key)) delete this[key];
    }
}

class GadgetSchema {
    constructor(base) {
        this.$order = [];
        this.$dflts = new GadgetDflts((base) ? base.$dflts : null);
        this.$order = (base) ? Array.from(base.$order) : [];
        if (base) Object.setPrototypeOf(this, base);
    }

    get $entries() {
        let entries = [];
        for (const key of this.$order) entries.push(this[key]);
        return entries;
    }

    has(key) {
        return key in this;
    }

    get(key) {
        return this[key];
    }

    /**
     * assign class schema entry
     * @param {*} entry 
     */
    set(entry) {
        let key = entry.key;
        this[key] = entry;
        if (!this.$order.includes(key)) this.$order.push(key);
        // adjust order for sentries appropriately
        this.$order.sort(((self) => {
            return (a, b) => (self[a].order - self[b].order);
        })(this));
    }

    clear(key) {
        let idx = this.$order.indexOf(key);
        if (idx !== -1) this.$order.splice(idx, 1);
        if (Object.hasOwn(this, key)) delete this[key];
    }
}

class Gadget {

    static $registry = new Map();
    static register() {
        if (!Object.hasOwn(this.prototype, '$registered')) {
            this.prototype.$registered = true;
            if (!this.$registry.has(this.name)) this.$registry.set(this.name, this);
        }
    }

    static $gid = 1;
    static getgid() {
        return this.$gid++;
    }

    static get cfgpath() {
        let cls = this;
        let p;
        while (cls && (cls !== Gadget)) {
            let str;
            if (cls.cfgtoken) {
                str = cls.cfgtoken;
            } else {
                str = (cls.cfgtoken) ? cls.cfgToken : cls.name;
                str = str.charAt(0).toLowerCase() + str.slice(1);
            }
            if (!cls.hasOwnProperty('cfgpathskip')) p = (p) ? `${str}.${p}` : str;
            cls = Object.getPrototypeOf(cls);
        }
        return p;
    }

    static root(gadget) {
        if (!gadget) return null;
        for (; gadget.$trunk; gadget=gadget.$trunk);
        return gadget;
    }

    static findInPath(gadget, filter) {
        for (; gadget; gadget=gadget.$trunk) {
            if (filter(gadget)) return gadget;
        }
        return null;
    }

    static *eachInPath(gadget, filter=() => true) {
        for (; gadget; gadget=gadget.$trunk) {
            if (filter(gadget)) yield gadget;
        }
    }

    static *eachInLeafs(gadget, filter=() => true) {
        for (let i=gadget.$leafs.length-1; i>=0; i--) {
            let leaf = gadget.$leafs[i];
            if (filter(leaf)) yield leaf;
            yield *this.eachInLeafs(leaf, filter);
        }
    }

    static $link(trunk, key, sentry, target) {
        if (trunk === target || this.findInPath(trunk, (gdt) => gdt === target)) {
            console.error(`hierarchy loop detected ${target} already in path: ${trunk}`);
            throw(`hierarchy loop detected ${target} already in path: ${trunk}`);
        }
        trunk.$leafs.push(target);
        target.$trunk = trunk;
        target.$trunkKey = key;
        target.$trunkSentry = sentry;
        target.$path = (trunk.$path) ? `${trunk.$path}.${key}` : key;
        target.$v++;
        // handle path and flag changes propagated to leafs
        let eventable = (trunk.$flags & FEVENTABLE) && sentry.eventable;
        let readonly = (trunk.$flags & FREADONLY) || sentry.readonly;
        target.$flags = (eventable) ? (target.$flags|FEVENTABLE) : (target.$flags&~FEVENTABLE);
        target.$flags = (readonly) ? (target.$flags|FREADONLY) : (target.$flags&~FREADONLY);
        for (const leaf of this.eachInLeafs(target)) {
            // update flags
            eventable &= leaf.$trunkSentry.eventable;
            readonly |= leaf.$trunkSentry.readonly;
            leaf.$flags = (eventable) ? (leaf.$flags|FEVENTABLE) : (leaf.$flags&~FEVENTABLE);
            leaf.$flags = (readonly) ? (leaf.$flags|FREADONLY) : (leaf.$flags&~FREADONLY);
            // update path
            leaf.$path = `${leaf.$trunk.$path}.${leaf.$trunkKey}`;
        }
        if ('atLinkLeaf' in trunk) trunk.atLinkLeaf(target);
        if ('atLinkTrunk' in target) target.atLinkTrunk(trunk);
    }

    static $unlink(trunk, target) {
        let idx = trunk.$leafs.indexOf(target);
        if (idx !== -1) trunk.$leafs.splice(idx, 1);
        target.$trunk = null;
        target.$trunkSentry = null;
        target.$path = null;
        target.$v++;
        let eventable = (target && target.$emitter);
        let readonly = false;
        target.$flags = (eventable) ? (target.$flags|FEVENTABLE) : (target.$flags&~FEVENTABLE);
        target.$flags = (readonly) ? (target.$flags|FREADONLY) : (target.$flags&~FREADONLY);
        for (const leaf of this.eachInLeafs(target)) {
            // update flags
            eventable &= leaf.$trunkSentry.eventable;
            readonly |= leaf.$trunkSentry.readonly;
            leaf.$flags = (eventable) ? (leaf.$flags|FEVENTABLE) : (leaf.$flags&~FEVENTABLE);
            leaf.$flags = (readonly) ? (leaf.$flags|FREADONLY) : (leaf.$flags&~FREADONLY);
            // update path
            leaf.$path = (leaf.$trunk.$path) ? `${leaf.$trunk.$path}.${leaf.$trunkKey}` : leaf.$trunkKey;
        }
        if ('atUnlinkLeaf' in trunk) trunk.atUnlinkLeaf(target);
        if ('atUnlinkTrunk' in target) target.atUnlinkTrunk(trunk);
    }

    static $get(target, key, sentry=null) {
        if (sentry.getter) return sentry.getter(target);
        if (sentry.generator) {
            let value;
            if (!(key in target.$store)) {
                const dflt = sentry.getDefault(target);
                value = sentry.generator(target, dflt);
                target.$store[key] = [target.$v, value];
            } else {
                let ov = target.$store[key][0];
                value = target.$store[key][1];
                if (ov !== target.$v) {
                    value = sentry.generator(target, value);
                    target.$store[key] = [target.$v, value];
                }
            }
            return value;
        }
        return target.$store[key];
    }

    static $set(target, key, value, sentry) {
        let storedValue;
        if (target.$flags & FDEFINED) {
            storedValue = target.$store[key];
            if (Object.is(storedValue, value)) return true;
            if (sentry.link && (storedValue instanceof Gadget) && !(storedValue instanceof Gizmo)) this.$unlink(target, storedValue);
        }
        if (value) {
            if (sentry.link && (value instanceof Gadget) && !(value instanceof Gizmo)) {
                this.$link(target, key, sentry, value);
            } else if (sentry.link && Array.isArray(value)) {
                value = new GadgetArray(value);
                this.$link(target, key, sentry, value);
            } else if (sentry.link && (typeof value === 'object') && !(value instanceof Gizmo) && !value.$proxy) {
                value = new GadgetObject(value);
                this.$link(target, key, sentry, value);
            }
        }
        target.$store[key] = value;
        if (target.$flags & FDEFINED) {
            if (sentry.atUpdate) sentry.atUpdate( target, key, storedValue, value );
            for (const pgdt of this.eachInPath(target)) {
                if (pgdt.$trunkSentry && pgdt.$trunkSentry.atUpdate) {
                    pgdt.$trunkSentry.atUpdate(pgdt.$trunk, pgdt.$trunkKey, pgdt, pgdt);
                }
                pgdt.$v++;
            }
            if ((target.$flags & FEVENTABLE) && sentry.eventable) {
                let gemitter = this.findInPath(target, (gdt) => (gdt && gdt.$emitter));
                let path = (target.$path) ? `${target.$path}.${key}` : key;
                if (gemitter) Evts.trigger(gemitter, 'GizmoSet', { 'set': { [path]: value }});
            }
        }
        return true;
    }

    static $delete(target, key, sentry=null) {

        const storedValue = target[key];
        if (sentry.link && (storedValue instanceof Gadget) && !(storedValue instanceof Gizmo)) this.$unlink(target, storedValue);
        delete target.$store[key];
        if (target.$flags & FDEFINED) {
            target.$v++;
            if (sentry.atUpdate) sentry.atUpdate(target, key, storedValue, undefined);
            let pgdt = target;
            for (const pgdt of this.eachInPath(target.$trunk)) {
                if (pgdt.$trunkSentry && pgdt.$trunkSentry.atUpdate) pgdt.$trunkSentry.atUpdate(pgdt.$trunk, pgdt.$trunkKey, pgdt, pgdt);
                pgdt.$v++;
            }
            if ((target.$flags & FEVENTABLE) && sentry.eventable) {
                let gemitter = this.findInPath(target, (gdt) => (gdt && gdt.$emitter));
                let path = (target.$path) ? `${target.$path}.${key}` : key;
                if (gemitter) Evts.trigger(gemitter, 'GizmoSet', { 'set': { [path]: undefined }});
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
        schema.set(sentry);
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
            for (const sentry of schema.$entries) {
                if (sentry.generator) continue;
                this.$set(o, sentry.key, sentry.parser(o, spec), sentry);
            }
        }
    }

    static kvparse(o, key, value, sentry) {
        if (!sentry && o.$schema) sentry = o.$schema.get(key);
        if (sentry && value === undefined) value = sentry.getDefault(o);
        this.$set(o, key, value, sentry);
    }

    /**
     * xspec provides an GizmoSpec which can be used by a {@link Generator} class to create a Gadget object.
     * @param {Object} spec={} - overrides for properties to create in the GizmoSpec
     * @returns {...GizmoSpec}
     */
    static xspec(spec={}) {
        return {
            $gzx: true,
            cls: this.name,
            args: [Object.assign({}, spec)],
        }
    }

    #trunk;
    #trunkKey;
    #trunkSentry;
    #path;
    #leafs = [];
    #store = {};
    #flags = 0;
    #v = 0;

    get $trunk() { return this.#trunk };
    set $trunk(v) { this.#trunk = v };
    get $trunkKey() { return this.#trunkKey };
    set $trunkKey(v) { this.#trunkKey = v };
    get $trunkSentry() { return this.#trunkSentry };
    set $trunkSentry(v) { this.#trunkSentry = v };
    get $path() { return this.#path };
    set $path(v) { this.#path = v };
    get $leafs() { return this.#leafs };
    set $leafs(v) { this.#leafs = v };
    get $store() { return this.#store };
    set $store(v) { this.#store = v };
    get $flags() { return this.#flags };
    set $flags(v) { this.#flags = v };
    get $v() { return this.#v };
    set $v(v) { this.#v = v };

    constructor(...args) {
        this.constructor.register();
        if (this.$emitter) this.$flags |= FEVENTABLE;
        this.cpre(...args);
        this.cparse(...args);
        this.$flags |= FDEFINED;
    }

    /**
     * To allow for more flexible constructor methods, three sub constructors are used in all classes derived by the {@link Gizmo} class: cpre, cpost, cfinal.  
     * cpre is called at the very beginning before any properties are applied to the object.
     * @param {Object} args - object with key/value pairs used to pass properties to the constructor
     * @abstract
     */
    cpre(...args) {
    }

    cparse(spec={}) {
        this.constructor.xparse(this, spec);
    }

    destroy() {
        if (this.$trunk) {
            this.constructor.$unlink(this.$trunk, this);
        }
        while (this.$leafs.length>0) {
            let leaf = this.$leafs.pop();
            this.constructor.$unlink(this, leaf);
            if ('destroy' in leaf) leaf.destroy();
        }
    }

    xifyArgs(sdata) {
        const xargs = {};
        for (const [k,v] of Object.entries(this.$store)) {
            let sentry = (this.$schema) ? this.$schema.get(k) : null;
            if (sentry && !sentry.serializable) continue;
            if (v && (typeof v === 'object')) {
                if (v.contextable) {
                    xargs[k] = {
                        $gzx: true,
                        cls: '$Asset',
                        args: [{ tag:v.tag }],
                    };
                } else if ('xify' in v) {
                    xargs[k] = v.xify(sdata);
                } else {
                    if (sentry && sentry.serializer) {
                        xargs[k] = sentry.serializer(sdata, v);
                    } else {
                        xargs[k] = Serializer.xify(sdata, v);
                    }
                }
            } else {
                xargs[k] = v;
            }
        }
        return xargs;
    }

    xify(sdata) {
        const xargs = this.xifyArgs(sdata);
        const xdata = {
            $gzx: true,
            cls: this.constructor.name,
            args: [xargs],
        };
        return xdata;
    }

    get $dbg() {
        return `${this.$v},${this.$trunk},${this.$trunkKey},${this.$trunkSentry},${this.$path},${this.$leafs},${this.$store},${this.flags}`;
    }

    get $values() {
        return Object.values(this.$store);
    }

    $regen() {
        this.$v++;
    }

    toString() {
        return Fmt.toString(this.constructor.name);
    }

}

/**
 * Gizmo is the base class for all game state objects, including game model and view components.
 * - Global gizmo events are triggered on creation/destruction.
 * - Every gizmo is associated with a {@link GizmoCtx} that provides access to the global run environment and events.
 * - Gizmos can have parent/child hierarchical relationships
 * @extends Gadget
 */
class Gizmo extends Gadget {

    // SCHEMA --------------------------------------------------------------
    /** @member {int} Gizmo#gctx - reference to gizmo context */
    //static { this.schema('gctx', { readonly: true, dflt: () => GizmoCtx.$instance.gid }); }
    /** @member {int} Gizmo#gid - unique gadget identifier*/
    static { this.schema('gid', { readonly: true, dflt: () => Gadget.getgid() }); }
    /** @member {string} Gizmo#tag - tag for this gizmo */
    static { this.schema('tag', { order: 1, readonly: true, dflt: (gdt) => `${gdt.constructor.name}.${gdt.gid}` }); }
    static { this.schema('parent', { link: false, serializable: false, parser: () => null }); }
    static { this.schema('children', { link: false, parser: (o,x) => { 
            let v = x.children || [];
            for (const el of v) Hierarchy.adopt(o, el);
            return v;
        }, readonly: true });
    }

    // STATIC VARIABLES ----------------------------------------------------
    static cfgpathskip = true;
    static { this.prototype.$emitter = true; }

    // STATIC METHODS ------------------------------------------------------

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
        Evts.trigger(this, 'GizmoCreated');
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
        Evts.trigger(this, 'GizmoDestroyed');
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
    xify(sdata) {
        // save new serialized gzo
        if (!sdata.xgzos[this.gid]) {
            let xdata = super.xify(sdata);
            sdata.xgzos[this.gid] = xdata;
        }
        return {
            $gzx: true,
            cls: '$GizmoRef',
            gid: this.gid,
        }
    }

    /**
     * create string representation of object
     * @returns {string}
     */
    toString() {
        return Fmt.toString(this.constructor.name, this.gid, this.tag);
    }

}

function genProxy(target) {
    const proxy = new Proxy(target, {
        get(target, key, receiver) {
            if (key === '$proxy') return receiver;
            if (key === '$target') return target;
            const value = target[key];
            if (typeof key === 'string' && key.startsWith('$')) {
                return value;
            }
            if (value instanceof Function) {
                return function (...args) {
                    return value.apply(this === receiver ? target : this, args);
                };
            }
            return target.constructor.$get(target, key, target.esentry);
        },
        set(target, key, value, receiver) {
            if (typeof key === 'string' && key.startsWith('$')) {
                target[key] = value;
            } else {
                target.constructor.$set(target, key, value, target.esentry);
            }
            return true;
        },
        ownKeys(target) {
            return Object.keys(target.$store);
        },
        getOwnPropertyDescriptor(target, prop) {
            return {
                enumerable: true,
                configurable: true,
                value: target.$store[prop],
            };
        },
        deleteProperty(target, key) {
            target.constructor.$delete(target, key, target.esentry);
            return true;
        }
    });
    return proxy;
}

class GadgetArray extends Gadget {

    cparse(values) {
        if (!values) values = [];
        this.$store = [];
        this.esentry = new GadgetSchemaEntry('wrap', {link: true});
        for (let i=0; i<values.length; i++) {
            this.constructor.$set(this, i, values[i], this.esentry);
        }
    }

    constructor(...args) {
        super(...args);
        const proxy = genProxy(this);
        return proxy;
    }

    push(...v) {
        let i=this.$store.length;
        for (const el of v) {
            this.constructor.$set(this, i++, el, this.esentry);
        }
        return this.$store.length;
    }

    pop() {
        let idx = this.$store.length-1;
        if (idx < 0) return undefined;
        const v = this.$store[idx];
        this.constructor.$set(this, idx, undefined, this.esentry);
        this.$store.pop();
        return v;
    }

    unshift(...v) {
        let i=0;
        for (const el of v) {
            this.$store.splice(i, 0, undefined);
            this.constructor.$set(this, i++, el, this.esentry);
        }
        return this.$store.length;
    }

    shift() {
        if (this.$store.length < 0) return undefined;
        const v = this.$store[0];
        this.constructor.$set(this, 0, undefined, this.esentry);
        this.$store.shift();
        return v;
    }

    splice(start, deleteCount=0, ...avs) {
        let tidx = start;
        let aidx = 0;
        let dvs = [];
        // splice out values to delete, replace w/ items to add (if any)
        for (let i=0; i<deleteCount; i++ ) {
            dvs.push(this.$store[tidx])
            if (aidx < avs.length) {
                this.constructor.$set(this, tidx++, avs[aidx++], this.esentry);
            } else {
                this.constructor.$set(this, tidx, undefined, this.esentry);
                this.$store.splice(tidx++, 1);
            }
        }
        // splice in any remainder of items to add
        for ( ; aidx<avs.length; aidx++ ) {
            this.$store.splice(tidx, 0, undefined);
            this.constructor.$set(this, tidx++, avs[aidx], this.esentry);
        }
        return dvs;
    }

    // FIXME: missing a bunch of array functions
    filter(...args) {
        return this.$store.filter(...args);
    }

    *[Symbol.iterator]() {
        for (const v of this.$values) yield v;
    }

    xify(sdata) {
        let xargs = this.xifyArgs(sdata);
        return Object.values(xargs);
    }

    toString() {
        return Fmt.toString(this.constructor.name, ...this.$values);
    }

}

class GadgetObject extends Gadget {
    cparse(values) {
        if (!values) values = {};
        this.$store = values;
        this.esentry = new GadgetSchemaEntry('wrap', { link: true });
        for (const [k,v] of Object.entries(values)) {
            this.constructor.$set(this, k, v, this.esentry);
        }
    }

    constructor(...args) {
        super(...args);
        const proxy = genProxy(this);
        return proxy;
    }

    xify(sdata) {
        return this.xifyArgs(sdata);
    }
}