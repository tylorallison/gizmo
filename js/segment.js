export { Segment };

import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';

class Segment extends GizmoData {

    static _slope(p1x, p1y, p2x, p2y) {
        return (p2y - p1y)/(p2x-p1x);
    }
    static slope(s) {
        if (!s) return undefined;
        return this._slope(s.p1.x, s.p1.y, s.p2.x, s.p2.y);
    }

    static _intercept(p1x, p1y, p2x, p2y) {
        const m = this._slope(p1x, p1y, p2x, p2y);
        return (p1y-m*p1x);
    }
    static intercept(s) {
        if (!s) return undefined;
        return this._intercept(s.p1.x, s.p1.y, s.p2.x, s.p2.y);
    }

    static _min(p1x, p1y, p2x, p2y) {
        return {
            x: (p1x < p2x) ? p1x : p2x,
            y: (p1y < p2y) ? p1y : p2y,
        }
    }
    static min(s) {
        if (!s) return null;
        return this._min(s.p1.x, s.p1.y, s.p2.x, s.p2.y);
    }

    static _max(p1x, p1y, p2x, p2y) {
        return {
            x: (p1x > p2x) ? p1x : p2x,
            y: (p1y > p2y) ? p1y : p2y,
        }
    }
    static max(s) {
        if (!s) return null;
        return this._max(s.p1.x, s.p1.y, s.p2.x, s.p2.y);
    }

    static _bounds(p1x, p1y, p2x, p2y) {
        return {
            minx: Math.min(p1x, p2x),
            miny: Math.min(p1y, p2y),
            maxx: Math.max(p1x, p2x),
            maxy: Math.max(p1y, p2y),
        };
    }
    static bounds(s) {
        if (!s) return null;
        return this._bounds(t.p1.x, t.p1.y, t.p2.x, t.p2.y);
    }

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema(this, 'p1', { dflter: () => { return { x:0, y:0 }; }});
        this.schema(this, 'p2', { dflter: () => { return { x:0, y:0 }; }});
    }

    static iSegment(obj) {
        return obj && ('p1' in obj) && ('p2' in obj);
    }

    get min() {
        return this.constructor.min(this);
    }
    get max() {
        return this.constructor.max(this);
    }
    get slope() {
        return this.constructor.slope(this);
    }
    get intercept() {
        return this.constructor.intercept(this);
    }
    get bounds() {
        return this.constructor.bounds(this);
    }

    toString() {
        return Fmt.toString(this.constructor.name, 
            (this.p1) ? `${this.p1.x},${this.p1.y}` : this.p1, 
            (this.p2) ? `${this.p2.x},${this.p2.y}` : this.p2);
    }

}