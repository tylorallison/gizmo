export { GizmoDataW, GizmoArray };

import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';

class GizmoDataLink {

    static *eachInPath(link, filter) {
        //console.log(`xx eachInPath(${link})`);
        for (; link; link=link.trunk) {
            //console.log(`  xx eachInPath(${link.node})`);
            if (filter(link.node)) yield link.node;
        }
    }

    static findInPath(link, filter) {
        //console.log(`xx findInPath(${link})`);
        for (; link; link=link.trunk) {
            //console.log(` . xx findInPath(${link})`);
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
                    link.addWatcher(tlink.trunk.node, (n,k,ov,nv) => { for (const agk of tlink.sentry.autogendeps) GizmoDataW.set(tlink.trunk.node, agk, '#autogen#'); });
                }
                //console.log(`-- link ${tlink} node: ${tlink.node} eventable: ${tlink.sentry && tlink.sentry.eventable}`);
                //console.log(`-- tlink.trunk ${tlink.trunk} eventable: ${eventable} emitter: ${EvtSystem.isEmitterCls(tlink.node.constructor)}`);
                if (tlink.sentry) eventable &= tlink.sentry.eventable;
                if (!tlink.trunk && eventable && EvtSystem.isEmitterCls(tlink.node.constructor)) {
                    let path = this.path(link);
                    //console.log(`path: ${path}`);
                    link.addWatcher(tlink.node, (n,k,ov,nv) => {
                        let sentry = (n.constructor.$schema) ? n.constructor.$schema.map[k] : null;
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

    toString() {
        return Fmt.toString(this.constructor.name, 
            this.node, 
            (this.trunk) ? this.trunk.node : null, 
            (this.leafs) ? this.leafs.map((v) => v.node.toString()).join(',') : null);
    }

}

class GizmoDataW {

    static get(target, key) {
        if (!target) return undefined;
        const sentry = (target.constructor.$schema) ? target.constructor.$schema.map[key] : null;
        if (sentry && sentry.getter) return sentry.getter(target);
        return target[key];
    }

    static cset(target, key, value) {
        if (!target) return false;
        const sentry = (target.constructor.$schema) ? target.constructor.$schema.map[key] : null;
        if (sentry.getter) return false;
        if (sentry && sentry.generator) value = sentry.generator(target, value);
        //console.log(`== cset ${target} ${key}=>${value}`);
        if (typeof value === 'object') {
            //console.log(`cset linking ${target}.${key} to ${value}`);
            GizmoDataLink.link(target, key, sentry, value);
        }
        target[key] = value;
    }

    static set(target, key, value) {
        //console.log(`set: ${target} ${key}=>${value}`);
        if (!target) return false;
        const sentry = (target.constructor.$schema) ? target.constructor.$schema.map[key] : null;
        if (sentry && sentry.getter) return false;
        const storedValue = target[key];
        if (sentry && sentry.generator) value = sentry.generator(target, value);
        if (Object.is(storedValue, value)) return true;
        //console.log(`storedValue: ${storedValue} typeof ${typeof storedValue}`);
        if (storedValue && typeof storedValue === 'object') GizmoDataLink.unlink(target, storedValue);
        //console.log(`== set ${target} ${key}=>${value}`);
        if (value && typeof value === 'object') GizmoDataLink.link(target, key, sentry, value);
        target[key] = value;
        if (sentry) {
            if (sentry.atUpdate) sentry.atUpdate( target, target, key, storedValue, value );
            for (const agk of sentry.autogendeps) this.set(target, agk, '#autogen#');
        }
        //console.log(`target: ${target} key: ${key}`);
        const watchers = (target.$link) ? target.$link.watchers : null;
        if (watchers) {
            for (const watcher of watchers) {
                //console.log(`trigger watcher for node: ${watcher.node}`);
                watcher.watcher(target, key, storedValue, value);
            }
        }
        if (!target.$link || !target.$link.trunk) {
            if (EvtSystem.isEmitter(target) && (!sentry || sentry.eventable)) {
                EvtSystem.trigger(target, 'gizmo.set', { 'set': { [key]: value }});
            }
        }
    }

    static registry = new Map();
    static init() {
        if (!this.registry.has(this.name)) this.registry.set(this.name, this);
    }

    static parser(o, spec, setter) {
        const cls = o.constructor;
        if (cls.$schema) {
            for (const sentry of cls.$schema.entries) {
                if (setter) {
                    setter(o, sentry.key, sentry.parser(o, spec));
                } else {
                    this.cset(o, sentry.key, sentry.parser(o, spec));
                }
            }
        }
    }

    constructor(spec={}) {
        this.constructor.init();
        this.constructor.parser(this, spec);
    }

    toString() {
        return Fmt.toString(this.constructor.name);
    }

}

class GizmoArray {

    /*
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
    */

    constructor() {
        let array = Array.from(arguments);
        //super(node);
        //this.esentry = new SchemaEntry();
        let proxy = new Proxy(array, {
            get(target, key, receiver) {
                if (target.$link) {
                    switch (key) {
                        case 'push':
                            return (...v) => {
                                let i=target.length;
                                console.log(`target: ${target} target.length: ${target.length}`);
                                for (const el of v) {
                                    GizmoDataW.set(target, i++, el);
                                }
                                return target.length;
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
            set(target, key, value) {
                target[key] = value;
                return true;
            }
        });
        return proxy;
    }
}

    /*
    get(target, key, receiver) {
        switch (key) {
            */

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
            /*
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
                */
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
        /*
        }
        return target[key];
    }
}
*/