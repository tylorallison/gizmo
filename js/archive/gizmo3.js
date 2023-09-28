export { GizmoData, GizmoArray, GizmoObject };

import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { Serializer } from './serializer.js';
import { Util } from './util.js';

class GizmoDataLink {

    static *eachInPath(link, filter) {
        for (; link; link=link.trunk) {
            if (filter(link.node)) yield link.node;
        }
    }

    static findInPath(link, filter) {
        for (; link; link=link.trunk) {
            if (filter(link.node)) return link.node;
        }
        return null;
    }

    static root(link) {
        if (!link) return null;
        for (; link.trunk; link=link.trunk);
        return link.node;
    }

    static path(link) {
        let path = null;
        while (link.trunk) {
            path = (path) ? `${link.key}.${path}` : link.key;
            link = link.trunk;
        }
        return path;
    }

    static assignLinkProperty(obj, link) {
        Object.defineProperty(obj, '$link', {
            value: link,
            enumerable: false,
            writable: false,
            configurable: false,
        });
    }

    static link(trunk, key, sentry, target) {
        if (!trunk || !target) return false;
        if (trunk === target || this.findInPath(trunk.$link, (n) => n === target)) {
            console.error(`hierarchy loop detected ${target} already in path: ${trunk}`);
            throw(`hierarchy loop detected ${target} already in path: ${trunk}`);
        }
        //if (!trunk.$link) trunk.$link = new GizmoDataLink( trunk );
        if (!trunk.$link) this.assignLinkProperty(trunk, new GizmoDataLink( trunk ));
        //if (!target.$link) target.$link = new GizmoDataLink( target );
        if (!target.$link) this.assignLinkProperty(target, new GizmoDataLink( target ));
        if (!trunk.$link.leafs) {
            trunk.$link.leafs = [ target.$link ];
        } else {
            trunk.$link.leafs.push(target.$link);
        }
        target.$link.trunk = trunk.$link;
        target.$link.sentry = sentry;
        target.$link.key = key;
        //console.log(`== link ${trunk} to ${target} key: ${key} cname: ${target.constructor.name} schema: ${target.$schema}`);
        if (target.$schema) {
            //console.log(`-- link ${trunk}.${key} to ${target} deps: ${Array.from(target.constructor.$schema.trunkGenDeps)}`);
            for (const agk of target.$schema.trunkGenDeps) {
                //console.log(`XXX set autogen ${target}.${agk}`);
                GizmoData.set(target, agk, '#autogen#');
            }
        }
        this.linkUpdate(target, target);
        if ('atLink' in target) target.atLink(trunk);
    }

    static unlink(trunk, target) {
        //console.log(`unlink: ${trunk} ${trunk.$link} for ${target} ${target.$link}`);
        if (!trunk || !target || !trunk.$link || !target.$link) return;
        if (trunk.$link.leafs) {
            let idx = trunk.$link.leafs.indexOf(target.$link);
            if (idx !== -1) trunk.$link.leafs.splice(idx, 1);
        }
        target.$link.trunk = null;
        target.$link.sentry = null;
        target.$link.key = null;
        if (target.$schema) {
            for (const agk of target.$schema.trunkGenDeps) GizmoData.set(target, agk, '#autogen#');
        }
        this.linkUpdate(null, target);
        if ('atUnlink' in target) target.atUnlink(trunk);
    }

