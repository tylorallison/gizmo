export { UpdateSystem };

import { EventCtx } from './eventCtx.js';
import { Fmt } from './fmt.js';
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
        this.schema('updates', { link: false, parser: (o,x) => new Map() });
        this.schema('waiting', { link: false, parser: (o,x) => [] });
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpost(spec) {
        super.cpost(spec);
        // -- default transitions system to idle
        this.active = false;
        // -- handle events
        this.onSet = this.onSet.bind(this);
        EventCtx.listen(null, 'gizmo.set', this.onSet, this);
    }

    // EVENT HANDLERS ------------------------------------------------------
    onSet(evt) {
        if (!('actor' in evt)) return;
        if (!('set' in evt) && !('render' in evt)) return;
        this.setUpdate(evt.actor, evt.set);
    }

    // METHODS -------------------------------------------------------------
    setUpdate(g, set) {
        if (!this.updates.has(g.gid)) this.updates.set(g.gid, {});
        Util.update(this.updates.get(g.gid), set);
        if (this.dbg) console.log(`setUpdate: ${g} set: ${Fmt.ofmt(set)}`);
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
        this.updates = new Map();
        // waiting list for updated gizmos that are encountered while iterating in system (e.g.: an update event causes an kv update)
        this.waiting = [];
    }

    iterate(evt, e) {
        //console.log(`== iterate on ${e}`);
        let updates = this.currentUpdates.get(e.gid);
        if (!updates) return;
        // trigger entity updates
        let data = { frame: evt.frame, update: updates };
        EventCtx.trigger(e, 'gizmo.updated', data);
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
