export { StateMgr };

import { Evts } from './evt.js';
import { Fmt } from './fmt.js';
import { GameState } from './gameState.js';
import { Gizmo } from './gizmo.js';
import { Timer } from './timer.js';


class StateMgr extends Gizmo {

    static start(state, data) {
        Evts.trigger(null, 'StateWanted', { state: state, data: data });
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
        Evts.listen(null, 'GizmoCreated', this.onGizmoCreated, this);
        Evts.listen(null, 'GizmoDestroyed', this.onGizmoDestroyed, this);
        Evts.listen(null, 'StateWanted', this.onStateWanted, this);
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
            new Timer({ttl: 0, cb: () => {this.startState(newState, data)}});
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