    static linkUpdate(trunk, target) {
        //console.log(`>> linkUpdate on evaluate: ${trunk},${target}`);
        let link = target.$link;
        if (link.watchers) for (let i=link.watchers.length-1; i>=0; i--) {
            //console.log(`look at watcher: ${Fmt.ofmt(link.watchers[i])}`);
            if (!link.trunk || !this.findInPath(link.trunk, (n) => n===link.watchers[i].node)) {
                //console.log(`-- remove watcher: ${Fmt.ofmt(link.watchers[i])}`);
                link.watchers.splice(i, 1);
            }
        }
        if (trunk) {
            let eventable = true;
            for (const tnode of this.eachInPath(trunk.$link, () => true)) {
                let tlink = tnode.$link;
                if (tlink.sentry && tlink.sentry.atUpdate) {
                    //console.log(`-- add watcher ${tlink.trunk.node} on ${link.node}`);
                    link.addWatcher(tlink.trunk.node, (n,k,ov,nv) => tlink.sentry.atUpdate( tlink.trunk.node, n, k, ov, nv ));
                }
                if (tlink.sentry && tlink.sentry.autogendeps.size) {
                    //console.log(`-- add autogen watcher ${tlink.trunk.node} on ${link.node}`);
                    link.addWatcher(tlink.trunk.node, (n,k,ov,nv) => { for (const agk of tlink.sentry.autogendeps) GizmoData.set(tlink.trunk.node, agk, '#autogen#'); });
                }
                //console.log(`-- link ${tlink} node: ${tlink.node} eventable: ${tlink.sentry && tlink.sentry.eventable}`);
                //console.log(`-- tlink.trunk ${tlink.trunk} eventable: ${eventable} emitter: ${EvtSystem.isEmitterCls(tlink.node.constructor)}`);
                if (tlink.sentry) eventable &= tlink.sentry.eventable;
                if (!tlink.trunk && eventable && EvtSystem.isEmitterCls(tlink.node.constructor)) {
                    let path = this.path(link);
                    //console.log(`path: ${path}`);
                    link.addWatcher(tlink.node, (n,k,ov,nv) => {
                        let sentry = (n.$schema) ? n.$schema.map[k] : null;
                        if (!sentry || sentry.eventable) {
                            EvtSystem.trigger(tlink.node, 'gizmo.set', { 'set': { [`${path}.${k}`]: nv }});
                        }
                    });
                }
            }
        }
        if (link.leafs) {
            for (const llink of link.leafs) {
                //console.log(`>>>> linkUpdate dive: ${llink} ${trunk},${llink.node}`);
                this.linkUpdate(trunk, llink.node);
            }
        }
    }

    constructor(node) {
        this.node = node;
    }

    addWatcher(node, watcher, pri=0) {
        if (!this.watchers) this.watchers = [];
        this.watchers.push({ node: node, watcher: watcher, pri: pri});
        this.watchers.sort((a,b) => a.pri-b.pri);
    }
    delWatcher(node) {
        for (let i=this.watchers.length-1; i>=0; i--) if (this.watchers[i].node === node) this.watchers.splice(i, 1);
    }

    destroy() {
        if (this.trunk) {
            this.constructor.unlink(this.trunk.node, this.node);
        }
        if (this.leafs) {
            let leafs = this.leafs;
            this.leafs = null;
            for (const llink of leafs) {
                this.constructor.unlink(this.node, llink.node);
                if (llink.node.destroy) llink.node.destroy();
            }
        }
    }

    toString() {
        return Fmt.toString(this.constructor.name, 
            this.node, 
            (this.trunk) ? this.trunk.node : null, 
            (this.leafs) ? this.leafs.map((v) => v.node.toString()).join(',') : null);
    }

}

class SchemaEntry {
    constructor(key, spec={}) {
        this.key = key;
        this.dflt = spec.dflt;
        this.dflter = spec.dflter;
        this.specKey = spec.specKey || this.key;
        // getter function of format (object, specification) => { <function returning value> };
        // -- is treated as a dynamic value
        // -- setting getter will disable all set functions and notifications for this key
        this.getter = spec.getter;
        // generator function of format (object, value) => { <function returning final value> };
        this.generator = spec.generator;
        this.readonly = (this.getter) ? true : ('readonly' in spec) ? spec.readonly : false;
        this.autogen = spec.autogen;
        this.autogendeps = new Set();
        this.parser = spec.parser || ((o, x) => {
            if (this.specKey in x) return x[this.specKey];
            const dflt = (this.dflter) ? this.dflter(o) : this.dflt;
            if (this.generator) return this.generator(o,dflt);
            return dflt;
        });
        this.proxy = ('proxy' in spec) ? spec.proxy : false;
        this.renderable = ('renderable' in spec) ? spec.renderable : false;
        this.eventable = (this.getter) ? false : ('eventable' in spec) ? spec.eventable : true;
        this.atUpdate = spec.atUpdate;
        // link - if the value is an object, setup GizmoData links between the trunk and leaf.
        this.link = ('link' in spec) ? spec.link : true;
        // autogen fields are not serializable
        this.serializable = (this.autogen) ? false : ('serializable' in spec) ? spec.serializable : true;
        this.serializeKey = spec.serializeKey ? spec.serializeKey : this.key;
        this.serializer = spec.serializer || ((sdata, target, value) => (typeof value === 'object') ? JSON.parse(JSON.stringify(value)) : value);
    }
    toString() {
        return Fmt.toString(this.constructor.name, this.key);
    }
}

