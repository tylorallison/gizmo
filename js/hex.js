export { Hex };

import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';

class Hex extends GizmoData {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema(this, 'p', { dflter: () => { return {x:0,y:0}; }});
        this.schema(this, 'size', { dflt: 32 });
    }

    static iHex(obj) {
        return obj && ('p' in obj) && ('size' in obj);
    }

    static _top(px, py, size) {
        const half = size*.5;
        const qtr = size*.25;
        return {
            p1: {x:px-half, y:py-qtr}, 
            p2: {x:px, y:py-half}, 
            p3: {x:px+half, y:py-qtr},
        };
    }
    static top(h) {
        if (!h) return null;
        return this._top(h.p.x, h.p.y, h.size);
    }

    static _mid(px, py, size) {
        const half = size*.5;
        const qtr = size*.25;
        return {
            minx: px-half, 
            miny: py-qtr, 
            maxx: px+half, 
            maxy: py+qtr
        };
    }

    static mid(h) {
        if (!h) return null;
        return this._mid(h.p.x, h.p.y, h.size);
    }

    static _bottom(px, py, size) {
        const half = size*.5;
        const qtr = size*.25;
        return {
            p1: {x:px+half, y:py+qtr}, 
            p2: {x:px, y:py+half}, 
            p3: {x:px-half, y:py+qtr},
        };
    }

    static bottom(h) {
        if (!h) return null;
        return this._bottom(h.p.x, h.p.y, h.size);
    }

    static _bounds(px, py, size) {
        const half = size*.5;
        return {
            minx: px-half, 
            miny: py-half, 
            maxx: px+half, 
            maxy: py+half, 
        };
    }
    static bounds(h) {
        if (!h) return null;
        return this._bounds(h.p.x, h.p.y, h.size);
    }

    get top() {
        return this.constructor.top(this);
    }

    get mid() {
        return this.constructor.mid(this);
    }

    get bottom() {
        return this.constructor.bottom(this);
    }

    get bounds() {
        return this.constructor.bounds(this);
    }

    toString() {
        return Fmt.toString(this.constructor.name, 
            (this.p) ? `${this.p.x},${this.p.y}` : this.p, 
            this.size);
    }
}