export { Action };

import { Gizmo } from './gizmo.js';
import { Schema } from './schema.js';
import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { Util } from './util.js';
import { SfxSystem } from './sfxSystem.js';

// FIXME: remove all async/promise code from actions... actions need to be able to be serialized, can't serialize the resolver
// can still add a static "wait" function that wraps an action with a promise

class Action extends Gizmo {

    static {
        Schema.apply(this, 'dbg', {dflt: false});
        Schema.apply(this, 'cost', { parser: (o,x) => x.hasOwnProperty('cost') ? x.cost : o.constructor.dfltPoints });
        Schema.apply(this, 'done', { dflt: false });
        Schema.apply(this, 'ok', { dflt: true });
        Schema.apply(this, 'atts', { readonly: true, parser: (o,x) => x.atts || {} });
        Schema.apply(this, 'actor', { gizmo: true });
        Schema.apply(this, 'startSfx', { parser: (o,x) => x.startSfx || o.constructor.dfltStartSfx });
        Schema.apply(this, 'okSfx', { parser: (o,x) => x.okSfx || o.constructor.dfltOkSfx });
        Schema.apply(this, 'failSfx', { parser: (o,x) => x.failSfx || o.constructor.dfltFailSfx });
        Schema.apply(this, 'resolver', { serializable: false, eventable: false });
    }

    // STATIC VARIABLES ----------------------------------------------------
    static dfltPoints = 1;
    static dfltStartSfx = undefined;
    static dfltOkSfx = undefined;
    static dfltFailSfx = undefined;

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    destroy() {
        if (!this.done) this.ok = false;
        if (this.resolver) {
            this.resolver(this.ok);
            this.resolve = null;
        }
        super.destroy();
    }

    // METHODS -------------------------------------------------------------
    async perform(actor, ctx) {
        this.actor = actor;
        EvtSystem.trigger(actor, 'action.started', { action: this });
        if (this.startSfx) SfxSystem.playSfx(this, this.startSfx);

        // perform action-specific preparation
        await this.prepare(ctx);
        if (this.ok) {
            // perform action-specific finishing
            await this.finish(ctx);
            this.resolver = null;
            // update actor state
            if (this.ok) Util.update(this.actor, this.atts);
        }
        this.done = true;
        if (this.startSfx) SfxSystem.stopSfx(this, this.startSfx);
        if (this.ok && this.okSfx) SfxSystem.playSfx(this, this.okSfx);
        if (!this.ok && this.failSfx) SfxSystem.playSfx(this, this.failSfx);
        EvtSystem.trigger(actor, 'action.done', { action: this, ok: this.ok });
        EvtSystem.trigger(this, 'action.done', { action: this, ok: this.ok });
        // clean up all action state
        console.log(`destroy ${this}`);
        this.destroy();
        return Promise.resolve(this.ok);
    }

    async prepare(ctx) {
        return Promise.resolve(this.ok);
    }

    async finish(update, ctx) {
        return Promise.resolve(this.ok);
    }

}
