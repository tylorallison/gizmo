export { GridGraph };

import { Direction } from './direction.js';
import { Fmt } from './fmt.js';
import { Gadget } from './gizmo.js';
import { MoveToAction } from './move.js';
import { UiGrid } from './uiGrid.js';
import { Vect } from './vect.js';

class GridGraph extends Gadget {
    static dfltSpeed = .1;
    static {
        this.schema('grid', { readonly: true, parser: (o,x) => x.grid || new UiGrid()});
        this.schema('charger', { readonly: true, parser: (o,x) => x.charger || ((graph, base, e, from, to) => {
            let fromv = graph.grid.pointFromIdx(from, true);
            let tov = graph.grid.pointFromIdx(to, true);
            return base + Math.round(Vect.dist(fromv, tov)); 
        })});
        this.schema('blocker', { readonly: true, parser: (o,x) => x.blocker || ((graph, e, to) => {
            for (const other of graph.grid.findForIdx(to, (gzo) => gzo !== e)) {
                if (('blockedBy' in e) && ('blocks' in other)) {
                    if (e.blockedBy & other.blocks) return true;
                }
            }
            return false;
        })});
        this.schema('mover', { readonly: true, parser: (o,x) => x.mover || ((graph, first, last, e, to) => {
            let targetLoc = graph.grid.pointFromIdx(to, true);
            // FIXME: this isn't correct for all 
            targetLoc.x -= graph.grid.xform.minx;
            targetLoc.y -= graph.grid.xform.miny;

            let speed = e.speed || this.dfltSpeed;
            let accel = speed/10;

            return [new MoveToAction({ 
                target: targetLoc,
                speed: speed,
                currentSpeed: (first) ? 0 : speed,
                accel: accel,
                snap: true, 
                chained: !last,
            })];
        })});
    }

    heuristic(v1, v2) {
        let v1v = this.grid.pointFromIdx(v1, true);
        let v2v = this.grid.pointFromIdx(v2, true);
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
        let allowedDirs = 0;
        for (const dir of Direction.cardinals) {
            let nidx = this.grid.idxFromDir(node, dir);
            if (nidx < 0) continue;
            // is path blocked to given neighbor index
            let blocked = this.blocker(this, e, nidx);
            if (!blocked) {
                allowedDirs |= dir;
                yield nidx;
            }
        }
        for (const dir of Direction.diagonals) {
            let nidx = this.grid.idxFromDir(node, dir);
            if (nidx < 0) continue;
            // check adjacent cardinals to see if they are blocked
            let cardinalsAllowed = Direction.adjacent(dir).reduce((pv, cv) => pv&((cv&allowedDirs) === cv), true);
            if (!cardinalsAllowed) continue;
            // is path blocked to given neighbor index
            let blocked = this.blocker(this, e, nidx);
            if (!blocked) {
                allowedDirs |= dir;
                yield nidx;
            }
        }
    }

    getActions(e, last, baseCost, from, to) {
        // calculate cost
        let cost = this.charger(this, baseCost, e, from, to);
        // determine actions
        let first = (baseCost === 0);
        let actions = this.mover(this, first, last, e, to);
        return { 
            from: from, 
            cost: cost,
            actions: actions,
        };
    }
}
