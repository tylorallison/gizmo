export { Game };

import { Assets } from './assets.js';
import { EvtSystem } from './event.js';
import { Gizmo } from './gizmo.js';
import { KeySystem } from './keySystem.js';
import { MouseSystem } from './mouseSystem.js';
import { RenderSystem } from './renderSystem.js';
import { UpdateSystem } from './updateSystem.js';
import { StateMgr } from './stateMgr.js';
import { SystemMgr } from './systemMgr.js';
import { Generator } from './generator.js';
import { UiCanvas } from './uiCanvas.js';
import { SfxSystem } from './sfxSystem.js';
import { Config } from './config.js';
import { ConfigCtx } from './configCtx.js';
import { Util } from './util.js';
import { AssetCtx } from './assetCtx.js';

/**
 * class for static/global game state management, including initial game loading of assets, initializating and starting of global game state
 * @extends Gizmo
 */
class Game extends Gizmo {
    // STATIC VARIABLES ----------------------------------------------------
    /**
     * xassets is an array of {@link GizmoSpec} specifications that define assets for the game.  These definitions
     * will be parsed and loaded during game startup.  Override this static variable in subclasses to define assets for specific game logic.
     * @static
     */
    static xassets = [];

    static {
        Config.setPathDefaults(this.cfgpath, {
            'maxDeltaTime': 50,
        });
    }

    static xcfgValues = { 
        'game.dbg': true,
        'system.renderSystem.dbg': true,
    };

    // max allowed delta time (in ms)
    static dfltMaxDeltaTime = 50;

    // SCHEMA --------------------------------------------------------------
    /** @member {*} Game#dbg - enables debugging for gizmo */
    static { this.schema('dbg', { eventable: false, dflt: false}); }
    /** @member {string} Game#name - name for game */
    static { this.schema('name', { dflt: this.name, readonly: true}); }
    /** @member {int} Game#maxDeltaTime - max value for a single frame delta time */
    static { this.schema('maxDeltaTime', { eventable: false, dflt: this.dfltMaxDeltaTime}); }
    /** @member {int} Game#frame - frame counter */
    static { this.schema('frame', { eventable: false, dflt: 0}); }
    /** @member {float} Game#lastUpdate - time of last update */
    static { this.schema('lastUpdate', { eventable: false, dflt: 0}); }
    /** @member {SystemMgr} Game#systems - game systems {@link System} */
    static { this.schema('systems', { readonly: true, parser: (o,x) => new SystemMgr({ gctx: o.gctx })}); }
    /** @member {StateMgr} Game#states - game states {@link GameState} */
    static { this.schema('states', { readonly: true, parser: (o,x) => new StateMgr({ gctx: o.gctx })}); }
    /** @member {Generator} Game#generator - generator for gizmos in game */
    static { this.schema('generator', { readonly: true, parser: (o,x) => new Generator({ gctx: o.gctx })}); }

    // CONSTRUCTOR ---------------------------------------------------------
    cpre(spec) {
        super.cpre(spec);
        this.loop = this.loop.bind(this);
    }
    cpost(spec) {
        super.cpost(spec);
        // -- build out game state
        this.gctx.game = this;
        Generator.dflt = this.generator;
    }

    // METHODS -------------------------------------------------------------
    async doinit() {
        if (this.dbg) console.log(`${this.name} starting initialization`);
        UiCanvas.getCanvas().addEventListener('click', () => this.gctx.userActive = true, {once: true});
        EvtSystem.listen(this.gctx, this, 'key.down', () => this.gctx.userActive = true, {once: true});
        // load contexts
        // -- config
        await ConfigCtx.advance(new ConfigCtx({ values: Util.update({}, ConfigCtx.instance.values, this.xcfgValues) }));
        // -- assets
        await AssetCtx.advance(new AssetCtx({ xassets: this.constructor.xassets }));
        // game init
        await this.init();
        if (this.dbg) console.log(`${this.name} initialization complete`);
        EvtSystem.trigger(this, 'game.inited');
        return Promise.resolve();
    }

    /**
     * init is called during game startup to perform any initialization that is required before assets are loaded.  
     * Override to perform game specific initialization.
     * @returns {Promise}
     */
    async init() {
        return Promise.resolve();
    }

    async doload() {
        if (this.dbg) console.log(`${this.name} starting loading`);
        //await this.assets.load();
        await this.load();
        if (this.dbg) console.log(`${this.name} loading complete`);
        EvtSystem.trigger(this, 'game.loaded');
        return Promise.resolve();
    }

    /**
     * load is called during game startup to perform game loading functions.  
     * @returns {Promise}
     */
    async load() {
        return Promise.resolve();
    }

    prepareSystems() {
        new KeySystem({gctx: this.gctx});
        new MouseSystem({gctx: this.gctx, dbg: false});
        new RenderSystem({gctx: this.gctx, dbg: false});
        new UpdateSystem({gctx: this.gctx, dbg: false});
        new SfxSystem({gctx: this.gctx, dbg: false});
    }

    async doprepare() {
        if (this.dbg) console.log(`${this.name} starting prepare`);
        // -- bring game systems online
        this.prepareSystems();
        // -- game specific prepare
        await this.prepare();
        if (this.dbg) console.log(`${this.name} prepare complete`);
        EvtSystem.trigger(this, 'game.prepared');
        return Promise.resolve();
    }

    /**
     * prepare is the final stage of game startup.  This method should be overwritten to provide game-specific
     * logic to start your game.
     * @returns {Promise}
     */
    async prepare() {
        return Promise.resolve();
    }

    /**
     * start is called to start the game.  It will call init, load, and prepare in order and wait for each stage to complete.  Then the main
     * game loop is started.
     * @returns {Promise}
     */
    async start() {
        // initialization
        await this.doinit();
        // load
        await this.doload();
        // prepare
        await this.doprepare();
        EvtSystem.trigger(this, 'game.started');
        // start the game loop
        window.requestAnimationFrame(this.loop);
        return Promise.resolve();
    }

    loop(timestamp) {
        // increment frame counter
        this.frame++;
        if (this.frame > Number.MAX_SAFE_INTEGER) this.frame = 0;
        // compute delta time
        const dt = Math.min(this.maxDeltaTime, timestamp - this.lastUpdate);
        this.lastUpdate = timestamp;
        EvtSystem.trigger(this, 'game.tock', { deltaTime: parseInt(dt), frame: this.frame });
        // next iteration
        window.requestAnimationFrame(this.loop);
    }


}
