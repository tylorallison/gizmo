export { Timer };
import { Gadget } from './gizmo.js';
import { Evts } from './evt.js';
import { Stats } from './stats.js';

class Timer extends Gadget {
    static dfltTTL = 1000;
    static gid = 0;

    static {
        /** @member {int} Timer#gid - unique timer id used for event handling */
        this.schema('gid', { readonly: true, dflt: () => (Timer.gid++) });
        this.schema('ttl', { eventable: false, dflt: this.dfltTTL });
        this.schema('startTTL', { readonly: true, parser: (o,x) => o.ttl });
        this.schema('loop', { readonly: true, dflt: false });
        this.schema('cb', { readonly: true, dflt: () => false });
        this.schema('data', { readonly: true });
    }

    constructor(spec={}) {
        super(spec);
        this.onTock = this.onTock.bind(this);
        Evts.listen(null, 'game.tock', this.onTock, this);
    }

    destroy() {
        Evts.clearFor(this);
    }

    onTock(evt) {
        Stats.count('timer.ontock');
        this.ttl -= evt.deltaTime;
        if (this.ttl <= 0) {
            let overflow = -this.ttl;
            if (this.loop) {
                this.ttl += this.startTTL;
                if (this.ttl < 0) this.ttl = 0;
            } else {
                Evts.ignore(null, 'game.tock', this.onTock, this);
            }
            this.cb(Object.assign( { overflow: overflow, elapsed: this.startTTL + overflow }, evt, this.data));
        }
    }

}
