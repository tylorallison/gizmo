export { GizmoData };

import { EvtSystem } from './event.js';
import { SchemaEntry } from './schema.js';
import { Fmt } from './fmt.js';

class GizmoHandle {
    static root(hdl) {
        while (hdl) {
            if (hdl.trunk) {
                hdl = hdl.trunk;
            } else {
                return hdl;
            }
        }
        return null;
    }

    static findInTrunk(hdl, filter) {
        for (let trunk=hdl.trunk; trunk; trunk=trunk.trunk) {
            if (filter(trunk)) return trunk;
        }
        return null;
    }

    static findInPath(hdl, filter) {
        for (let trunk=hdl; trunk; trunk=trunk.trunk) {
            if (filter(trunk)) return trunk;
        }
        return null;
    }

    static path(hdl) {
        let path = null;
        while (hdl.trunk) {
            let key = hdl.keyer();
            path = (path) ? `${key}.${path}` : key;
            hdl = hdl.trunk;
        }
        return path;
    }

    static *eachInPath(hdl, filter) {
        for (; hdl; hdl=hdl.trunk) {
            if (filter(hdl)) yield hdl;
        }
    }

    constructor(node) {
        this.node = node;
        this.schema = node.constructor.$schema;
        this.trunk = null;
        this.proxy = null;
        this.sentry = null;
        this.watchers = [];
        this.keyer = () => (this.sentry) ? this.sentry.key : '';
        this.pathEventable = EvtSystem.isEmitterCls(node.constructor);
        this.pathUpdatable = false;
        this.pathAutogen = false;
        this.pathReadonly = false;
        this.pathRenderable = false;
        this.finalized = false;
        //console.log(`${node} pathEventable: ${this.pathEventable} schema.customized: ${(this.schema) ? this.schema.customized : null}`);
        this.get = this.iget;
        this.set = this.iset;
    }

    finalize() {
        this.finalized = true;
        if (EvtSystem.isEmitter(this.node)) this.addWatcher(this, (h,k,ov,nv) => {
            let sentry = (this.schema) ? this.schema.map[k] : null;
            let renderable = (sentry) ? sentry.renderable : false;
            let eventable = (sentry) ? sentry.eventable : false;
            if (eventable) EvtSystem.trigger(h.proxy, 'gizmo.set', { set: { [k]: nv }, render: renderable });
        });
    }


    addWatcher(link, watcher, pri=0) {
        this.watchers.push({ link: link, watcher: watcher, pri: pri});
        this.watchers.sort((a,b) => a.pri-b.pri);
    }
    delWatcher(link) {
        for (let i=this.watchers.length-1; i>=0; i--) if (this.watchers[i].link === link) this.watchers.splice(i, 1);
    }

