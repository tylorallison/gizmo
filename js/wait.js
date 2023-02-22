
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

    // METHODS -------------------------------------------------------------
    async prepare(ctx) {
        if (this.dbg) console.log(`starting ${this} action w ttl: ${this.ttl}`);
        let p = new Promise( resolve => {
            this.resolver = resolve;
            this.timer = new Timer({gctx: this.gctx, ttl: this.ttl, cb: () => {
                this.resolver(this.ok);
            }});
        });
        return p;
    }

}