export { StateMgr };

import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { GameState } from './gameState.js';
import { Gizmo, GizmoContext } from './gizmo.js';
import { Timer } from './timer.js';

class StateMgr extends Gizmo {

    static start(state, data, gctx) {
        if (!gctx) gctx = GizmoContext.dflt;
        EvtSystem.trigger(gctx, 'state.wanted', { state: state, data: data });
    }
        
    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('dbg', { dflt: false });
        this.schema('states', { link: false, parser: () => ({}) });
        this.schema('current');
    }

    // CONSTRUCTOR ---------------------------------------------------------
    cpre(spec) {
        super.cpre(spec);
        this.onGizmoCreated = this.onGizmoCreated.bind(this);
        this.onGizmoDestroyed = this.onGizmoDestroyed.bind(this);
        this.onStateWanted = this.onStateWanted.bind(this);
    }

    cpost(spec) {
        super.cpost(spec);
        EvtSystem.listen(this.gctx, this, 'gizmo.created', this.onGizmoCreated)
        EvtSystem.listen(this.gctx, this, 'gizmo.destroyed', this.onGizmoDestroyed)
        EvtSystem.listen(this.gctx, this, 'state.wanted', this.onStateWanted)
    }

    // EVENT HANDLERS ------------------------------------------------------
    onGizmoCreated(evt) {
        if (evt.actor && (evt.actor instanceof GameState)) {
            let state = evt.actor;
            // pre-existing?
            if (this.dbg && this.states[state.tag]) console.log(`${this} replacing state for tag: ${state.tag}`);
            if (this.dbg) console.log(`${this} adding state: ${state} tag: ${state.tag}`);
            this.states[state.tag] = state;
        }
    }

    onGizmoDestroyed(evt) {
        if (evt.actor && (evt.actor instanceof GameState)) {
            let state = evt.actor;
            if (state.tag in this.states) {
                delete this.states[state.tag];
            }
        }
    }

    onStateWanted(evt) {
        let newState = evt.state;
        let data = evt.data;
        if (this.dbg) console.log(`${this} onStateWanted: ${Fmt.ofmt(evt)} current: ${this.current} new: ${newState}`);
        if (newState && newState !== this.current) {
            new Timer({gctx: this.gctx, ttl: 0, cb: () => {this.startState(newState, data)}});
        }
    }

    // METHODS -------------------------------------------------------------
    get(tag) {
        return this.states[tag];
    }

    startState(tag, data) {
        if (this.dbg) console.log(`${this} starting state: ${tag} with ${Fmt.ofmt(data)}`);
        let state = this.states[tag];
        if (!state) {
            console.error(`invalid state: ${tag}`);
            return;
        }
        // stop current state
        if (this.current) {
            this.current.stop();
        }
        // start new state
        state.start(data);
        this.current = state;
    }

}
