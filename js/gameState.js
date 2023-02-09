export { GameState };

import { Assets } from './assets.js';
import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { Gizmo } from './gizmo.js';
import { Schema } from './schema.js';

/**
 * A generic game state
 * Lifecycle
 * created -> initialized -> loaded -> prepared -> started -V
 *                ^------              stopped  <-
 *                    
 */
class GameState extends Gizmo {
    // STATIC VARIABLES ----------------------------------------------------
    static assetSpecs = [];

    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'dbg', {dflt: false});
        Schema.apply(this, 'state', {dflt: 'created'});
        Schema.apply(this, 'assets', {readonly: true, parser: (o,x) => ((o.gctx.game && o.gctx.game.assets) ? o.gctx.game.assets: new Assets())});
        Schema.apply(this, 'assetSpecs', {readonly: true, parser: (o,x) => {
            if (x.assetSpecs) return x.assetSpecs;
            if (o.constructor.assetSpecs) return o.constructor.assetSpecs;
            return [];
        }});
    }

    // METHODS -------------------------------------------------------------
    /**
     * init is called only once during state lifetime (when state is first started, before any other setup)
     * -- intended to create required state/variables for the given game state
     * -- override $init() for state specific init functionality
     * @param {*} data 
     * @returns 
     */
    async doinit(data) {
        if (this.dbg) console.log(`${this} starting initialization`);
        await this.init(data);
        if (this.dbg) console.log(`${this} initialization complete`);
        this.state = 'initialized';
        return Promise.resolve();
    }
    async init(data) {
        return Promise.resolve();
    }

    /**
     * load is called once during state lifetime (when state is first started but after initialization)
     * -- intended to load assets or other setup that needs to occur after initial state setup.
     * -- override $load() for state specific load functionality
     * @param {*} data 
     * @returns 
     */
    async doload(data) {
        if (this.dbg) console.log(`${this} starting loading`);
        this.assets.register(this.assetSpecs);
        await this.assets.load();
        await this.load(data);
        if (this.dbg) console.log(`${this} loading complete`);
        this.state = 'prepared';
        return Promise.resolve();
    }
    async load(data) {
        return Promise.resolve();
    }

    /**
     * prepare is called every time a state is started
     * @param {*} data 
     * @returns 
     */
    async doprepare(data) {
        if (this.dbg) console.log(`${this} starting prepare`);
        await this.prepare(data);
        if (this.dbg) console.log(`${this} prepare complete`);
        this.state = 'started';
        return Promise.resolve();
    }
    async prepare(data) {
        return Promise.resolve();
    }

    async start(data) {
        // initialization
        if (this.state === 'created') {
            await this.doinit(data);
        }
        // load
        if (this.state === 'initialized') {
            await this.doload(data);
        }
        // prepare
        if (this.state === 'prepared') {
            await this.doprepare(data);
        }
        EvtSystem.trigger(this, 'state.started');
        return Promise.resolve();
    }

    async stop() {
        this.state = 'initialized';
        EvtSystem.trigger(this, 'state.stopped');
        this.assets.unregister(this.assetSpecs);
        return Promise.resolve();
    }

    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }

}