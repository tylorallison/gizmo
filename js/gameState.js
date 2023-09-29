export { GameState };

import { AssetCtx } from './assetCtx.js';
import { ConfigCtx } from './configCtx.js';
import { Evts } from './event.js';
import { Fmt } from './fmt.js';
import { Gizmo } from './gizmo.js';
import { Util } from './util.js';

/**
 * A generic game state class that provides building blocks for game state transitions.  For example, a title screen, a main menu screen, and the 
 * main game play scene can all be managed by separate states.  Each state can manage UI elements, handle player inputs, and setup event handlers that 
 * will only be active when the state has active and in a 'started' state.  The {@link Game} class includes a {@link StateMgr} that is used to keep an 
 * inventory of available states and which state is currently active.  Only one state can be active at a time.  The game state has an internal state 
 * to track the progression of the state.  Possible internal state values are as follows:
 * - none: starting state, transitions to initialized during state start
 * - initialized: state has been initialized, transitions to started during state start
 * - started: state has been started, transitions to initialized if game state is stopped
 */
class GameState extends Gizmo {
    // STATIC VARIABLES ----------------------------------------------------
    static xassets = [];
    static xcfgs = {};

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('dbg', {dflt: false});
        this.schema('state', {dflt: 'none'});
        this.schema('xassets', {dflt: (o) => o.constructor.xassets});
    }

    // METHODS -------------------------------------------------------------
    async doinit(data) {
        if (this.dbg) console.log(`${this} starting initialization`);
        await this.init(data);
        if (this.dbg) console.log(`${this} initialization complete`);
        return Promise.resolve();
    }
    /**
     * init is called only once during state lifetime (when state is first started, before any other setup)
     * - intended to create required state/variables for the given game state
     * - override $init() for state specific init functionality
     * @param {*} data - game specific data used during state setup
     * @returns Promise
     */
    async init(data) {
        return Promise.resolve();
    }

    async doload(data) {
        if (this.dbg) console.log(`${this} starting loading`);
        // contexts
        // -- config
        await ConfigCtx.advance(new ConfigCtx({ values: Util.update({}, ConfigCtx.$instance.values, this.xcfgs) }));
        // -- assets
        await AssetCtx.advance(new AssetCtx({ xassets: this.xassets }));
        // FIXME: event context
        // abstract load
        await this.load(data);
        if (this.dbg) console.log(`${this} loading complete`);
        return Promise.resolve();
    }
    /**
     * load is called every time a state transitions from initiated to started
     * - intended to load assets or other setup that needs to occur after initial state setup.
     * - override load() for state specific load functionality
     * @param {*} data - game specific data used during state setup
     * @returns Promise
     */
    async load(data) {
        return Promise.resolve();
    }

    async doprepare(data) {
        if (this.dbg) console.log(`${this} starting prepare`);
        await this.prepare(data);
        if (this.dbg) console.log(`${this} prepare complete`);
        return Promise.resolve();
    }
    /**
     * prepare is called every time a state transitions from initialized to started and should contain state specific
     * logic to execute the game state.
     * @param {*} data - game specific data used during state setup
     * @returns Promise
     */
    async prepare(data) {
        return Promise.resolve();
    }

    /**
     * start is called by the {@link StateMgr} when a state needs to be started.  Start executes init, load, and prepare functions as needed
     * based on game state.  State will transition from none or initialized to started.
     * @param {*} data - game specific data used during state setup
     * @returns { Promise }
     */
    async start(data) {
        // initialization
        if (this.state === 'none') {
            await this.doinit(data);
            this.state = 'initialized';
        }
        // prepare
        if (this.state === 'initialized') {
            // load
            await this.doload(data);
            // prepare
            await this.doprepare(data);
            this.state = 'started';
        }
        Evts.trigger(this, 'state.started');
        return Promise.resolve();
    }

    /**
     * stop is called by the {@link StateMgr} to stop a state.  The state will transition from 'started' to 'initialized'.
     * @returns { Promise }
     */
    async stop() {
        this.state = 'initialized';
        Evts.trigger(this, 'state.stopped');
        AssetCtx.withdraw();
        ConfigCtx.withdraw();
        return Promise.resolve();
    }

    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }

}
