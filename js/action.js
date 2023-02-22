
export { Action };

import { Gizmo } from './gizmo.js';
import { Schema } from './schema.js';
import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { Util } from './util.js';

//import { EvtStream } from '../event.js';
//import { Fmt } from '../fmt.js';
//import { UpdateSystem } from '../systems/updateSystem.js';

class Action extends Gizmo {

    static {
        Schema.apply(this, 'cost', { parser: (o,x) => x.hasOwnProperty('cost') ? x.cost : o.constructor.dfltPoints });
        Schema.apply(this, 'done', { dflt: false });
        Schema.apply(this, 'ok', { dflt: true });
        Schema.apply(this, 'atts', { parser: (o,x) => x.atts || {} });
        Schema.apply(this, 'actor', { gizmo: true });
        Schema.apply(this, 'promise', { parser: (o,x) => null });
    }

    // STATIC VARIABLES ----------------------------------------------------
    //static evtStarted = 'action.started';
    //static evtDone = 'action.done';
    static dfltPoints = 1;

    // CONSTRUCTOR ---------------------------------------------------------
    cpost(spec={}) {
        super.cpost();
    }
    /*
    constructor(spec={}) {
        //this.evt = spec.evt || new EvtStream();
        //this.points = spec.hasOwnProperty('points') ? spec.points : this.constructor.dfltPoints;
        //this.dbg = spec.dbg;
        //this.done = false;
        //this.ok = true;
        //this.info = spec.info || 'action';
        //this.update = spec.update;
    }
    */
    destroy() {
        if (!this.done) this.ok = false;
        super.destroy();
    }

    // METHODS -------------------------------------------------------------
    async perform(actor, ctx) {
        this.actor = actor;
        EvtSystem.trigger(actor, 'action.started', { action: this });
        console.log(`perform w/ ${actor}`);

        // perform action-specific preparation
        await this.prepare(ctx);
        console.log(`after prepare ok: ${this.ok}`);
        if (this.ok) {
            // perform action-specific finishing
            await this.finish(ctx);
            // update actor state
            if (this.ok) Util.update(this.actor, this.atts);
        }
        this.done = true;
        EvtSystem.trigger(actor, 'action.done', { action: this, ok: this.ok });
        return Promise.resolve(this.ok);

            //if (this.ok && (update || this.update)) {
                //update = Object.assign({}, this.update, update);
                //UpdateSystem.eUpdate(this.actor, update, () => {
                    //this.done = true;
                    //this.evt.trigger(this.constructor.evtDone, {actor: this.actor, action: this, ok: this.ok});
                    //this.destroy();
                //});
            //} else {
                //this.done = true;
                //this.evt.trigger(this.constructor.evtDone, {actor: this.actor, action: this, ok: this.ok});
                //this.destroy();
                        //if (this.ok) {
                //}

        // action specific setup
        //this.setup();
        //// finish if we don't have to wait
        //if (this.done) this.finish();
        //return Promise.resolve();
    }
    async prepare(ctx) {
        console.log(`base prepare`);
        return Promise.resolve(this.ok);
    }
    async finish(update, ctx) {
        return Promise.resolve(this.ok);
    }
    toString() {
        return Fmt.toString(this.constructor.name, this.done, this.update);
    }
}
