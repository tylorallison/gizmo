export { EventContext };
import { Evt } from './event.js';
import { Fmt } from './fmt.js';


class GizmoContext {
    static _instance;
    static $stack = [];
    static get instance() {
        if (!this._instance) this._instance = new GizmoContext();
        return this._instance;
    }

    static advance(which, xctx) {
    }

    static withdraw(which) {
    }

    constructor(spec={}) {
        this.assets = spec.assets;
        this.events = spec.events;
        this.cfg = spec.cfg;
    }

    advance() {
    }

    withdraw() {
    }

    suspend() {
    }

    resume() {
    }

    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }
}

class AssetContext {
}

class EvtLink {
    constructor(tag, emitter, receiver, fcn, opts={}) {
        this.tag = tag;
        this.emitter = emitter;
        this.receiver = receiver;
        this.fcn = fcn;
        this.priority = opts.priority || 0;
        this.once = opts.hasOwnProperty('once') ? opts.once : false;
        this.filter = opts.filter;
    }
    toString() {
        return Fmt.toString(this.constructor.name, this.emitter, this.receiver);
    }
}

class EventContext {
    static trigger(emitter, tag, atts) {
    }
    static listen(emitter, receiver, tag, fcn, opts={}) {
    }
    static ignore(emitter, receiver, tag, fcn) {
    }

    constructor(spec={}) {
        // linksByTag looks like this:
        // {
        //    <event.tag>: [ <EvtLink>, ... ],
        //    <event.tag>:<emitter.gid>: [ <EvtLink>, ... ],
        // }
        this.linksByTag = new Map();
        // linksByGid looks like this:
        // {
        //     <receiver.gid>: [ <EvtLink>, ... ]
        // }
        this.linksByGid = new Map();
    }

    trigger(emitter, tag, atts) {
        // special case -- gizmo.destroy
        // build event
        let evt = new Evt(tag, Object.assign({ actor: emitter }, atts));
        // -- listeners
        let links = this.findLinksForEvt(emitter, evt);
        if (!links.length) return;
        // sort listeners
        links.sort((a,b) => a.priority-b.priority);
        // delete any listener from emitter if marked w/ once attribute
        for (const link of links.filter((v) => v.once && (!v.filter || v.filter(evt)))) {
            this.delEmitterLink(emitter, link);
            this.delReceiverLink(link.receiver, link);
        }
        // trigger callback for each listener
        for (const link of links) {
            if (link.filter && !link.filter(evt)) continue;
            link.fcn(evt);
        }
        if (tag === 'gizmo.destroyed') {
            this.linksByGid.delete(emitter.gid);
        }
    }

    findLinksForEvt(emitter, tag) {
        let links = [];
        if (this.links.has(tag)) {
            if (this.linksByTag.has(tag)) links.push(...this.linksByTag.get(tag));
            let key = `${tag}:${emitter.gid}`;
            if (this.linksByTag.has(key)) links.push(...this.linksByTag.get(key));
        }
        return links;
    }

    delLink(link) {
        // emitter link
        let key = (link.emitter) ? `${link.tag}:${link.emitter.gid}` : link.tag;
        let links = this.linksByTag.get(key);
        if (links) {
            let idx = links.indexOf(link);
            links.splice(idx, 1);
            if (!links.length) this.linksByTag.delete(key);
        }

        // receiver link
        links = this.linksByGid.get(link.receiver.gid);
        if (links) {
            let idx = links.indexOf(link);
            links.splice(idx, 1);
            if (!links.length) this.linksByGid.delete(link.receiver.gid);
        }
    }

    listen(emitter, receiver, tag, fcn, opts={}) {
        let link = new EvtLink(tag, emitter, receiver, fcn, opts);
        let key = (emitter) ? `${tag}:${emitter.gid}` : tag;
        if (this.linksByTag.has(key)) {
            this.linksByTag.get(key).push(link);
        } else {
            this.linksByTag.set(key, [ link ]);
        }
        if (emitter) {
            if (this.linksByGid.has(emitter.gid)) {
                this.linksByGid.get(receiver.gid).push(link);
            } else {
                this.linksByGid.set(receiver.gid, [ link ]);
            }
        }
        if (this.linksByGid.has(receiver.gid)) {
            this.linksByGid.get(receiver.gid).push(link);
        } else {
            this.linksByGid.set(receiver.gid, [ link ]);
        }
    }

    ignore(emitter, receiver, tag, fcn) {
    }
}

class ConfigContext {
    static get(key) {
    }
}

class GameContext {
}

class Test {
    static xAssetCtx = {
    }

    static xCfgCtx = {
        'test.dbg': true,
    }

}