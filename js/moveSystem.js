export { MoveSystem };

import { Stats } from '../stats.js';
import { System } from '../system.js';
import { UxView } from '../uxView.js';
import { UpdateSystem } from './updateSystem.js';


/**
 * reads:
 * - heading
 * - speed
 * - x,y
 */
class MoveSystem extends System {
    //static dfltIterateTTL = 15;
    static dfltIterateTTL = 0;


    cpost(spec) {
        super.cpost(spec);
        this.xoverflows = {};
        this.yoverflows = {};
        // bind event handlers 
        this.onEntityIntent = this.onEntityIntent.bind(this);
        this.evt.listen(UxView.evtIntent, this.onEntityIntent);
    }

    destroy() {
        super.destroy();
        this.evt.ignore(UxView.evtIntent, this.onEntityIntent);
    }

    onEntityIntent(evt) {
        let actor = evt.actor;
        let update = evt.update;
        // only care about speed updates
        if (!actor || !update || !update.hasOwnProperty('speed')) return;
        let speed = update.speed;
        if (speed) {
            if (!this.store.has(actor.gid)) {
                if (this.dbg) console.log(`${this} detected speed set on non-moving object, update to track ${actor}`);
                this.store.set(actor.gid, actor);
            }
        } else {
            if (this.store.has(actor.gid)) {
                if (this.dbg) console.log(`${this} detected speed zeroed on moving object, update to no longer track ${actor}`);
                this.store.delete(actor.gid, actor);
                delete this.xoverflows[actor.gid];
                delete this.yoverflows[actor.gid];
            }
        }
    }

    iterate(evt, e) {
        Stats.count('move.iterate');
        // determine movement speed... skip if not moving...
        let speed = e.speed;
        if (!speed) return;
        speed *= evt.elapsed;
        // determine desired position based on speed and heading
        let dx = speed * Math.cos(e.heading) + (this.xoverflows[e.gid] || 0);
        let dy = speed * Math.sin(e.heading) + (this.yoverflows[e.gid] || 0);
        let wanty = e.xform.y;
        let wantx = e.xform.x;
        if (Math.abs(dx)>.001) {
            if (Math.abs(dx) > 1) {
                let rx = Math.round(dx);
                wantx += rx;
                this.xoverflows[e.gid] = dx-rx;
            } else {
                this.xoverflows[e.gid] = dx;
            }
        }
        if (Math.abs(dy)>.001) {
            if (Math.abs(dy) > 1) {
                let ry = Math.round(dy);
                wanty += ry;
                this.yoverflows[e.gid] = dy-ry;
            } else {
                this.yoverflows[e.gid] = dy;
            }
        }
        if (wantx === e.xform.x && wanty === e.xform.y) return;
        if (this.dbg) console.log(`move transform from: ${e.xform.x},${e.xform.y} to: ${wantx},${wanty}`);
        // handle update
        UpdateSystem.eUpdate(e, { xform: {x: wantx, y: wanty }});
    }

    matchPredicate(e) {
        return e.speed;
    }


}