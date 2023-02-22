
export { WaitAction };

import { Schema } from "./schema.js";
import { Timer } from "./timer.js";
import { Action } from "./action.js";

class WaitAction extends Action {

    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'ttl', { parser: (o,x) => x.hasOwnProperty('ttl') ? x.ttl : o.constructor.dfltTTL });
        Schema.apply(this, 'timer', { link: true });
    }

    // STATIC VARIABLES ----------------------------------------------------
    static dfltTTL = 500;

    // CONSTRUCTOR ---------------------------------------------------------
    cpre(spec) {
        super.cpre(spec);
        this.onTimer = this.onTimer.bind(this);
    }
    /*
    constructor(spec={}) {
        super(spec);
        this.ttl = spec.ttl || this.constructor.dfltTTL;
    }
    destroy() {
        super.destroy();
        if (this.timer) this.timer.destroy();
    }
    */

    // EVENT HANDLERS ------------------------------------------------------
    onTimer(evt) {
        if (this.dbg) console.log(`${this} is done`);
        this.finish();
    }

    // METHODS -------------------------------------------------------------
    async prepare(ctx) {
        console.log(`wait prepare`);
        if (this.dbg) console.log(`starting ${this} action w ttl: ${this.ttl}`);
        let p = new Promise( resolve => {
            console.log(`inside promise gctx: ${this.gctx} ttl: ${this.ttl}`);
            this.timer = new Timer({gctx: this.gctx, ttl: this.ttl, cb: () => {
                console.log(`finished timer, calling resolve`);
                resolve();
            }});
        });
        return p;
        //this.timer = new Timer({ttl: this.ttl, cb: this.onTimer});
    }

}