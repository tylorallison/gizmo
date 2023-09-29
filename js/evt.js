export { Evt, EvtLink, EvtCtx, Evts };

import { Fmt } from './fmt.js';
import { GizmoCtx } from './gizmoCtx.js';

/** ========================================================================
 * represents an instance of an event that is triggered, along w/ associated event data
 */
class Evt {
    // CONSTRUCTOR ---------------------------------------------------------
    constructor(tag, atts={}) {
        this.tag = tag;
        Object.assign(this, atts);
    }

    // METHODS -------------------------------------------------------------
    toString() {
        return Fmt.toString(this.constructor.name, Fmt.ofmt(this));
    }
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

class EvtCtx extends GizmoCtx {

    constructor(spec={}) {
        super(spec);
        // linksByTag looks like this:
        // {
        //    <event.tag>:0 [ <EvtLink>, ... ],
        //    <event.tag>:<emitter.gid>: [ <EvtLink>, ... ],
        // }
        this.linksByTag = new Map();
        // linksByGid looks like this:
        // {
        //     0: [ <EvtLink>, ... ]
        //     <receiver.gid>: [ <EvtLink>, ... ]
        // }
        this.linksByGid = new Map();
    }

    trigger(emitter, tag, atts) {
        // build event
        let evt = new Evt(tag, Object.assign({ actor: emitter }, atts));
        // -- listeners
        let links = this.findLinksForEvt(emitter, evt.tag);
        if (links.length) {
            // sort listeners
            links.sort((a,b) => a.priority-b.priority);
            // delete any listener from emitter if marked w/ once attribute
            for (const link of links.filter((v) => v.once && (!v.filter || v.filter(evt)))) {
                this.delLink(link);
            }
            // trigger callback for each listener
            for (const link of links) {
                if (link.filter && !link.filter(evt)) continue;
                link.fcn(evt);
            }
        }
        // emitter dispatch
        if (emitter) {
            let handlerTag = 'on' + tag;
            if ((handlerTag in emitter) && (typeof emitter[handlerTag]) === 'function') {
                emitter[handlerTag](evt);
            }
        }
        // special case -- gizmo.destroy
        if (emitter && (tag === 'gizmo.destroyed')) {
            this.clearFor(emitter);
        }
    }

    findLinksForEvt(emitter, tag) {
        let links = [];
        let eid = (emitter) ? emitter.gid : 0;
        let key = `${tag}:0`;
        if (this.linksByTag.has(key)) links.push(...this.linksByTag.get(key));
        if (eid !== 0) {
            key = `${tag}:${eid}`;
            if (this.linksByTag.has(key)) links.push(...this.linksByTag.get(key));
        }
        return links;
    }

    delLink(link) {
        // tag links
        let key = `${link.tag}:${link.emitter}`;
        let links = this.linksByTag.get(key);
        if (links) {
            let idx = links.indexOf(link);
            links.splice(idx, 1);
            if (!links.length) this.linksByTag.delete(key);
        }
        // emitter link
        links = this.linksByGid.get(link.emitter);
        if (links) {
            let idx = links.indexOf(link);
            links.splice(idx, 1);
            if (!links.length) this.linksByGid.delete(link.emitter);
        }
        // receiver link
        links = this.linksByGid.get(link.receiver);
        if (links) {
            let idx = links.indexOf(link);
            links.splice(idx, 1);
            if (!links.length) this.linksByGid.delete(link.receiver);
        }
    }

    clearFor(actor) {
        let links = this.linksByGid.get(actor.gid);
        if (links) {
            for (const link of links) {
                let key = `${link.tag}:${link.emitter}`;
                this.linksByTag.delete(key);
            }
        }
        this.linksByGid.delete(actor.gid);
    }

    listen(emitter, tag, fcn, receiver, opts={}) {
        let eid = (emitter) ? emitter.gid : 0;
        let rid = (receiver) ? receiver.gid : 0;
        let link = new EvtLink(tag, eid, rid, fcn, opts);
        let key = `${tag}:${eid}`;
        if (this.linksByTag.has(key)) {
            this.linksByTag.get(key).push(link);
        } else {
            this.linksByTag.set(key, [ link ]);
        }
        // link emitter
        if (this.linksByGid.has(eid)) {
            this.linksByGid.get(eid).push(link);
        } else {
            this.linksByGid.set(eid, [ link ]);
        }
        // link receiver
        if (eid !== rid) {
            if (this.linksByGid.has(rid)) {
                this.linksByGid.get(rid).push(link);
            } else {
                this.linksByGid.set(rid, [ link ]);
            }
        }
    }

    ignore(emitter, tag, fcn, receiver) {
        let eid = (emitter) ? emitter.gid : 0;
        let rid = (receiver) ? receiver.gid : 0;
        // remove tag links
        let key = `${tag}:${eid}`;
        let links = this.linksByTag.get(key);
        if (links) {
            for (let i=links.length-1; i>=0; i--) {
                let link = links[i];
                if (link.receiver !== rid) continue;
                if (fcn && (link.fcn !== fcn)) continue;
                links.splice(i, 1);
            }
            if (!links.length) this.linksByTag.delete(key);
        }
        // emitter link
        links = this.linksByGid.get(eid);
        if (links) {
            for (let i=links.length-1; i>=0; i--) {
                let link = links[i];
                if (link.receiver !== rid) continue;
                if (fcn && (link.fcn !== fcn)) continue;
                links.splice(i, 1);
            }
            if (!links.length) this.linksByGid.delete(eid);
        }
        // receiver link
        links = this.linksByGid.get(rid);
        if (links) {
            for (let i=links.length-1; i>=0; i--) {
                let link = links[i];
                if (link.emitter !== eid) continue;
                if (fcn && (link.fcn !== fcn)) continue;
                links.splice(i, 1);
            }
            if (!links.length) this.linksByGid.delete(rid);
        }
    }

    clear() {
        this.linksByTag.clear();
        this.linksByGid.clear();
    }

}

const Evts = new EvtCtx();