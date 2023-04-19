export { GizmoDataW };

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

    static link(trunk, sentry, target) {
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
        let trunkUpdater = false;
        if (trunk) {
            for (const tnode of this.eachInPath(trunk.$link, () => true)) {
                let tlink = tnode.$link;
                if (tlink.sentry && tlink.sentry.atUpdate) {
                    trunkUpdater = true;
                    //console.log(`-- add watcher ${tlink.trunk.node} on ${link.node}`);
                    link.addWatcher(tlink.trunk.node, (h,k,ov,nv) => tlink.sentry.atUpdate( tlink.trunk.node, h, k, ov, nv ));
                }
            }
        }

        if (link.leafs && trunkUpdater) {
            for (const llink of link.leafs) {
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
        if (typeof value === 'object') GizmoDataLink.link(target, sentry, value);
        target[key] = value;
    }

    static set(target, key, value) {
        //console.log(`set: ${target} ${key}=>${value}`);
        if (!target) return false;
        const sentry = (target.constructor.$schema) ? target.constructor.$schema.map[key] : null;
        if (sentry.getter) return false;
        const storedValue = target[key];
        if (sentry && sentry.generator) value = sentry.generator(target, value);
        if (Object.is(storedValue, value)) return true;
        //console.log(`storedValue: ${storedValue} typeof ${typeof storedValue}`);
        if (storedValue && typeof storedValue === 'object') GizmoDataLink.unlink(target, storedValue);
        if (value && typeof value === 'object') GizmoDataLink.link(target, sentry, value);
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