    linkUpdate() {
        for (let i=this.watchers.length-1; i>=0; i--) if (!this.constructor.findInPath(this.trunk, (h) => h===this.watchers[i].link)) this.watchers.splice(i, 1);
        // FIXME: add watchers
        let trunk = this.trunk;
        if (trunk) {
            //console.log(`linkUpdate: ${this.constructor.path(this)} schema.eventable: ${this.schema.eventable} trunk.pathEventable: ${trunk.pathEventable}`);
            this.pathEventable = this.sentry.eventable && trunk.pathEventable;
            this.pathUpdatable = this.sentry.atUpdate || trunk.pathUpdatable;
            this.pathAutogen = (this.sentry.autogendeps.size || trunk.pathAutogen);
            this.pathReadonly = this.sentry.readonly || trunk.pathReadonly;
            this.pathRenderable = this.sentry.renderable || trunk.pathRenderable;
            if (this.pathEventable) {
                let root = this.constructor.root(trunk);
                let path = this.constructor.path(this);
                this.addWatcher(root, (h,k,ov,nv) => {
                    let sentry = (this.schema) ? this.schema.map[k] : null;
                    let renderable = (sentry) ? sentry.renderable|this.pathRenderable : this.pathRenderable;
                    let eventable = (sentry) ? sentry.eventable : false;
                    if (eventable) EvtSystem.trigger(root.proxy, 'gizmo.set', { set: { [`${path}.${k}`]: nv }, render: renderable });
                });
            }
            if (this.pathUpdatable) {
                for (const hdl of this.constructor.eachInPath(this, (h) => h.sentry && h.sentry.atUpdate)) {
                    this.addWatcher(hdl.trunk, (h,k,ov,nv) => hdl.sentry.atUpdate( hdl.trunk.proxy, h.proxy, k, ov, nv ));
                }
            }
            if (this.pathAutogen) {
                for (const hdl of this.constructor.eachInPath(this, (h) => (h.sentry && h.sentry.autogendeps.size))) {
                    this.addWatcher(hdl.trunk, (h,k,ov,nv) => {
                        for (const agk of hdl.sentry.autogendeps) {
                            if (agk in hdl.trunk.node) hdl.trunk.set(hdl.trunk.node, agk, '#autogen#');
                        }
                    });
                }
            }
        } else {
            this.pathEventable = EvtSystem.isEmitter(this.node);
            this.pathUpdatable = false;
            this.pathAutogen = false;
            this.pathReadonly = false;
            this.pathRenderable = false;
        }
        if (this.schema) {
            for (const sentry of this.schema.entries) {
                let att = this.node[sentry.key];
                if (att && att instanceof GizmoData) {
                    att.$handle.linkUpdate();
                }
            }
        }
    }

    // -- defines method to set new trunk link
    /**
     * @param {handle} trunk 
     * @param {sentry} sentry 
     * @param {*} keyer 
     */
    link(trunk, sentry, keyer) {
        console.log(`link: ${trunk.node}->${this.node} sentry: ${sentry.key}`);
        // set link
        this.trunk = trunk;
        this.sentry = sentry;
        if (keyer) this.keyer = keyer;
        // update path variables for this node and all dependent branch nodes
        this.linkUpdate()
        if (this.node.atLink) this.node.atLink(trunk.proxy);
        // regenerate updates to autogenerated fields
        if (this.schema) {
            for (const agk of this.schema.trunkGenDeps) {
                if (agk in this.node) this.set(this.node, agk, '#autogen#');
            }
        }
    }

    unlink() {
        let trunk = this.trunk;
        this.trunk = null;
        this.sentry = null;
        this.keyer = null;
        this.linkUpdate()
        if (this.node.atUnlink) this.node.atUnlink(trunk);
        // regenerate updates to autogenerated fields
        if (this.schema) {
            for (const agk of this.schema.trunkGenDeps) {
                if (agk in this.node) this.set(this.node, agk, '#autogen#');
            }
        }
    }

    cset(target, key, value) {
        let sentry = (this.schema) ? this.schema.map[key] : null;
        if (sentry) {
            if (sentry.generator) value = sentry.generator(target, value);
            if (sentry.link) {
                if (value && this.constructor.findInPath(this, (hdl) => hdl === value.$handle)) {
                    console.error(`hierarchy loop detected ${value} already in path: ${this.node}`);
                    return false;
                }
                target[key] = value;
                if (value) {
                    if (Array.isArray(value)) {
                        // FIXME
                        // @@@
                        let p = GizmoArrayHandle.attach(this, sentry, value);
                        console.log(`p: ${p}`);
                        target[key] = p;
                    } else {
                        value.$handle.link(this, sentry);
                    }
                }
            } else {
                target[key] = value;
            }
            if (sentry.atUpdate) this.addWatcher(this, (h,k,ov,nv) => {
                if (k === key) sentry.atUpdate( (h.trunk) ? h.trunk.proxy : null, h.proxy, key, ov, nv );
            });
            if (sentry.link) this.addWatcher(this, (h,k,ov,nv) => {
                if (k !== key) return;
                if (ov && ov instanceof GizmoData) ov.$handle.unlink();
                if (nv && nv instanceof GizmoData) nv.$handle.link(h, sentry);
            });
            if (sentry.autogendeps.size) {
                this.addWatcher(this, (h,k,ov,nv) => {
                    if (k !== key) return;
                    for (const agk of sentry.autogendeps) {
                        if (agk in this.node) this.set(this.node, agk, '#autogen#');
                    }
                });
            }
        } else {
            target[key] = value;
        }
        return true;
    }