class Schema {
    constructor(base={}) {
        if (!base) base = {};
        this.map = Object.assign({}, base.map);
        this.entries = Array.from(base.entries || []);
        // track auto generation mapping
        // -- key: key of attribute that is being set
        // -- value: set of attribute keys that need to be generated when the keyed attribute changes
        this.trunkGenDeps = new Set(base.trunkGenDeps || []);
        this.parser = null;
    }
}

class GizmoData {
    static registry = new Map();
    static init() {
        if (!this.registry.has(this.name)) this.registry.set(this.name, this);
    }

    static *eachInPath(node, filter) {
        if (node) yield *GizmoDataLink.eachInPath(node.$link, filter);
    }

    static findInPath(node, filter) {
        if (node) return GizmoDataLink.findInPath(node.$link, filter);
        return null;
    }

    static root(node) {
        if (node) return GizmoDataLink.root(node.$link);
        return null;
    }

    static path(node) {
        if (node) return GizmoDataLink.path(node.$link);
        return null;
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

    static schema(cls, key, spec={}) {
        let schema;
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

    static clearSchema(cls, key) {
        let schema = (cls && cls.prototype) ? cls.prototype.$schema : null;
        if (schema) {
            let sentry = schema.map[key];
            let idx = schema.entries.indexOf(sentry);
            if (idx !== -1) schema.entries.splice(idx, 1);
            delete schema.map[key];
            for (const entry of schema.entries) entry.autogendeps.delete(key);
            schema.trunkGenDeps.delete(key);
        }
        if (cls.prototype) delete cls.prototype[key];
    }

    static schemaEntryClass = SchemaEntry;
    static schemaClass = Schema;

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

    /**
     * xspec provides an GizmoSpec which can be used by a {@link Generator} class to create a GizmoData object.
     * @param {Object} spec={} - overrides for properties to create in the GizmoSpec
     * @returns {...GizmoSpec}
     */
    static xspec(spec={}) {
        this.init();
        return Object.assign({
            $gzx: true,
            cls: this.name,
        }, spec);
    }

    constructor(spec={}, applySchema=true) {
        this.constructor.init();
        this.$values = {};
        if (applySchema) this.constructor.parser(this, spec);
    }

    /**
     * destroy breaks any links associated with the data
     */
    destroy() {
        //console.log(`-- destroy ${this}`);
        if (this.$link) this.$link.destroy();
    }

    xify(sdata) {
        return Serializer.xifyData(sdata, this.$values, { 
            $gzx: true,
            cls: this.constructor.name,
        }, this.$schema );
    }

    $regen() {
        if (this.$schema) {
            for (const agk of this.$schema.trunkGenDeps) {
                //console.log(`== regen ${this}.${agk}`);
                GizmoData.set(this, agk, '#autogen#');
            }
        }
    }

    toString() {
        return Fmt.toString(this.constructor.name);
    }

}

class GizmoArray {

    static wrap(array) {
        let defined = false;
        const proxy = new Proxy(array, {
            get(target, key, receiver) {
                if (key === '$values') return target;
                if (key === '$defined') return defined;
                if (key === '$proxy') return receiver;
                if (target.$link) {
                    switch (key) {
                        case 'destroy': 
                            return () => {
                                if (target.$link) target.$link.destroy();
                                delete target['$link'];
                                if (target.destroy) target.destroy();
                            }
                        case 'push':
                            return (...v) => {
                                let i=target.length;
                                for (const el of v) {
                                    GizmoData.set(receiver, i++, el);
                                }
                                return target.length;
                            }
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
                    }
                }
                const value = target[key];
                if (value instanceof Function) {
                    return function (...args) {
                        return value.apply(this === receiver ? target : this, args);
                    };
                }
                return value;
            },
            set(target, key, value, receiver) {
                if (key.startsWith('$')) {
                    target[key] = value;
                } else {
                    GizmoData.set(receiver, key, value);
                }
                return true;
            },
            deleteProperty(target, key) {
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
                return true;
            }

        });
        let i = 0;
        for (const v of array) {
            //console.log(`---- array[${i} v: ${v}`);
            GizmoData.set(proxy, i++, v);
        }
        defined = true;
        return proxy;
    }

    constructor() {
        let array = Array.from(arguments);
        return this.constructor.wrap(array);
    }

    /**
     * destroy breaks any links associated with the data
     */
    destroy() {
        if (this.$link) this.$link.destroy();
    }

}

class GizmoObject {

    static wrap(obj) {
        let defined = false;
        //console.log(`-- obj is: ${obj} constructor: ${obj.constructor.name}`);
        const proxy = new Proxy(obj, {
            get(target, key, receiver) {
                if (key === '$values') return target;
                if (key === '$defined') return defined;
                if (key === '$proxy') return receiver;
                if (target.$link) {
                    switch (key) {
                        case 'destroy': 
                            return () => {
                                if (target.$link) target.$link.destroy();
                                delete target['$link'];
                                if (target.destroy) target.destroy();
                            }
                    }
                }
                const value = target[key];
                //if (key === 'constructor') console.log(`key: ${key.toString()} receiver: ${receiver}`);
                if (value instanceof Function && key !== 'constructor') {
                    return Util.nameFunction(value.name, function (...args) {
                        return value.apply(this === receiver ? target : this, args);
                    });
                }
                return value;
            },
            set(target, key, value, receiver) {
                if (key.startsWith('$')) {
                    target[key] = value;
                } else {
                    GizmoData.set(receiver, key, value);
                }
                return true;
            },
            deleteProperty(target, key) {
                if (key in target) {
                    const storedValue = target[key];
                    if (storedValue && typeof storedValue === 'object') GizmoDataLink.unlink(target, storedValue);
                    delete target[key];
                    const watchers = (target.$link) ? target.$link.watchers : null;
                    if (watchers) {
                        for (const watcher of watchers) watcher.watcher(target, key, storedValue, undefined);
                    }
                    if (!target.$link || !target.$link.trunk) {
                        if (EvtSystem.isEmitter(target) && (!sentry || sentry.eventable)) {
                            EvtSystem.trigger(target, 'gizmo.set', { 'set': { [key]: undefined }});
                        }
                    }
                }
                return true;
            }
        });
        for (const [k,v] of Object.entries(obj)) GizmoData.set(proxy, k, v);
        defined = true;
        //console.log(`-- proxy is: ${proxy} constructor: ${proxy.constructor.name}`);
        return proxy;
    }

    constructor(obj) {
        if (!obj) obj = {};
        return this.constructor.wrap(obj);
    }

    /**
     * destroy breaks any links associated with the data
     */
    destroy() {
        if (this.$link) this.$link.destroy();
    }

}

export { Gizmo };

import { GizmoContext } from './gizmoContext.js';
import { ExtEvtEmitter, ExtEvtReceiver, EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { ExtHierarchy, Hierarchy } from './hierarchy.js';
import { GizmoData } from './gizmoData.js';
import { Serializer } from './serializer.js';

/**
 * Gizmo is the base class for all game state objects, including game model and view components.
 * - Global gizmo events are triggered on creation/destruction.
 * - Every gizmo is associated with a {@link GizmoContext} that provides access to the global run environment and events.
 * - Gizmos can have parent/child hierarchical relationships
 * @extends GizmoData
 */
class Gizmo extends GizmoData {

    // SCHEMA --------------------------------------------------------------
    /** @member {GizmoContext} Gizmo#gctx - reference to gizmo context */
    static { this.schema(this, 'gctx', { readonly: true, serializable: false, link: false, parser: (obj, x) => (x.gctx || GizmoContext.main )}); }
    /** @member {int} Gizmo#gid - unique gizmo identifier*/
    static { this.schema(this, 'gid', { readonly: true, parser: (obj, x) => (Gizmo.gid++) }); }
    /** @member {string} Gizmo#tag - tag for this gizmo */
    static { this.schema(this, 'tag', { readonly: true, parser: (obj, x) => x.tag || `${obj.constructor.name}.${obj.gid}` }); }
    static {
        ExtEvtEmitter.apply(this);
        ExtEvtReceiver.apply(this);
        ExtHierarchy.apply(this);
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

    // STATIC METHODS ------------------------------------------------------
    /**
     * listen sets a new event handler for an event, where the emitter is the global game context {@link GizmoContext} and
     * the receiver is given along with the event tag and event handler function {@link EvtSystem~handler}.
     * @param {ExtEvtReceiver} receiver - event receiver, which object is "listening" for this event?
     * @param {string} tag - event tag to listen for
     * @param {EvtSystem~handler} fcn - event handler function
     * @param {Object} [opts] - options for event listen
     * @param {int} opts.priority - priority associated with listener, event callbacks will be sorted based on ascending priority.
     * @param {boolean} opts.once - indicates if event listener should only be triggered once (after which the listener will automatically be removed).
     * @param {EvtSystem~filter} opts.filter - event filter for listener allowing for fine-grained event management.
     */
    static listen(receiver, tag, fcn, opts={}) {
        EvtSystem.listen(this.gctx, receiver, tag, fcn, opts);
    }

    /**
     * ignore removes an event handler for an event, where the emitter is the global game context {@link GizmoContext} and
     * the receiver is given.
     * @param {ExtEvtReceiver} receiver - event receiver, which object is "listening" for this event?
     * @param {*} [tag] - optional event tag associated with listener to remove.  If not specified, all events associated with receiver
     * will be removed.
     * @param {EvtSystem~handler} [fcn] - optional event handler function, specifying specific event callback to remove.  If not specified, 
     * all events associated with the receiver and the given tag will be removed.
     */
    static ignore(receiver, tag, fcn) {
        EvtSystem.ignore(this.gctx, receiver, tag, fcn);
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    /**
     * Create a Gizmo
     * @param {Object} spec - object with key/value pairs used to pass properties to the constructor
     */
    constructor(spec={}) {
        let gctx = spec.gctx || GizmoContext.main;
        let proxied = gctx.proxied;
        super(spec, false, proxied);
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

    // -- overridable constructor functions
    /**
     * To allow for more flexible constructor methods, three sub constructors are used in all classes derived by the {@link Gizmo} class: cpre, cpost, cfinal.  
     * cpre is called at the very beginning before any properties are applied to the object.
     * @param {Object} spec - object with key/value pairs used to pass properties to the constructor
     * @abstract
     */
    cpre(spec={}) {
    }
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
    
    /**
     * create string representation of object
     * @returns {string}
     */
    toString() {
        return Fmt.toString(this.constructor.name, this.gid, this.tag);
    }

}

export { GizmoContext };

import { ExtEvtEmitter } from './event.js';
import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';

/**
 * The GizmoContext class provides a global context that is attached to all classes derived from the {@link Gizmo} class.  It groups
 * all Gizmo instances to the context as well as provides access to global context variables such as the main {@link Game} class.
 * @extends GizmoData
 * @mixes ExtEvtEmitter
 */
class GizmoContext extends GizmoData {
    // STATIC VARIABLES ----------------------------------------------------
    static _main;
    static ctxid = 1;

    // STATIC PROPERTIES ---------------------------------------------------
    /**
     * @member {GizmoContext} - get/set singleton/global instance of GizmoContext
     */
    static get main() {
        if (!this._main) {
            this._main = new GizmoContext();
        }
        return this._main;
    }
    static set main(v) {
        this._main = v;
    }

    // SCHEMA --------------------------------------------------------------
    /** @member {int} GizmoContext#ctxid - global id associated with context */
    /** @member {string} GizmoContext#tag - tag associated with context */
    /** @member {Game} GizmoContext#game - game instance */
    /** @member {boolean} GizmoContext#userActive - indicates if user has interacted with UI/game by clicking or pressing a key */
    static {
        this.schema(this, 'ctxid', { readonly: true, parser: (obj, x) => obj.constructor.ctxid++ });
        this.schema(this, 'tag', { readonly: true, parser: (obj, x) => x.tag || `${obj.constructor.name}.${obj.ctxid}` });
        this.schema(this, 'game', { dflt: null });
        this.schema(this, 'userActive', { dflt: false });
        this.schema(this, 'proxied', { dflt: true });
        ExtEvtEmitter.apply(this);
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