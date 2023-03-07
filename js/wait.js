
export { WaitAction };

import { Schema } from './schema.js';
import { Action } from './action.js';
import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';


class WaitAction extends Action {

    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'ttl', { parser: (o,x) => x.hasOwnProperty('ttl') ? x.ttl : o.constructor.dfltTTL });
    }

    // STATIC VARIABLES ----------------------------------------------------
    static dfltTTL = 500;

    // METHODS -------------------------------------------------------------
    async prepare(ctx) {
        if (this.dbg) console.log(`starting ${this} action w ttl: ${this.ttl}`);
        let p = new Promise( resolve => {
            this.resolver = resolve;
            EvtSystem.listen(this.gctx, this, 'game.tock', (evt) => {
                this.ttl -= evt.deltaTime;
                if (this.ttl <= 0) this.resolver(this.ok);
            });
        });
        return p;
    }

}