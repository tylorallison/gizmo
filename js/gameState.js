export { GameState };

import { Assets } from './asset.js';
import { Configs } from './config.js';
import { Evts } from './evt.js';
import { Fmt } from './fmt.js';
import { Gizmo } from './gizmo.js';
import { Util } from './util.js';

/**
 * A generic game state class that provides building blocks for game state transitions.  For example, a title screen, a main menu screen, and the 
 * main game play scene can all be managed by separate states.  Each state can manage UI elements, handle player inputs, and setup event handlers that 
 * will only be active when the state has active and in a 'active' state.  The {@link Game} class includes a {@link StateMgr} that is used to keep an 
 * inventory of available states and which state is currently active.  Only one state can be active at a time.  The game state has an internal state 
 * to track the progression of the state.  Possible internal state values are as follows:
 * - inactive: starting and/or idle state
 * - active: state is active
 */
class GameState extends Gizmo {
    // STATIC VARIABLES ----------------------------------------------------
    static xassets = [];
    static xcfgs = {};

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('dbg', {dflt: false});
        this.schema('state', {dflt: 'inactive'});
        this.schema('xcfgs', {dflt: (o) => o.constructor.xcfgs});
        this.schema('xassets', {dflt: (o) => o.constructor.xassets});
    }

    // CONSTRUCTOR ---------------------------------------------------------
    cpost(spec) {
        this.doinit();
    }

    // METHODS -------------------------------------------------------------
    doinit() {
        if (this.dbg) console.log(`${this} starting init`);
        this.init();
        if (this.dbg) console.log(`${this} init complete`);
    }
    /**
     * init is called only once during state lifetime (when state is first created, before any other setup)
     * - intended to create required state/variables for the given game state
     * - override init() for state specific init functionality
     */
    init() {
    }

    async doprepare(data) {
        if (this.dbg) console.log(`${this} starting prepare`);
        // update global contexts for game state
        // -- config
        if (this.xcfgs) Configs.setValues(this.xcfgs);
        // -- assets
        if (this.xassets) Assets.add(this.xassets);
        await Assets.advance();
        await this.prepare(data);
        if (this.dbg) console.log(`${this} prepare complete`);
        return Promise.resolve();
    }
    /**
     * prepare is called every time a state transitions from inactive to active and should contain state specific
     * logic to execute the game state.
     * @param {*} data - game specific data used during state setup
     * @returns Promise
     */
    async prepare(data) {
        return Promise.resolve();
    }

    /**
     * start is called by the {@link StateMgr} when a state needs to be started.  Start executes prepare functions as needed
     * based on game state.  State will transition from inactive to active.
     * @param {*} data - game specific data used during state setup
     * @returns { Promise }
     */
    async start(data) {
        // prepare
        if (this.state === 'inactive') {
            // prepare
            await this.doprepare(data);
            this.state = 'active';
        }
        Evts.trigger(this, 'StateStarted');
        return Promise.resolve();
    }

    /**
     * stop is called by the {@link StateMgr} to stop a state.  The state will transition from 'active' to 'inactive'.
     * @returns { Promise }
     */
    async stop() {
        this.state = 'inactive';
        Evts.trigger(this, 'StateStopped');
        // clean up global contexts
        // -- config
        if (this.xcfgs) Configs.deleteValues(this.xcfgs);
        // -- assets
        if (this.xassets) Assets.delete(this.xassets);
        return Promise.resolve();
    }

    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }

}
