export { MoveAction, MoveToAction, MoveSystem };

import { Action } from './action.js';
import { Evts } from './evt.js';
import { Vect } from './vect.js';
import { System } from './system.js';
import { Stats } from './stats.js';
import { Mathf } from './math.js';
import { Fmt } from './fmt.js';

class MoveAction extends Action {

    static {
        this.schema('speed', { dflt: 1 });
        this.schema('currentSpeed', { dflt: 0 });
        this.schema('accel', { dflt: 0 });
        this.schema('heading', { dflt: 0 });
        this.schema('overx', { dflt: 0, eventable: false });
        this.schema('overy', { dflt: 0, eventable: false });
        // -- autogenerated dx/dy, regenerated upon heading changes
        this.schema('dx', { eventable: false, generator: (o, x) => Math.cos(o.heading) });
        this.schema('dy', { eventable: false, generator: (o, x) => Math.sin(o.heading) });
    }

    doperform(ctx) {}

    toString() {
        return Fmt.toString(this.constructor.name, this.currentSpeed, this.heading);
    }

}

class MoveToAction extends MoveAction {
    static {
        this.schema('target', { });
        this.schema('snap', { dflt: false });
        this.schema('range', { dflt: 1 });
        this.schema('chained', { dflt: false });
    }

    //doperform(ctx) { console.log(`${this} chained: ${this.chained}`)}

    toString() {
        return Fmt.toString(this.constructor.name, this.currentSpeed, Fmt.ofmt(this.target));
    }
}

class MoveSystem extends System {
    static dfltMatchFcn = ((gzo) => (gzo instanceof MoveAction && gzo.actor) );

    static {
        this.schema('actorLocator', { eventable: false, dflt: () => {() => new Vect({x:actor.xform.x, y:actor.xform.y})} });
        this.schema('targetLocator', { eventable: false, dflt: () => {(target) => new Vect({x:target.xform.x, y:target.xform.y})} });
        this.schema('actorMover', { eventable: false, dflt: () => {(actor, loc) => { actor.xform.x = loc.x; actor.xform.y = loc.y }}} );
        this.schema('minDelta', { eventable: false, dflt: .001 });
        this.schema('minSpeed', { eventable: false, dflt: .001 });
    }

    static dfltIterateTTL = 0;

    cpost(spec) {
        super.cpost(spec);
        // bind event handlers 
        this.onMoveStarted = this.onMoveStarted.bind(this);
        Evts.listen(null, 'ActionStarted', this.onMoveStarted, this, { filter: (evt) => (evt.action instanceof MoveAction) });
    }

    onMoveStarted(evt) {
        let action = evt.action;
        if (!action) return;
        if (!this.store.has(action.gid)) {
            this.store.set(action.gid, action);
            Evts.listen(action, 'ActionDone', (evt) => {
                this.store.delete(action.gid);
            }, this);
        }
    }

    iterate(evt, e) {
        Stats.count('move.iterate');
        let actorLoc = this.actorLocator(e.actor);
        let targetLoc, targetDistance, targetReached = false;
        let startSpeed = e.currentSpeed;
        let elapsedSpeed = e.currentSpeed;
        // adjust speed based on acceleration
        if (e.accel && !e.chained) {
            // handle acceleration
            if (e.currentSpeed < e.speed) {
                e.currentSpeed = Math.min(e.currentSpeed + e.accel * evt.ticks, e.speed);
            // handle deceleration
            } else if (e.currentSpeed > e.speed) {
                e.currentSpeed = Math.max(e.currentSpeed - e.accel * evt.ticks, 0);
                if (e.currentSpeed < this.minSpeed) e.currentSpeed = 0;
            }
            elapsedSpeed = (e.currentSpeed + startSpeed)*.5;
        } else {
            e.currentSpeed = e.speed;
            elapsedSpeed = e.currentSpeed;
        }
        // calculate heading change to target
        // -- if drastic change of heading, reset overx/overy
        if (e.target) {
            targetLoc = this.targetLocator(e.target);
            targetDistance = Mathf.distance(targetLoc.x, targetLoc.y, actorLoc.x, actorLoc.y);
            let newHeading = Mathf.angle(actorLoc.x, actorLoc.y, targetLoc.x, targetLoc.y, true);
            if (newHeading) {
                if (Mathf.angleBetween(newHeading, e.heading) > Math.PI*.25) {
                    e.overx = 0;
                    e.overy = 0;
                }
            }
            e.heading = newHeading;
        }
        // move actor based on current speed and heading
        elapsedSpeed = elapsedSpeed * evt.ticks;
        // determine desired position based on speed and heading
        let dx = elapsedSpeed * e.dx + e.overx;
        let dy = elapsedSpeed * e.dy + e.overy;
        let ddist = Math.sqrt(dx*dx + dy*dy);
        // check if current speed will overrun target
        if (e.target && targetDistance < ddist) {
            this.actorMover(e.actor, targetLoc);
            targetReached = true;
        } else {
            //console.log(`iterate speed: ${e.speed} heading: ${e.heading} e.d: ${e.dx},${e.dy} over: ${e.overx},${e.overy} d: ${dx},${dy}`);
            // handle rollover of partial pixels
            if (Math.abs(dx)>this.minDelta) {
                if (Math.abs(dx) >= 1) {
                    let rx = (dx > 0) ? Math.floor(dx) : Math.floor(dx)+1;
                    actorLoc.x += rx;
                    e.overx = dx-rx;
                } else {
                    e.overx = dx;
                }
            }
            if (Math.abs(dy)>this.minDelta) {
                if (Math.abs(dy) >= 1) {
                    let ry = (dy > 0) ? Math.floor(dy) : Math.floor(dy)+1;
                    actorLoc.y += ry;
                    e.overy = dy-ry;
                } else {
                    e.overy = dy;
                }
            }
            this.actorMover(e.actor, actorLoc);
        }
        // if action has target ... handle movement tracking to target
        if (!targetReached && e.target) {
            targetDistance = Mathf.distance(targetLoc.x, targetLoc.y, actorLoc.x, actorLoc.y);
            // as we approach target, calculate distance required to slow down, start slowing down when we reach that distance
            if (e.accel && !e.chained) {
                let decelDistance = (e.currentSpeed * e.currentSpeed) / (2 * e.accel);
                if (targetDistance < decelDistance) e.speed = 0;
            }
            // if we are within range of target...
            if (targetDistance <= e.range) {
                targetReached = true;
                if (this.dbg) console.log(`${e.actor} arrived in range of target: ${targetLoc}`);
                // snap to target if set
                if (e.snap) this.actorMover(e.actor, targetLoc);
            }
        }
        // complete action if target is reached or speed is zero'd
        if (targetReached || (e.currentSpeed === 0 && e.speed === 0)) {
            if (e.target && !e.chained) {
                e.speed = 0;
                e.currentSpeed = 0;
            }
            e.finish(e.ok);
        }
    }

}
