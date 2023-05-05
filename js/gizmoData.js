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

    static link(trunk, key, sentry, target) {
        if (!trunk || !target) return false;
        if (trunk === target || this.findInPath(trunk.$link, (n) => n === target)) {
            throw(`hierarchy loop detected ${target} already in path: ${trunk}`);
        }
        if (!trunk.$link) trunk.$link = new GizmoDataLink( trunk );
        if (!target.$link) target.$link = new GizmoDataLink( target );
        if (!trunk.$link.leafs) {
            trunk.$link.leafs = [ target.$link ];
        } else {
            trunk.$link.leafs.push(target.$link);
        }
        target.$link.trunk = trunk.$link;
        target.$link.sentry = sentry;
        target.$link.key = key;
        //console.log(`link ${trunk} to ${target} key: ${key} cname: ${target.constructor.name} schema: ${target.constructor.$schema}`);
        if (target.$schema) {
            //console.log(`-- link ${trunk}.${key} to ${target} deps: ${Array.from(target.constructor.$schema.trunkGenDeps)}`);
            for (const agk of target.$schema.trunkGenDeps) {
                //console.log(`XXX set autogen ${target}.${agk}`);
                GizmoData.set(target, agk, '#autogen#');
            }
        }
        this.linkUpdate(target, target);
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
            if (this.generator) return this.generator(o,this.dflt);
            return this.dflt;
        });
        this.renderable = ('renderable' in spec) ? spec.renderable : false;
        this.eventable = (this.readonly) ? false : ('eventable' in spec) ? spec.eventable : true;
        this.atUpdate = spec.atUpdate;
        // nolink - if the value is an object, do not setup GizmoData links between the trunk and leaf.  This will disable any GizmoData-specific logic for this key
        this.nolink = ('nolink' in spec) ? spec.nolink : false;
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
        //console.log(`== set ${target} ${key}=>${value}`);
        // FIXME: link
        if (value && (typeof value === 'object') && (!sentry || !sentry.nolink)) {
            if (sentry && sentry.proxy) {
                value = (Array.isArray(value)) ? GizmoArray.wrap(value) : GizmoObject.wrap(value);
            }
            //console.log(`set linking ${target}.${key} to ${value}`);
            GizmoDataLink.link(target, key, sentry, value);
        }
        target.$values[key] = value;
        if (target.$defined) {
            if (sentry) {
                if (sentry.atUpdate) sentry.atUpdate( target, target, key, storedValue, value );
                for (const agk of sentry.autogendeps) this.set(target, agk, '#autogen#');
            }
            //console.log(`target: ${target} key: ${key}`);
            const watchers = (target.$link) ? target.$link.watchers : null;
            if (watchers) {
                for (const watcher of watchers) {
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
                //console.log(`run sentry: ${sentry}`);
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
        console.log(`-- destroy ${this}`);
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
        const proxy = new Proxy(array, {
            get(target, key, receiver) {
                if (key === '$values') return target;
                if (key === '$defined') return true;
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
                    console.log(`target: ${target} link: ${target.$link}`);
                    const storedValue = target[key];
                    if (storedValue && typeof storedValue === 'object') GizmoDataLink.unlink(target, storedValue);
                    delete target[key];
                    const watchers = (target.$link) ? target.$link.watchers : null;
                    if (watchers) {
                        for (const watcher of watchers) {
                            console.log(`trigger delete watcher for node: ${watcher.node}`);
                            watcher.watcher(target, key, storedValue, undefined);
                        }
                    }
                    if (!target.$link || !target.$link.trunk) {
                        console.log(`trigger delete`);
                        if (EvtSystem.isEmitter(target) && (!sentry || sentry.eventable)) {
                            console.log(`target: ${target} sentry: ${sentry} emit delete: ${key}:${value}`);
                            EvtSystem.trigger(target, 'gizmo.delete', { 'set': { [key]: undefined }});
                        }
                    }
                }
                return true;
            }

        });
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
        //console.log(`-- obj is: ${obj} constructor: ${obj.constructor.name}`);
        const proxy = new Proxy(obj, {
            get(target, key, receiver) {
                if (key === '$values') return target;
                if (key === '$defined') return true;
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