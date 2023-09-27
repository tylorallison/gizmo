export { System }

import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { Gizmo } from './gizmo.js';
import { Stats } from './stats.js';
import { Timer } from './timer.js';

class System extends Gizmo {
    // STATIC VARIABLES ----------------------------------------------------
    static dfltIterateTTL = 200;
    static dfltMatchFcn = (() => false);

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('iterateTTL', { eventable: false, parser: (o,x) => x.hasOwnProperty('iterateTTL') ? x.iterateTTL : o.constructor.dfltIterateTTL});
        this.schema('dbg', { eventable: false, dflt: false });
        this.schema('active', { eventable: false, dflt: true });
        this.schema('matchFcn', { eventable: false, parser: (o,x) => x.hasOwnProperty('matchFcn') ? x.matchFcn : (o.constructor.dfltMatchFcn || (() => false)) });
        this.schema('store', { link: false, readonly: true, parser: (o,x) => x.store || new Map()});
        this.schema('iterating', { eventable: false, dflt: false });
        this.schema('timer', { order: 1, readonly: true, parser: (o,x) => new Timer({gctx: o.gctx, ttl: o.iterateTTL, cb: o.onTimer, loop: true})});
    }

    // CONSTRUCTOR ---------------------------------------------------------
    cpre(spec) {
        this.onTimer = this.onTimer.bind(this);
        this.onGizmoCreated = this.onGizmoCreated.bind(this);
        this.onGizmoDestroyed = this.onGizmoDestroyed.bind(this);
    }
    cpost(spec) {
        super.cpost(spec);
        // -- setup event handlers
        EvtSystem.listen(this.gctx, this, 'gizmo.created', this.onGizmoCreated);
        EvtSystem.listen(this.gctx, this, 'gizmo.destroyed', this.onGizmoDestroyed);
    }

    // EVENT HANDLERS ------------------------------------------------------
    onTimer(evt) {
        if (!this.active) return;
        this.iterating = true;
        this.prepare(evt);
        for (const e of this.store.values()) {
            Stats.count('sys.iterate');
            this.iterate(evt, e);
        }
        this.finalize(evt);
        this.iterating = false;
    }

    onGizmoCreated(evt) {
        if (this.matchFcn(evt.actor)) {
            if (this.dbg) console.log(`${this} onGizmoCreated: ${Fmt.ofmt(evt)} gid: ${evt.actor.gid}`);
            this.store.set(evt.actor.gid, evt.actor);
        }
    }

    onGizmoDestroyed(evt) {
        if (this.store.has(evt.actor.gid)) {
            if (this.dbg) console.log(`${this} onGizmoDestroyed: ${Fmt.ofmt(evt)}`);
            this.store.delete(evt.actor.gid);
        }
    }

    // METHODS -------------------------------------------------------------
    prepare(evt) {
    }

    iterate(evt, e) {
    }

    finalize(evt) {
    }

}
