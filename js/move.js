export { MoveAction };

import { Action } from './action.js';
//import { Events } from '../event.js';
import { Fmt } from '../fmt.js';
import { Mathf } from '../math.js';
import { Schema } from './schema.js';
import { EvtSystem } from './event.js';
//import { Game } from '../game.js';
//import { UpdateSystem } from '../systems/updateSystem.js';

class MoveAction extends Action {
    static dfltRange = 5;

    static {
        Schema.apply(this, 'x', { dflt: 0 });
        Schema.apply(this, 'y', { dflt: 0 });
        Schema.apply(this, 'range', { parser: (o,x) => x.hasOwnProperty('range') ? x.range : o.constructor.dfltRange });
        Schema.apply(this, 'snap', { dflt: false });
        Schema.apply(this, 'speed', { dflt: 0 });
        Schema.apply(this, 'accel', { dflt: 0 });
        Schema.apply(this, 'chained', { dflt: false });
        Schema.apply(this, 'actorHeadingTag', { readonly: true, dflt: 'heading' });
        Schema.apply(this, 'actorSpeedTag', { readonly: true, dflt: 'speed' });
        Schema.apply(this, 'actorMaxSpeedTag', { readonly: true, dflt: 'maxSpeed' });
        // facing?
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpre(spec) {
        super.cpre(spec);
        this.onTock = this.onTock.bind(this);
    }

    // EVENT HANDLERS ------------------------------------------------------
    onTock(evt) {
        this.updateVelocity(evt);
    }

    // METHODS -------------------------------------------------------------
    async prepare(ctx) {
        let p = new Promise( resolve => {
            this.resolver = resolve;
            if (!this.speed) this.speed = this.actor[this.actorMaxSpeedTag];
            EvtSystem.listen(this.gctx, this, 'game.tock', this.onTock);
        });
        return p;

        if (this.sfx) this.sfx.play();
    }

    async finish(ctx) {
        if (!this.ok) {
            if (this.actor) this.actor[this.actorSpeedTag] = 0;
        }
    }

    updateVelocity(evt) {
        // calculate distance to target
        let distance = Mathf.distance(this.x, this.y, this.actor.xform.x, this.actor.xform.y);
        let factor = this.factor;
        let heading = this.actor.heading;
        // if not within range...
        if (distance > this.range) {
            if (this.accel) {
                // compute acceleration/deceleration
                let speed = factor * this.speed;
                let decelDistance = (speed * speed) / (2 * this.accel);
                //we are still far, continue accelerating (if possible)
                if (distance > decelDistance) {
                    factor = Math.min((speed + this.accel * evt.deltaTime)/this.speed, 1);
                //we are about to reach the target, let's start decelerating.
                } else {
                    factor = Math.max((speed - this.accel * evt.deltaTime)/this.speed, 0);
                }
            } else {
                factor = 1;
            }
            // calculate heading
            heading = Mathf.angle(this.actor.xform.x, this.actor.xform.y, this.x, this.y, true);
            // calculate heading/speed from actor to target
            if (this.actor.heading !== heading || this.factor !== factor) {
                let update = {
                    heading: heading,
                    speed: factor*this.speed,
                };
                if (this.dbg) console.log(`${this.actor} update heading: ${heading} speed: ${factor*this.speed}`);
                if (this.facing && this.facing != this.actor.facing) {
                    update.facing = this.facing;
                }
                UpdateSystem.eUpdate(this.actor, update);
                this.factor = factor;
            }
        // within range of target
        } else {
            if (this.dbg) console.log(`${this.actor} arrived at target: ${this.x},${this.y}`);
            let update = {};
            this.done = true;
            if (this.stopAtTarget) update.speed = 0;
            if (this.snap) {
                update.xform = { x: this.x, y: this.y };
            }
            //console.log(`-- move update: ${Fmt.ofmt(update)}`);
            this.finish(update);
        }
    }

}

