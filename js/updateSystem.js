export { UpdateSystem };

import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { Schema } from './schema.js';
import { System } from './system.js';
import { Util } from './util.js';

/** ========================================================================
 * UpdateSystem listens for gizmo key/value updates, correlates/condenses those to a single update
 * and then publishes a gizmo update event for each updated gizmo per system iteration (frame).
 */
class UpdateSystem extends System {

    // STATIC VARIABLES ----------------------------------------------------
    // -- override default TTL (zero means update every frame)
    static dfltIterateTTL = 0;

    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'updates', { eventable: false, parser: (o,x) => new Map() });
        Schema.apply(this, 'waiting', { eventable: false, parser: (o,x) => [] });
        Schema.apply(this, 'renders', { eventable: false, parser: (o,x) => new Set() });
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpost(spec) {
        super.cpost(spec);
        // -- default transitions system to idle
        this.active = false;
        // -- handle events
        this.onSet = this.onSet.bind(this);
        EvtSystem.listen(this.gctx, this, 'gizmo.set', this.onSet);
    }

    // EVENT HANDLERS ------------------------------------------------------
    onSet(evt) {
        if (!('actor' in evt)) return;
        if (!('set' in evt) && !('render' in evt)) return;
        this.setUpdate(evt.actor, evt.set);
        if (evt.render) {
            this.renders.add(evt.actor.gid);
        }
    }

    // METHODS -------------------------------------------------------------
    setUpdate(g, set) {
        if (!this.updates.has(g.gid)) this.updates.set(g.gid, {});
        Util.update(this.updates.get(g.gid), set);
        // update store
        if (this.iterating) {
            this.waiting.push(g);
        } else {
            this.store.set(g.gid, g);
        }
        // set system active state
        this.active = true;
    }

    prepare(evt) {
        // swap out set of prepared updates from events
        // -- this allows events to trigger while the update system is iterating through updates
        this.currentUpdates = this.updates;
        this.currentRenders = this.renders;
        this.updates = new Map();
        this.renders = new Set();
        // waiting list for updated gizmos that are encountered while iterating in system (e.g.: an update event causes an kv update)
        this.waiting = [];
    }

    iterate(evt, e) {
        let updates = this.currentUpdates.get(e.gid);
        if (!updates && !this.currentRenders.has(e.gid)) return;
        // trigger entity updates
        let data = { frame: evt.frame, update: updates };
        if (this.currentRenders.has(e.gid)) data.render = true;
        EvtSystem.trigger(e, 'gizmo.updated', data);
    }

    finalize(evt) {
        // update current store 
        // -- clear old entries
        this.store.clear();
        // -- add any gizmo updated during iteration
        for (const g of this.waiting) {
            this.store.set(g.gid, g);
        }
        this.waiting.slice(0);
        this.active = (this.updates.size !== 0);
    }


}