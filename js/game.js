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
import { Schema } from './schema.js';
import { UiCanvas } from './uiCanvas.js';
import { SfxSystem } from './sfxSystem.js';

/**
 * class for static/global game state management, including initial game loading of assets, initializating and starting of global game state
 */
class Game extends Gizmo {
    // STATIC VARIABLES ----------------------------------------------------
    static assetSpecs = [];
    /*
    static startStateTag = 'play';
    static config = {};
    */

    // max allowed delta time (in ms)
    static dfltMaxDeltaTime = 50;

    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'dbg', { eventable: false, dflt: false});
        Schema.apply(this, 'name', { dflt: this.name, readonly: true});
        Schema.apply(this, 'maxDeltaTime', { eventable: false, dflt: this.dfltMaxDeltaTime});
        Schema.apply(this, 'frame', { eventable: false, dflt: 0});
        Schema.apply(this, 'lastUpdate', { eventable: false, dflt: 0});
        Schema.apply(this, 'assets', { readonly: true, parser: (o,x) => new Assets()});
        Schema.apply(this, 'systems', { readonly: true, parser: (o,x) => new SystemMgr({ gctx: o.gctx })});
        Schema.apply(this, 'states', { readonly: true, parser: (o,x) => new StateMgr({ gctx: o.gctx })});
        Schema.apply(this, 'generator', { readonly: true, parser: (o,x) => new Generator({ gctx: o.gctx, assets: o.assets })});
    }

    cpre(spec) {
        super.cpre(spec);
        this.loop = this.loop.bind(this);
    }

    cpost(spec) {
        super.cpost(spec);
        //this.dbg = spec.hasOwnProperty('dbg') ? spec.dbg : true;
        //this.name = spec.name || this.constructor.name;

        //this.maxDeltaTime = spec.maxDeltaTime || this.constructor.dfltMaxDeltaTime;
        //this.frame = 0;
        //this.lastUpdate = Math.round(performance.now());


        // -- build out game state
        this.gctx.game = this;
        Generator.main = this.generator;
        //GizmoProperty.define(this, 'assets', new Assets(), { readonly: true });
        //GizmoProperty.define(this, 'systems', new SystemMgr({gctx: this.gctx}), { readonly: true });
        //GizmoProperty.define(this, 'states', new StateMgr({gctx: this.gctx}), { readonly: true });
        //let generator = new Generator({gctx: this.gctx, assets: this.assets});
        //GizmoProperty.define(this, 'generator', generator, { readonly: true });

    }

    // METHODS -------------------------------------------------------------
    async doinit() {
        if (this.dbg) console.log(`${this.name} starting initialization`);
        /*
        // -- config
        Config.init(this.config);
        */
        UiCanvas.getCanvas().addEventListener('click', () => this.gctx.userActive = true, {once: true});
        EvtSystem.listen(this.gctx, this, 'key.down', () => this.gctx.userActive = true, {once: true});

        // -- assets
        this.assets.register(this.constructor.assetSpecs);

        await this.init();
        if (this.dbg) console.log(`${this.name} initialization complete`);
        EvtSystem.trigger(this, 'game.inited');
        return Promise.resolve();
    }
    async init() {
        return Promise.resolve();
    }

    async doload() {
        if (this.dbg) console.log(`${this.name} starting loading`);
        await this.assets.load();
        await this.load();
        if (this.dbg) console.log(`${this.name} loading complete`);
        EvtSystem.trigger(this, 'game.loaded');
        return Promise.resolve();
    }
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
    async prepare() {
        return Promise.resolve();
    }

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