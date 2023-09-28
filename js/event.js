export { EvtLink, Evt };

import { Fmt } from './fmt.js';

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