    pget(target, key, receiver) {
        const value = target[key];
        if (key === '$handle') return this;
        if (key === '$target') return target;
        if (value instanceof Function) {
            return function (...args) {
                return value.apply(this === receiver ? target : this, args);
            };
        }
        return value;
    }

    pset(target, key, value) {
        target[key] = value;
        return true;
    }

    iget(target, key, receiver) {
        let sentry = (this.schema) ? this.schema.map[key] : null;
        if (sentry && sentry.getter) return sentry.getter(target);
        //console.log(`key: ${key.toString()} this: ${this}`);
        if (key === '$handle') return this;
        if (key === '$target') return target;
        const value = target[key];
        if (value instanceof Function) {
            return function (...args) {
                return value.apply(this === receiver ? target : this, args);
            };
        }
        return target[key];
    };

    iset(target, key, value) {
        let sentry = (this.schema) ? this.schema.map[key] : null;
        if (sentry.getter) return false;
        let storedValue = target[key];
        if (sentry) {
            if (this.finalized && (sentry.readonly || this.pathReadonly)) {
                console.error(`can't set ${key} -- readonly ${sentry.readonly} pathRO: ${this.pathReadonly}`);
                return true;
            }
            if (sentry.generator) value = sentry.generator(target, value);
        }
        if (Object.is(storedValue, value)) return true;
        if (sentry) {
            if (sentry.link) {
                if (value && this.constructor.findInPath(this, (hdl) => hdl === value.$handle)) {
                    console.error(`hierarchy loop detected ${value} already in path: ${this.node}`);
                    return false;
                }
                //if (storedValue) storedValue.$handle.unlink();
                target[key] = value;
                //if (value) value.$handle.link(this, sentry);
            } else {
                target[key] = value;
            }
        } else {
            target[key] = value;
        }
        if (this.watchers) {
            for (const watcher of this.watchers) watcher.watcher(this, key, storedValue, value);
        }


        return true;
    }
}

class GizmoData {
    static registry = new Map();
    static init() {
        if (!this.registry.has(this.name)) this.registry.set(this.name, this);
    }
    
    /**
     * root returns the root of the given GizmoData structure (if any)
     * @param {GizmoData} gzd - The object to find the root for
     * @returns {GizmoData} - The root of the GizmoData chain (if any)
     */
    static root(gzd) {
        if (gzd && gzd instanceof GizmoData) {
            let node = gzd.$handle.constructor.root(gzd.$handle);
            if (node) return node.proxy;
        }
        return null;
    }

    /**
     * findinTrunk attempts to find a GizmoData node matching the given filter in the trunk (parent nodes) of the given GizmoData object.
     * @param {GizmoData} gzd - The object to start the search at.
     * @param {GizmoData~filter} filter - predicate filter function to apply to each node in the trunk to determine a match
     * @returns {GizmoData} - the first trunk node that matches the filter, otherwise null.
     */
    static findInTrunk(gzd, filter) {
        if (gzd && gzd instanceof GizmoData) {
            let node = gzd.$handle.constructor.findInTrunk(gzd.$handle);
            if (node) return node.proxy;
        }
        return null;
    }

