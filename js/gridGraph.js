export { GridGraph };

//import { OpenAction } from './actions/open.js';
//import { MoveAction } from './base/actions/move.js';
//import { Assets } from './base/assets.js';
//import { Direction } from './base/dir.js';
//import { Events } from './base/event.js';
//import { Vect } from './base/vect.js';
//import { Door } from './entities/door.js';

import { Direction } from './direction.js';
import { GizmoData } from './gizmoData.js';
import { MoveToAction } from './move.js';
import { Schema } from './schema.js';
import { UiGrid } from './uiGrid.js';
import { Vect } from './vect.js';

class GridGraph extends GizmoData {
    static {
        Schema.apply(this, 'grid', { eventable: false, readonly: true, parser: (o,x) => x.grid || new UiGrid()});
        Schema.apply(this, 'charger', { eventable: false, readonly: true, parser: (o,x) => x.charger || ((graph, base, from, to) => {
            let fromv = graph.grid.vfromidx(from, true);
            let tov = graph.grid.vfromidx(to, true);
            return base + Math.round(Vect.dist(fromv, tov)); 
        })});
        Schema.apply(this, 'mover', { eventable: false, readonly: true, parser: (o,x) => x.mover || ((graph, to) => {
            let targetLoc = graph.grid.vfromidx(to, true);
            return new MoveToAction({ 
                target: targetLoc,
                targetSpeed: .1,
                snap: true, 
            });
        })});
    }
        //let facing = (tov.x > fromv.x) ? Direction.east : (tov.x < fromv.x) ? Direction.west : 0;

    heuristic(v1, v2) {
        let v1v = this.grid.vfromidx(v1, true);
        let v2v = this.grid.vfromidx(v2, true);
        return Math.round(Vect.dist(v1v, v2v)); 
    }
    equals(v1, v2) {
        return v1 === v2;
    }

    blocks(e, other) {
        return false;
        //let v = (e.blockedBy & other.blocks);
        //return v;
    }

    contains(node) {
        if (!this.grid) return false;
        return true;
    }

    *getNeighbors(e, node) {
        if (!this.grid) return [];
        // look along each direction
        for (const dir of Direction.all) {
            let nidx = this.grid.idxfromdir(node, dir);
            if (nidx < 0) continue;
            // can't path through reserved indices
            //if (this.lvl.isIdxReserved(nidx)) continue;
            // find any objects that might be blocking our path
            let blocked = false;
            for (const other of this.grid.findAtIdx(nidx, (gzo) => gzo !== e)) {
                // is the other object a locked door?
                //if ((other instanceof Door) && !other.locked) continue;
                // does the other object block pathfinding entity (e)
                if (!this.blocks(e, other)) continue;
                // otherwise... blocked
                blocked = true;
                break;
            }
            if (!blocked) yield nidx;
        }
    }

    getActions(e, last, baseCost, from, to) {
        let actions = [];
        //let facing = (tov.x > fromv.x) ? Direction.east : (tov.x < fromv.x) ? Direction.west : 0;
        let cost = this.charger(this, baseCost, from, to);

        /*
        // check for a door...
        let door = this.lvl.firstidx(to, (v) => v instanceof Door);
        if (door && door.state === 'close') {
            actions.push( new OpenAction({ points: e.pointsPerTurn, target: door }));
        }
        */


        // push move action
        let action = this.mover(this, to);

        console.log(`mover ${to} gives: ${action}`);

        /*
        let action = new MoveToAction({ 
            points: e.pointsPerTurn,
            x: tov.x, 
            y: tov.y, 
            snap: true, 
            update: { idx: to },
            facing: facing,
            sfx: e.moveSfx,
        });
        */

        //action.evt.listen(action.constructor.evtStarted, (evt) => this.lvl.reserveIdx(to), Events.once );
        //action.evt.listen(action.constructor.evtDone, (evt) => this.lvl.releaseIdx(to), Events.once );
        actions.push(action);
        //actions.push(new UpdateAction({ update: { idx: to }, points: 0}));
        return { 
            from: from, 
            cost: cost,
            actions: actions,
        };
    }
}