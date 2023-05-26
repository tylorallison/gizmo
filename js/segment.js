export { Segment };

import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';
import { Vect } from './vect.js';

class Segment extends GizmoData {

    static slope(s) {
        if (!s || !s.p1 || !s.p2) return undefined;
        return (s.p2.y - s.p1.y)/(s.p2.x-s.p1.x);
    }

    static intercept(s) {
        if (!s || !s.p1) return undefined;
        let m = this.slope(s);
        return (s.p1.y-m*s.p1.x);
    }

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema(this, 'p1', { dflter: () => Vect.zero });
        this.schema(this, 'p2', { dflter: () => Vect.zero });
        this.schema(this, 'min', { autogen: (k) => k === 'p1' || k === 'p2', generator: (o, v) => (Vect.min(o.p1, o.p2))});
        this.schema(this, 'max', { autogen: (k) => k === 'p1' || k === 'p2', generator: (o, v) => (Vect.max(o.p1, o.p2))});
        // slope dy/dx
        this.schema(this, 'm', { autogen: (k) => k === 'p1' || k === 'p2', generator: (o, v) => (o.p1 && o.p2) ? (o.p2.y - o.p1.y)/(o.p2.x-o.p1.x) : undefined});
        // y intercept y = mx + b
        this.schema(this, 'b', { autogen: (k) => k === 'p1' || k === 'p2', generator: (o, v) => (o.p1) ? (o.p1.y-o.m*o.p1.x): null});
    }

    static iSegment(obj) {
        return obj && ('p1' in obj) && ('p2' in obj);
    }

    toString() {
        return Fmt.toString(this.constructor.name, 
            (this.p1) ? `${this.p1.x},${this.p1.y}` : this.p1, 
            (this.p2) ? `${this.p2.x},${this.p2.y}` : this.p2);
    }

}