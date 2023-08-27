//export { GizmoCtx, ConfigCtx };
import { Evt, EvtLink } from './event.js';
import { Fmt } from './fmt.js';



class AssetContext {
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
        // build event
        let evt = new Evt(tag, Object.assign({ actor: emitter }, atts));
        // -- listeners
        let links = this.findLinksForEvt(emitter, evt);
        if (!links.length) return;
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
        // special case -- gizmo.destroy
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

    delFor(actor) {
        let links = this.linksByGid.get(actor.gid);
        if (links) {
            for (const link of links) {
                let key = (link.emitter) ? `${link.tag}:${link.emitter.gid}` : link.tag;
                let elinks = this.linksByTag.get(key);
                if (elinks) {
                    let idx = elinks.indexOf(link);
                    links.splice(idx, 1);
                    if (!elinks.length) this.linksByTag.delete(key);
                }
            }
        }
        this.linksByGid.delete(actor.gid);
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
        if (emitter !== receiver) {
            if (this.linksByGid.has(receiver.gid)) {
                this.linksByGid.get(receiver.gid).push(link);
            } else {
                this.linksByGid.set(receiver.gid, [ link ]);
            }
        }
    }

    ignore(emitter, receiver, tag, fcn) {
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