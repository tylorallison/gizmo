import { EvtSystem, ExtEvtReceiver } from './event.js';
import { Gadget, GizmoContext } from './gizmo.js';
import { Stats } from './stats.js';

export { Timer };

class Timer extends Gadget {
    static dfltTTL = 1000;

    static {
        this.schema('gctx', { readonly: true, parser: (o, x) => x.gctx || GizmoContext.dflt });
        this.schema('ttl', { eventable: false, dflt: this.dfltTTL });
        this.schema('startTTL', { readonly: true, parser: (o,x) => o.ttl });
        this.schema('loop', { readonly: true, dflt: false });
        this.schema('cb', { readonly: true, dflt: () => false });
        this.schema('data', { readonly: true });
        ExtEvtReceiver.apply(this);
    }

    constructor(spec={}) {
        super(spec);
        this.onTock = this.onTock.bind(this);
        console.log(`timer ttl: ${this.ttl}`);
        EvtSystem.listen(this.gctx, this, 'game.tock', this.onTock);
    }

    destroy() {
        EvtSystem.clearReceiverLinks(this);
    }

    onTock(evt) {
        Stats.count('timer.ontock');
        console.log(`timer onTock ttl: ${this.ttl}`);
        this.ttl -= evt.deltaTime;
        if (this.ttl <= 0) {
            let overflow = -this.ttl;
            if (this.loop) {
                this.ttl += this.startTTL;
                if (this.ttl < 0) this.ttl = 0;
            } else {
                EvtSystem.ignore(this.gctx, this, 'game.tock', this.onTock);
            }
            this.cb(Object.assign( { overflow: overflow, elapsed: this.startTTL + overflow }, evt, this.data));
        }
    }

}
