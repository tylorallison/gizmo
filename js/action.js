export { Action };

import { Gizmo } from './gizmo.js';
import { Evts } from './evt.js';
import { Fmt } from './fmt.js';
import { Util } from './util.js';
import { SfxSystem } from './sfxSystem.js';

class Action extends Gizmo {

    static {
        this.schema('dbg', {dflt: false});
        this.schema('done', { dflt: false });
        this.schema('started', { dflt: false });
        this.schema('ok', { dflt: true });
        this.schema('atts', { readonly: true });
        this.schema('actor', { gizmo: true });
        this.schema('startSfx', { parser: (o,x) => x.startSfx || o.constructor.dfltStartSfx });
        this.schema('okSfx', { parser: (o,x) => x.okSfx || o.constructor.dfltOkSfx });
        this.schema('failSfx', { parser: (o,x) => x.failSfx || o.constructor.dfltFailSfx });
    }

    // STATIC VARIABLES ----------------------------------------------------
    static dfltStartSfx = undefined;
    static dfltOkSfx = undefined;
    static dfltFailSfx = undefined;

    static async waitfor(actor, action, ctx) {
        let p = new Promise( resolve => {
            Evts.listen(actor, actor, 'ActionDone', (evt) => resolve(), { filter: (evt) => evt.action === action, once: true });
            action.perform(actor, ctx);
        })
        return p;
    }

    // METHODS -------------------------------------------------------------
    doperform(ctx) {
        this.done = true;
        this.finish(true);
    }

    perform(actor, ctx) {
        if (this.started) return;
        this.started = true;
        this.actor = actor;
        if (this.dbg) console.log(`${this} started for actor ${actor}`);
        Evts.trigger(actor, 'ActionStarted', { action: this });
        if (this.startSfx) SfxSystem.playSfx(this.actor, this.startSfx);
        this.doperform(ctx);
        return this.done;
    }

    finish(ok) {
        this.ok = ok;
        this.done = true;
        if (this.ok && this.atts) Util.update(this.actor, this.atts);
        if (this.ok && this.okSfx) SfxSystem.playSfx(this.actor, this.okSfx);
        if (!this.ok && this.failSfx) SfxSystem.playSfx(this.actor, this.failSfx);
        if (this.dbg) console.log(`${this} finished for actor ${this.actor}`);
        // -- the action is done
        Evts.trigger(this, 'ActionDone', { action: this, ok: this.ok });
        // -- the actor is done w/ action
        Evts.trigger(this.actor, 'ActionDone', { action: this, ok: this.ok });
        this.actor = null;
        this.destroy();
    }

    async wait(actor, ctx) {
        let p = new Promise( resolve => {
            Evts.listen(actor, actor, 'ActionDone', (evt) => resolve(), { filter: (evt) => evt.action === this, once: true });
            this.perform(actor, ctx);
        })
        return p;
    }

}