    /**
     * findinPath attempts to find a GizmoData node matching the given filter in the trunk (parent nodes) of the given GizmoData object.
     * @param {GizmoData} gzd - The object to start the search at.
     * @param {GizmoData~filter} filter - predicate filter function to apply to each node in the trunk to determine a match
     * @returns {GizmoData} - the first trunk node that matches the filter, otherwise null.
     */
    static findInPath(gzd, filter) {
        if (filter(gzd)) return gzd;
        return this.findInTrunk(gzd);
    }

    static parser(o, spec, setter, hdl) {
        let cls = o.constructor;
        if (cls.$schema) {
            for (const sentry of cls.$schema.entries) {
                if (setter) {
                    setter(o, sentry.key, sentry.parser(o, spec));
                } else {
                    o[sentry.key] = sentry.parser(o, spec);
                }
            }
        }
    }

    constructor(spec={}) {
        let cls = this.constructor;
        this.constructor.init();
        let handle = new GizmoHandle(this);
        let proxy = new Proxy(this, handle);
        handle.proxy = proxy;
        cls.parser(this, spec, handle.cset.bind(handle), handle);
        handle.finalize();
        return proxy;
    }
    toString() {
        return Fmt.toString(this.constructor.name);
    }

    /**
     * atLink is a method called whenever a GizmoData object is linked to a trunk (parent) data object.  By default, no action is taken.
     * Override this method in a subclass to perform actions when the instance of the data object is linked.
     * @param {GizmoData} trunk - trunk data object that has been linked to the current object.
     */
    atLink(trunk) {
    }
    
    /**
     * atUnlink is a method called whenver a GizmoData object is unlinked from a trunk (parent) data object.  By default, no action is taken.
     * Override this method in a subclass to perform class specific logic when an object is unlinked.
     * @param {GizmoData} trunk - trunk data object that has been linked to the current object.
     */
    atUnlink(trunk) {
    }

}

class GizmoArrayHandle extends GizmoHandle {

    static attach(trunk, sentry, node) {
        console.log(`-- attaching to ${trunk.node}->${node}`);
        let handle = new GizmoArrayHandle(node);
        let proxy = new Proxy(node, handle);
        handle.link(trunk, sentry);
        handle.addWatcher(handle, (h,k,ov,nv) => {
            console.log(`link watcher triggered: k:${k} ov: ${ov} nv: ${nv}`);
            if (ov && ov instanceof GizmoData) ov.$handle.unlink();
            if (nv && nv instanceof GizmoData) nv.$handle.link(h, handle.esentry);
        });
        handle.finalize();
        // FIXME
        for (let i=0; i<node.length; i++) handle.cset(node, i, node[i]);
        return proxy;
    }

    constructor(node) {
        super(node);
        this.esentry = new SchemaEntry();
    }

    iget(target, key, receiver) {
        switch (key) {
            /*
            case 'destroy': 
                return () => {
                    destroy();
                }
            case 'clear': 
                return () => {
                    clear();
                }
                */
            case 'push':
                return (...v) => {
                    let i=target.length;
                    //let rv = target.push(...v);
                    for (const el of v) {
                        this.set(target, i++, v);
                        console.log(`want to link: ${i++} to ${el}`);
                    }
                    return target.length;
                }
            /*
            case 'unshift':
                return (...v) => {
                    let i=0;
                    let rv = obj.unshift(...v);
                    for (const el of v) link(i++, el);
                    return rv;
                }
            case 'pop': return () => {
                let idx = obj.length-1;
                let v = obj.pop();
                unlink(idx, v, (idx>=0));
                return v;
            }
            case 'shift': return () => {
                let idx = (obj.length) ? 0 : -1;
                let v = obj.shift();
                unlink(idx, v, (idx>=0));
                return v;
            }
            case 'splice': return (start, deleteCount=0, ...v) => {
                let i = start;
                let rv = obj.splice(start, deleteCount, ...v);
                for (const el of v) link(i++, el);
                for (let i=0; i<deleteCount; i++) unlink(start+i, obj[start+i], i==v.length);
                return rv;
            }
            */
        }
        return target[key];
    }

