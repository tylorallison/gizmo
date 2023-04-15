export { GizmoData };

import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';

class AttHandle {
    constructor(nhdl, sentry) {
        this.nhdl = nhdl;
        let key = sentry.key;
        this.readonly = sentry.readonly;
        this.key = key;
        this.getter = sentry.getter || ((t) => t[key]);
        this.modifier = sentry.setter;
        this.setter = (t,v) => t[key] = v,
        this.watchers = undefined;
        this.pwatchers = undefined;
        if (sentry.atUpdate) this.addWatcher((t,ov,nv) => {
            if (nhdl.finalized) sentry.atUpdate( (nhdl.trunk) ? nhdl.trunk.proxy : null, nhdl.proxy, key, ov, nv );
        });
        if (sentry.link) this.addWatcher((t,ov,nv) => {
            if (ov && ov instanceof GizmoData) ov.$handle.unlink();
            if (nv && nv instanceof GizmoData) nv.$handle.link(nhdl, sentry);
            if (nhdl.pathUpdatable) {
                for (const hdl of nhdl.constructor.eachInPath(nhdl.trunk, (ohdl) => (ohdl.sentry && ohdl.sentry.atUpdate))) {
                    hdl.sentry.atUpdate((hdl.trunk) ? hdl.trunk.proxy : null, nhdl.proxy, sentry.key, storedValue, value);
                }
            }
        });
        for (const agk of sentry.autogendeps) this.addWatcher((t,ov,nv) => nhdl.proxy[agk] = '#autogen');
    }
    addWatcher(watcher, pri=0) {
        if (!this.watchers) {
            this.watchers = [ watcher ];
            this.pwatchers = [ pri ];
        } else {
            let idx=0;
            for ( ; idx <= this.watchers.length && this.pwatchers[idx] <= pri; idx++ );
            this.watchers.splice(idx, 0, watcher);
            this.pwatchers.splice(idx, 0, pri);
        }
    }
    delWatcher(watcher) {
        let idx = this.watchers.indexOf(watcher);
        if (idx !== -1) {
            this.watchers.splice(idx, 1);
            this.pwatchers.splice(idx, 1);
        }
        if (!this.watchers.length) {
            this.watchers = null;
            this.pwatchers = null;
        }
    }
    get(target) {
        return this.getter(target);
    }
    set(target, value) {
        if (this.nhdl.finalized && (this.readonly || this.nhdl.pathReadonly)) return true;
        const ov = this.getter(target);
        if (this.modifier) value = this.modifier(target, value);
        this.setter(target, value);
        if (this.watchers) {
            for (const watcher of this.watchers) watcher(target, ov, value);
        }
        return true;
    }
}

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
        this.ahandles = {};
        this.trunk = null;
        this.proxy = null;
        this.sentry = null;
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

    linkUpdate() {
        let trunk = this.trunk;
        if (trunk) {
            //console.log(`linkUpdate: ${this.constructor.path(this)} schema.eventable: ${this.schema.eventable} trunk.pathEventable: ${trunk.pathEventable}`);
            this.pathEventable = this.sentry.eventable && trunk.pathEventable;
            this.pathUpdatable = !this.sentry.nopathgen && (this.sentry.atUpdate || trunk.pathUpdatable);
            this.pathAutogen = (this.sentry.autogendeps.size || trunk.pathAutogen);
            this.pathReadonly = this.sentry.readonly || trunk.pathReadonly;
            this.pathRenderable = this.sentry.renderable || trunk.pathRenderable;
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
        // FIXME: this doesn't look right
        if (this.constructor.findInPath(trunk.proxy, (gzd) => gzd === this.proxy)) {
            console.error(`hierarchy loop detected ${this.node} already in trunk: ${trunk}`);
            return;
        }
        // set link
        this.trunk = trunk;
        this.sentry = sentry;
        if (keyer) this.keyer = keyer;
        // update getter/setter for handle
        //this.get = this.iget;
        //this.set = this.iset;
        // update path variables for this node and all dependent branch nodes
        this.linkUpdate()
        this.node.atLink(trunk.proxy);
        // regenerate updates to autogenerated fields
        if (this.schema) {
            for (const agk of this.schema.trunkGenDeps) {
                if (agk in this.node) this.proxy[agk] = '#autogen#';
            }
        }
        if (this.pathAutogen) {
            for (const hdl of this.constructor.eachInPath(this, (ohdl) => (ohdl.sentry && ohdl.sentry.autogendeps.size))) {
                for (const agk of hdl.sentry.autogendeps) {
                    if (agk in hdl.node) hdl.proxy[agk] = '#autogen#';
                }
            }
        }
    }

    unlink() {
        let trunk = this.trunk;
        this.trunk = null;
        this.sentry = null;
        this.keyer = null;
        this.linkUpdate()
        this.node.atUnlink(trunk);

        // regenerate updates to autogenerated fields
        if (this.schema) {
            for (const agk of this.schema.trunkGenDeps) {
                if (agk in this.node) this.proxy[agk] = '#autogen#';
            }
        }

    }

    hget(target, key, receiver) {
        const value = target[key];
        if (key === '$handle') return this;
        if (key === '$target') return target;
        if (value instanceof Function) {
            return function (...args) {
                return value.apply(this === receiver ? target : this, args);
            };
        }
        let hdl = this.ahandles[key];
        if (hdl) return hdl.get(target);
        return value;
    }

    hset(target, key, value) {
        let hdl = this.ahandles[key];
        if (hdl) return hdl.set(target, value, !this.finalized);
        target[key] = value;
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
    iset(target, key, value, force=false) {
        let storedValue = target[key];
        let sentry = (this.schema) ? this.schema.map[key] : null;
        if (sentry) {
            if (this.finalized && (sentry.readonly || this.pathReadonly)) {
                console.error(`can't set ${key} -- readonly ${sentry.readonly} pathRO: ${this.pathReadonly}`);
                return true;
            }
            if (sentry.setter) {
                value = sentry.setter(target, value);
            }
        }
        if (Object.is(storedValue, value)) return true;
        if (sentry) {
            if (sentry.link) {
                if (storedValue) storedValue.$handle.unlink();
                target[key] = value;
                if (value) value.$handle.link(this, sentry);
            } else {
                target[key] = value;
            }

            if (sentry.atUpdate) sentry.atUpdate((this.trunk) ? this.trunk.proxy : null, this.proxy, sentry.key, storedValue, value);

            // -- path updates are controlled by GizmoData.$pathUpdatable
            if (this.pathUpdatable) {
                for (const hdl of this.constructor.eachInPath(this, (ohdl) => (ohdl.sentry && ohdl.sentry.atUpdate))) {
                    hdl.sentry.atUpdate((hdl.trunk) ? hdl.trunk.proxy : null, this.proxy, sentry.key, storedValue, value);
                }
            }

            // handle updates to autogenerated fields associated with this data node
            for (const agk of sentry.autogendeps) {
                if (agk in this.node) this.proxy[agk] = '#autogen#';
            }
            //  autogen updates for linked trunk nodes are controlled by GizmoData.$pathAutogen
            if (this.pathAutogen) {
                for (const hdl of this.constructor.eachInPath(this, (ohdl) => (ohdl.sentry && ohdl.sentry.autogendeps.size))) {
                    for (const agk of hdl.sentry.autogendeps) {
                        if (agk in hdl.node) hdl.proxy[agk] = '#autogen#';
                    }
                }
            }

            // trigger update if attribute is eventable
            //console.log(`iset: ${this.constructor.path(this)} schema: ${schema.key} eventable: ${schema.eventable} path: ${this.pathEventable}`);
            if (sentry.eventable && this.pathEventable) {
                // find event emitter in path
                let root = target.constructor.root(this.proxy);
                // emit
                if (EvtSystem.isEmitter(root)) {
                    let path = this.constructor.path(this);
                    let key = (path) ? `${path}.${sentry.key}` : sentry.key;
                    let renderable = sentry.renderable || this.pathRenderable;
                    EvtSystem.trigger(root, 'gizmo.set', { set: { [key]: value }, render: renderable });
                }
            }
        } else {
            target[key] = value;
        }

        return true;
    };
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
                //if (hdl) hdl.ahandles[sentry.key] = new AttHandle(hdl, sentry);
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
        cls.parser(this, spec, handle.set.bind(handle), handle);
        handle.finalized = true;
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