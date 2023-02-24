export { GridGraph };

import { Direction } from './direction.js';
import { GizmoData } from './gizmoData.js';
import { MoveToAction } from './move.js';
import { Schema } from './schema.js';
import { UiGrid } from './uiGrid.js';
import { Vect } from './vect.js';

class GridGraph extends GizmoData {
    static dfltSpeed = .1;
    static {
        Schema.apply(this, 'grid', { eventable: false, readonly: true, parser: (o,x) => x.grid || new UiGrid()});
        Schema.apply(this, 'charger', { eventable: false, readonly: true, parser: (o,x) => x.charger || ((graph, base, e, from, to) => {
            let fromv = graph.grid.vfromidx(from, true);
            let tov = graph.grid.vfromidx(to, true);
            return base + Math.round(Vect.dist(fromv, tov)); 
        })});
        Schema.apply(this, 'blocker', { eventable: false, readonly: true, parser: (o,x) => x.blocker || ((graph, e, to) => {
            for (const other of graph.grid.findAtIdx(to, (gzo) => gzo !== e)) {
                if (e.hasOwnProperty('blockedBy') && other.hasOwnProperty('blocks')) {
                    if (e.blockedBy & other.blocks) return true;
                }
            }
            return false;
        })});
        Schema.apply(this, 'mover', { eventable: false, readonly: true, parser: (o,x) => x.mover || ((graph, last, e, to) => {
            let targetLoc = graph.grid.vfromidx(to, true);
            return [new MoveToAction({ 
                target: targetLoc,
                targetSpeed: e.hasOwnProperty('speed') ? e.speed : this.dfltSpeed,
                snap: true, 
                chain: !last,
            })];
        })});
    }

    heuristic(v1, v2) {
        let v1v = this.grid.vfromidx(v1, true);
        let v2v = this.grid.vfromidx(v2, true);
        return Math.round(Vect.dist(v1v, v2v)); 
    }
    equals(v1, v2) {
        return v1 === v2;
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
            // is path blocked to given neighbor index
            let blocked = this.blocker(this, e, nidx);
            if (!blocked) yield nidx;
        }
    }

    getActions(e, last, baseCost, from, to) {
        // calculate cost
        let cost = this.charger(this, baseCost, e, from, to);
        // determine actions
        let actions = this.mover(this, last, e, to);
        return { 
            from: from, 
            cost: cost,
            actions: actions,
        };
    }
}