    cset(target, key, value) {
        console.log(`cset key: k:${key} v:${value}`)

        if (value && this.constructor.findInPath(this, (hdl) => hdl === value.$handle)) {
            console.error(`hierarchy loop detected ${value} already in path: ${this.node}`);
            return false;
        }
        target[key] = value;
        if (value) {
            if (Array.isArray(value)) {
                // FIXME
                // @@@
                let p = GizmoArrayHandle.attach(this, this.esentry, value);
                console.log(`p: ${p}`);
                target[key] = p;
            } else if (value instanceof GizmoData) {
                value.$handle.link(this, this.sentry);
            }
        }

            /*
            if (sentry.atUpdate) this.addWatcher(this, (h,k,ov,nv) => {
                if (k === key) sentry.atUpdate( (h.trunk) ? h.trunk.proxy : null, h.proxy, key, ov, nv );
            });
            if (sentry.link) this.addWatcher(this, (h,k,ov,nv) => {
                if (k !== key) return;
                if (ov && ov instanceof GizmoData) ov.$handle.unlink();
                if (nv && nv instanceof GizmoData) nv.$handle.link(h, sentry);
            });
            if (sentry.autogendeps.size) {
                this.addWatcher(this, (h,k,ov,nv) => {
                    if (k !== key) return;
                    for (const agk of sentry.autogendeps) {
                        if (agk in this.node) this.set(this.node, agk, '#autogen#');
                    }
                });
            }
        } else {
            target[key] = value;
        }
            */
        return true;
    }

    iset(target, key, value) {
        console.log(`set key: k:${key} v:${value} value is array: ${Array.isArray(value)}`);

        let storedValue = target[key];

        if (this.pathReadonly) {
            console.error(`can't set ${key} -- readonly`);
            return true;
        }

        if (Object.is(storedValue, value)) return true;

        // check for hierarchy loops
        if (value && this.constructor.findInPath(this, (hdl) => hdl === value.$handle)) {
            console.error(`hierarchy loop detected ${value} already in path: ${this.node}`);
            return false;
        }
        target[key] = value;
        if (this.watchers) {
            for (const watcher of this.watchers) watcher.watcher(this, key, storedValue, value);
        }

        return true;
    }

    link(trunk, sentry, keyer) {
        console.log(`garray wants link from: ${trunk.node}`);
        super.link(trunk, sentry, keyer);
    }

    /*
    linkUpdate() {
        super.linkUpdate();
    }
    */

