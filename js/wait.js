
export { WaitAction };

import { Action } from './action.js';
import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';


class WaitAction extends Action {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema(this, 'ttl', { parser: (o,x) => x.hasOwnProperty('ttl') ? x.ttl : o.constructor.dfltTTL });
    }

    // STATIC VARIABLES ----------------------------------------------------
    static dfltTTL = 500;

    // METHODS -------------------------------------------------------------
    doperform(ctx) {
        EvtSystem.listen(this.gctx, this, 'game.tock', (evt) => {
            this.ttl -= evt.deltaTime;
            if (this.ttl <= 0) this.finish(this.ok);
        });
    }

}