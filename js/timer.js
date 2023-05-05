import { GizmoContext } from './gizmoContext.js';
import { EvtSystem, ExtEvtReceiver } from './event.js';
import { GizmoData } from './gizmoData.js';
import { Stats } from './stats.js';

export { Timer };

class Timer extends GizmoData {
    static dfltTTL = 1000;

    static {
        this.schema(this, 'gctx', { readonly: true, parser: (o, x) => x.gctx || GizmoContext.main });
        this.schema(this, 'ttl', { eventable: false, dflt: this.dfltTTL });
        this.schema(this, 'startTTL', { readonly: true, parser: (o,x) => o.ttl });
        this.schema(this, 'loop', { readonly: true, dflt: false });
        this.schema(this, 'cb', { readonly: true, dflt: () => false });
        this.schema(this, 'data', { readonly: true });
        ExtEvtReceiver.apply(this);
    }

    constructor(spec={}) {
        super(spec);
        this.onTock = this.onTock.bind(this);
        EvtSystem.listen(this.gctx, this, 'game.tock', this.onTock);
    }

    destroy() {
        EvtSystem.clearReceiverLinks(this);
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
                EvtSystem.ignore(this.gctx, this, 'game.tock', this.onTock);
            }
            this.cb(Object.assign( { overflow: overflow, elapsed: this.startTTL + overflow }, evt, this.data));
        }
    }

}