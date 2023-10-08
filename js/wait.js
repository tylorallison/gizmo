
export { WaitAction };

import { Action } from './action.js';
import { Evts } from './evt.js';
import { Fmt } from './fmt.js';


class WaitAction extends Action {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('ttl', { parser: (o,x) => x.hasOwnProperty('ttl') ? x.ttl : o.constructor.dfltTTL });
    }

    // STATIC VARIABLES ----------------------------------------------------
    static dfltTTL = 500;

    // METHODS -------------------------------------------------------------
    doperform(ctx) {
        Evts.listen(null, 'GameTock', (evt) => {
            this.ttl -= evt.elapsed;
            if (this.ttl <= 0) this.finish(true);
        }, this);
    }

}