    linkUpdate() {
        console.log(`garray wants linkUpdate path: ${this.pathEventable}`);
        for (let i=this.watchers.length-1; i>=0; i--) if (!this.constructor.findInPath(this.trunk, (h) => h===this.watchers[i].link)) this.watchers.splice(i, 1);
        // FIXME: add watchers
        let trunk = this.trunk;
        if (trunk) {
            //console.log(`linkUpdate: ${this.constructor.path(this)} schema.eventable: ${this.schema.eventable} trunk.pathEventable: ${trunk.pathEventable}`);
            this.pathEventable = this.sentry.eventable && trunk.pathEventable;
            this.pathUpdatable = this.sentry.atUpdate || trunk.pathUpdatable;
            this.pathAutogen = (this.sentry.autogendeps.size || trunk.pathAutogen);
            this.pathReadonly = this.sentry.readonly || trunk.pathReadonly;
            this.pathRenderable = this.sentry.renderable || trunk.pathRenderable;
            if (this.pathEventable) {
                let root = this.constructor.root(trunk);
                let path = this.constructor.path(this);
                this.addWatcher(root, (h,k,ov,nv) => {
                    console.log(`garray event watcher triggered for hdl:${h.node} ${k} ov: ${ov} nv: ${nv} nv type: ${typeof nv}`);
                    let renderable = this.pathRenderable;
                    EvtSystem.trigger(root.proxy, 'gizmo.set', { set: { [`${path}[${k}]`]: nv }, render: renderable });
                });
            }
            if (this.pathUpdatable) {
                for (const hdl of this.constructor.eachInPath(this, (h) => h.sentry && h.sentry.atUpdate)) {
                    this.addWatcher(hdl.trunk, (h,k,ov,nv) => hdl.sentry.atUpdate( hdl.trunk.proxy, h.proxy, k, ov, nv ));
                }
            }
            if (this.pathAutogen) {
                for (const hdl of this.constructor.eachInPath(this, (h) => (h.sentry && h.sentry.autogendeps.size))) {
                    this.addWatcher(hdl.trunk, (h,k,ov,nv) => {
                        for (const agk of hdl.sentry.autogendeps) {
                            if (agk in hdl.trunk.node) hdl.trunk.set(hdl.trunk.node, agk, '#autogen#');
                        }
                    });
                }
            }
        } else {
            this.pathEventable = EvtSystem.isEmitter(this.node);
            this.pathUpdatable = false;
            this.pathAutogen = false;
            this.pathReadonly = false;
            this.pathRenderable = false;
        }
        if (this.schema) {
            for (const sentry of this.schema.entries) {
                let att = this.node[sentry.key];
                if (att && att instanceof GizmoData) {
                    att.$handle.linkUpdate();
                }
            }
        }
    }

    /*
    link(idx, value, eventable=true) {
        if (value && value instanceof GizmoData) {
            value.$link(this.trunk, this.schema, () => {
                let i = this.array.indexOf(value);
                return `${this.schema.key}[${i}]`;
            });
        }
        if (eventable) {
            this.doautogen();
            if (this.schema.eventable && !GizmoData.findInTrunk(this.trunk, (v) => v.$schema && !v.$schema.eventable)) {
                // find event emitter in path
                let root = GizmoData.root(this.trunk);
                // emit
                if (EvtSystem.isEmitter(root)) {
                    let path = GizmoData.path(this.trunk);
                    let key = (path) ? `${path}.${this.schema.key}[${idx}]` : `${this.schema.key}[${idx}]`;
                    EvtSystem.trigger(root, 'gizmo.set', { 'set': { [key]: value }});
                }
            }
        }
    }

    unlink(idx, value, eventable=true) {
        if (value && value.$gdl) {
            value.$gdl.trunk = null;
            value.$gdl.schema = null;
            value.$gdl.keyFcn = null;
        }
        if (eventable) {
            this.doautogen();
            if (this.schema.eventable && !GizmoData.findInTrunk(this.trunk, (v) => v.$schema && !v.$schema.eventable)) {
                // find event emitter in path
                let root = GizmoData.root(this.trunk);
                // emit
                if (EvtSystem.isEmitter(root)) {
                    let path = GizmoData.path(this.trunk);
                    let key = (path) ? `${path}.${this.schema.key}[${idx}]` : `${this.schema.key}[${idx}]`;
                    EvtSystem.trigger(root, 'gizmo.set', { 'set': { [key]: null }});
                }
            }
        }
    }
    */

    /*
    doautogen() {
        for (const agk of this.schema.autogendeps) {
            if (agk in this.trunk) this.trunk[agk] = '#autogen#';
        }
        if (this.trunk.$pathAutogen) {
            for (const gzt of this.trunk.constructor.eachInPath(this.trunk, (gzn) => (gzn.$schema && gzn.$schema.autogendeps.size))) {
                for (const agk of gzt.$schema.autogendeps) {
                    if (agk in gzt.$trunk) gzt.$trunk[agk] = '#autogen#';
                }
            }
        }
    }

    destroy() {
        for (const v of this.array) if (v && v instanceof GizmoData) v.destroy();
    }

    clear() {
        for (const v of this.array) {
            this.unlink(-1, v, false);
        }
    }
    */

}
