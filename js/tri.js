export { Tri };

import { Fmt } from './fmt.js';
import { Gadget } from './gizmo.js';

class Tri extends Gadget {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('p1', { dflt: () => { return {x:0, y:0}; }});
        this.schema('p2', { dflt: () => { return {x:0, y:0}; }});
        this.schema('p3', { dflt: () => { return {x:0, y:0}; }});
    }

    static iTri(obj) {
        return obj && ('p1' in obj) && ('p2' in obj) && ('p3' in obj);
    }

    static _edge1(p1x, p1y, p2x, p2y, p3x, p3y) {
        return { 
            p1: {x:p1x, y:p1y},
            p2: {x:p2x, y:p2y},
        };
    }
    static edge1(t) {
        if (!t) return null;
        return this._edge1(t.p1.x, t.p1.y, t.p2.x, t.p2.y, t.p3.x, t.p3.y);
    }

    static _edge2(p1x, p1y, p2x, p2y, p3x, p3y) {
        return { 
            p1: {x:p2x, y:p2y},
            p2: {x:p3x, y:p3y},
        };
    }
    static edge2(t) {
        if (!t) return null;
        return this._edge2(t.p1.x, t.p1.y, t.p2.x, t.p2.y, t.p3.x, t.p3.y);
    }

    static _edge3(p1x, p1y, p2x, p2y, p3x, p3y) {
        return { 
            p1: {x:p3x, y:p3y},
            p2: {x:p1x, y:p1y},
        };
    }
    static edge3(t) {
        if (!t) return null;
        return this._edge3(t.p1.x, t.p1.y, t.p2.x, t.p2.y, t.p3.x, t.p3.y);
    }

    static _min(p1x, p1y, p2x, p2y, p3x, p3y) {
        return {
            x: Math.min(p1x, p2x, p3x),
            y: Math.min(p1y, p2y, p3y),
        }
    }
    static min(t) {
        if (!t) return null;
        return this._min(t.p1.x, t.p1.y, t.p2.x, t.p2.y, t.p3.x, t.p3.y);
    }

    static _max(p1x, p1y, p2x, p2y, p3x, p3y) {
        return {
            x: Math.max(p1x, p2x, p3x),
            y: Math.max(p1y, p2y, p3y),
        }
    }
    static max(t) {
        if (!t) return null;
        return this._max(t.p1.x, t.p1.y, t.p2.x, t.p2.y, t.p3.x, t.p3.y);
    }

    static _bounds(p1x, p1y, p2x, p2y, p3x, p3y) {
        return {
            minx: Math.min(p1x, p2x, p3x),
            miny: Math.min(p1y, p2y, p3y),
            maxx: Math.max(p1x, p2x, p3x),
            maxy: Math.max(p1y, p2y, p3y),
        };
    }
    static bounds(t) {
        if (!t) return null;
        return this._bounds(t.p1.x, t.p1.y, t.p2.x, t.p2.y, t.p3.x, t.p3.y);
    }

    get edge1() {
        return this.constructor.edge1(this);
    }
    get edge2() {
        return this.constructor.edge2(this);
    }
    get edge3() {
        return this.constructor.edge3(this);
    }
    get bounds() {
        return this.constructor.bounds(this);
    }
    get min() {
        return this.constructor.min(this);
    }
    get max() {
        return this.constructor.max(this);
    }

    toString() {
        return Fmt.toString(this.constructor.name, 
            (this.p1) ? `${this.p1.x},${this.p1.y}` : this.p1, 
            (this.p2) ? `${this.p2.x},${this.p2.y}` : this.p2, 
            (this.p3) ? `${this.p3.x},${this.p3.y}` : this.p3);
    }

}
