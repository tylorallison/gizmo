export { GizmoDataW, GizmoArray, GizmoObject };

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

    destroy() {
        if (this.trunk) {
            this.constructor.unlink(this.trunk.node, this.node);
        }
        if (this.leafs) {
            let leafs = this.leafs;
            this.leafs = null;
            for (const llink of leafs) {
                this.constructor.unlink(this.node, llink.node);
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

    static wrap(array) {
        const proxy = new Proxy(array, {
            get(target, key, receiver) {
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
                                    GizmoDataW.set(target, i++, el);
                                }
                                return target.length;
                            }
                        case 'unshift':
                            return (...v) => {
                                let i=0;
                                for (const el of v) {
                                    target.splice(i, 0, undefined);
                                    GizmoDataW.set(target, i++, el);
                                }
                                return target.length;
                            }
                        case 'pop': return () => {
                            let idx = target.length-1;
                            if (idx < 0) return undefined;
                            const v = target[idx];
                            GizmoDataW.set(target, idx, undefined);
                            target.pop();
                            return v;
                        }
                        case 'shift': return () => {
                            if (target.length < 0) return undefined;
                            const v = target[0];
                            GizmoDataW.set(target, 0, undefined);
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
                                    GizmoDataW.set(target, tidx++, avs[aidx++]);
                                } else {
                                    GizmoDataW.set(target, tidx, undefined);
                                    target.splice(tidx++, 1);
                                }
                            }
                            // splice in any remainder of items to add
                            for ( ; aidx<avs.length; aidx++ ) {
                                target.splice(tidx, 0, undefined);
                                GizmoDataW.set(target, tidx++, avs[aidx]);
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
            set(target, key, value) {
                GizmoDataW.set(target, key, value);
                return true;
            },
            deleteProperty(target, key) {
                if (key in target) {
                    GizmoDataW.set(target, key, undefined);
                    delete target[key];
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

}

class GizmoObject {

    static wrap(array) {
        const proxy = new Proxy(array, {
            get(target, key, receiver) {
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
                if (value instanceof Function) {
                    return function (...args) {
                        return value.apply(this === receiver ? target : this, args);
                    };
                }
                return value;
            },
            set(target, key, value) {
                GizmoDataW.set(target, key, value);
                return true;
            },
            deleteProperty(target, key) {
                if (key in target) {
                    GizmoDataW.set(target, key, undefined);
                    delete target[key];
                }
                return true;
            }
        });
        return proxy;
    }

    constructor(obj) {
        if (!obj) obj = {};
        return this.constructor.wrap(obj);
    }
}