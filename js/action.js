export { Action };

import { Gizmo } from './gizmo.js';
import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { Util } from './util.js';
import { SfxSystem } from './sfxSystem.js';

class Action extends Gizmo {

    static {
        // FIXME
        this.schema(this, 'dbg', {dflt: true});
        this.schema(this, 'done', { dflt: false });
        this.schema(this, 'ok', { dflt: true });
        this.schema(this, 'atts', { readonly: true });
        this.schema(this, 'actor', { gizmo: true });
        this.schema(this, 'startSfx', { parser: (o,x) => x.startSfx || o.constructor.dfltStartSfx });
        this.schema(this, 'okSfx', { parser: (o,x) => x.okSfx || o.constructor.dfltOkSfx });
        this.schema(this, 'failSfx', { parser: (o,x) => x.failSfx || o.constructor.dfltFailSfx });
    }

    // STATIC VARIABLES ----------------------------------------------------
    static dfltStartSfx = undefined;
    static dfltOkSfx = undefined;
    static dfltFailSfx = undefined;

    static async waitfor(actor, action) {
        let p = new Promise( resolve => {
            EvtSystem.listen(actor, actor, 'action.done', (evt) => resolve(), { filter: (evt) => evt.action === action, once: true });
            action.perform(actor, action);
        })
        return p;
    }

    // METHODS -------------------------------------------------------------
    doperform(ctx) {
        this.done = true;
    }

    perform(actor, ctx) {
        this.actor = actor;
        if (this.dbg) console.log(`${this} started for actor ${actor}`);
        EvtSystem.trigger(actor, 'action.started', { action: this });
        if (this.startSfx) SfxSystem.playSfx(this.actor, this.startSfx);
        this.doperform(ctx);
        //if (this.done) this.finish(this.ok);
        return this.done;
    }

    finish(ok) {
        this.ok = ok;
        this.done = true;
        if (this.ok && this.atts) Util.update(this.actor, this.atts);
        if (this.ok && this.okSfx) SfxSystem.playSfx(this.actor, this.okSfx);
        if (!this.ok && this.failSfx) SfxSystem.playSfx(this.actor, this.failSfx);
        if (this.dbg) console.log(`${this} finished for actor ${this.actor}`);
        EvtSystem.trigger(this.actor, 'action.done', { action: this, ok: this.ok });
        this.actor = null;
        this.destroy();
    }

}