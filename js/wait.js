
export { WaitAction };

import { Action } from './action.js';
import { Evts } from './evt.js';
import { Fmt } from './fmt.js';


class WaitAction extends Action {

    // SCHEMA --------------------------------------------------------------
    static { this.schema('ttl', { dflt: 500 }); }

    // METHODS -------------------------------------------------------------
    doperform(ctx) {
        Evts.listen(null, 'GameTock', (evt) => {
            this.ttl -= evt.elapsed;
            if (this.ttl <= 0) this.finish(true);
        }, this);
    }

}
