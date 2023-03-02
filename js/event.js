export { ExtEvtEmitter, ExtEvtReceiver, EvtLink, EvtSystem, Evt };

import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';
import { Schema } from './schema.js';

/**
 * EvtHandler defines an specification argument for the GizmoData constructor that can be passed to a {@link Generator} instance.
 * The properties defined here are the minimum required for the generator to identify the class properly.  The schema defined
 * for each GizmoData class defines other properties for that class and how they are parsed from the GizmoSpec.
 * @typedef {Object} GizmoSpec
 * @property {boolean} $gzx=true - Indicates this is a GizmoData specification 
 * @property {string} cls - Name of class associated with specification
 */

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

/**
 * EvtSystem defines static methods for handling of events.
 */
class EvtSystem {

    /**
     * An event handler is registered as an event listener and executed whenever a matching event has been triggered.
     * @callback EvtSystem~handler
     * @param {Evt} evt - Event data that has been triggered
     */

    /**
     * An event filter is used to determine if a given event matches and is used for event predicate functions.
     * @callback EvtSystem~filter
     * @param {Evt} evt - Event to be evaluated
     * @returns {boolean} - indicates if given event matches
     */

    static isEmitter(obj) {
        return obj.hasOwnProperty('evtEmitterLinks') && obj.hasOwnProperty('evtCounts');
    }
    static isReceiver(obj) {
        return obj.hasOwnProperty('evtReceiverLinks');
    }

    static addCount(emitter, tag) {
        if (emitter.evtCounts.has(tag)) {
            emitter.evtCounts.set(tag, emitter.evtCounts.get(tag)+1);
        } else {
            emitter.evtCounts.set(tag, 1);
        }
    }

    static getCount(emitter, tag) {
        if (emitter.evtCounts.has(tag)) {
            return emitter.evtCounts.get(tag);
        }
        return 0;
    }

    static addEmitterLink(emitter, link) {
        if (emitter.evtEmitterLinks.has(link.tag)) {
            emitter.evtEmitterLinks.get(link.tag).push(link);
        } else {
            emitter.evtEmitterLinks.set(link.tag, [ link ]);
        }
    }

    static delEmitterLink(emitter, link) {
        let links = emitter.evtEmitterLinks.get(link.tag);
        if (links) {
            let idx = links.indexOf(link);
            if (idx !== -1) {
                links.splice(idx, 1);
            }
            if (!links.length) emitter.evtEmitterLinks.delete(link.tag);
        }
    }

    static addReceiverLink(receiver, link) {
        receiver.evtReceiverLinks.push(link);
    }
    static delReceiverLink(receiver, link) {
        let idx = receiver.evtReceiverLinks.indexOf(link);
        if (idx !== -1) {
            receiver.evtReceiverLinks.splice(idx, 1);
        }
    }
    static clearEmitterLinks(emitter) {
        emitter.evtEmitterLinks.clear();
        for (const linksForTag of Array.from(emitter.evtEmitterLinks.values())) {
            for (const link of linksForTag) {
                console.log(`clear receiver link for ${Fmt.ofmt(link)}`);
                if (link.emitter === emitter) this.delReceiverLink(link.receiver, link);
            }
        }
    }
    static clearReceiverLinks(receiver) {
        let links = Array.from(receiver.evtReceiverLinks);
        receiver.evtReceiverLinks.splice(0);
        for (const link of links) {
            if (link.emitter) this.delEmitterLink(link.emitter, link);
        }
    }

    static findLinksForEvt(obj, evt, links=[]) {
        if (!obj || !evt) return;
        if (obj.evtEmitterLinks.has(evt.tag)) {
            links.push(...obj.evtEmitterLinks.get(evt.tag));
        }
        return links;
    }

    static trigger(emitter, tag, atts) {
        // build event
        let evt = new Evt(tag, Object.assign({ actor: emitter }, atts));
        // update event counts
        this.addCount(emitter, tag);
        // get listeners for event
        let links = [];
        // -- emitter listeners
        this.findLinksForEvt(emitter, evt, links);
        // -- global listeners
        this.findLinksForEvt(emitter.gctx, evt, links);
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
    }

    static listen(emitter, receiver, tag, fcn, opts={}) {
        let link = new EvtLink(tag, emitter, receiver, fcn, opts);
        this.addEmitterLink(emitter, link)
        this.addReceiverLink(receiver, link)
    }

    static ignore(emitter, receiver, tag, fcn) {
        let evt = new Evt(tag, Object.assign({ actor: emitter }));
        let links = [];
        this.findLinksForEvt(emitter, evt, links);
        if (!links.length) return;
        for (const link of links) {
            if (link.receiver === receiver && (!fcn || fcn === link.fcn)) {
                this.delEmitterLink(emitter, link);
                this.delReceiverLink(receiver, link);
            }
        }
    }
}


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
        return Fmt.ofmt(this, this.constructor.name);
    }
}

/**
 * ExtEvtEmitter acts as an mixin for other classes and defines schema attributes appropriate for an event emitter.
 * @mixin
 */
class ExtEvtEmitter {

    /** @member {Map} ExtEvtEmitter#evtCounts - a map of event to integer count of event triggers for that event */
    /** @member {Map} ExtEvtEmitter#evtEmitterLinks - a map of event to emitter links for that event */
    static apply(cls, spec={}) {
        // data
        Schema.apply(cls, 'evtCounts', { eventable: false, serializable: false, parser: () =>  new Map() });
        Schema.apply(cls, 'evtEmitterLinks', { eventable: false, serializable: false, parser: () => new Map() });
    }

    static gen(spec={}) {
        let cls = class {
            static schema = {};
            constructor() {
                for (const [key, schema] of Object.entries(this.constructor.schema)) GizmoData.applySchema(schema, this, spec);
            }
        }
        this.apply(cls);
        return new cls();
    }

}

class ExtEvtReceiver {

    static apply(cls, spec={}) {
        // -- data
        Schema.apply(cls, 'evtReceiverLinks', { eventable: false, serializable: false, parser: () => [] });
    }

    static gen(spec={}) {
        let cls = class {
            static schema = {};
            constructor() {
                for (const [key, schema] of Object.entries(this.constructor.schema)) GizmoData.applySchema(schema, this, spec);
            }
        }
        this.apply(cls);
        return new cls();
    }

}

