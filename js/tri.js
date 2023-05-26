export { Tri };

import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';
import { Segment } from './segment.js';
import { Vect } from './vect.js';

class Tri extends GizmoData {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema(this, 'p1', { dflter: () => Vect.zero });
        this.schema(this, 'p2', { dflter: () => Vect.zero });
        this.schema(this, 'p3', { dflter: () => Vect.zero });
        this.schema(this, 'min', { autogen: (k) => k === 'p1' || k === 'p2' || k === 'p3', generator: (o, v) => (Vect.min(o.p1, o.p2, o.p3))});
        this.schema(this, 'max', { autogen: (k) => k === 'p1' || k === 'p2' || k === 'p3', generator: (o, v) => (Vect.max(o.p1, o.p2, o.p3))});
    }

    static iTri(obj) {
        return obj && ('p1' in obj) && ('p2' in obj) && ('p3' in obj);
    }

    //function ptInTriangle(p, p0, p1, p2) {

    get edge1() {
        return new Segment({ p1: this.p1, p2: this.p2 });
    }
    get edge2() {
        return new Segment({ p1: this.p2, p2: this.p3 });
    }
    get edge3() {
        return new Segment({ p1: this.p3, p2: this.p1 });
    }

    contains(p) {
        var dX = p.x - this.p3.x;
        var dY = p.y - this.p3.y;
        var dX21 = this.p3.x - this.p2.x;
        var dY12 = this.p2.y - this.p3.y;
        var D = dY12 * (this.p1.x - this.p3.x) + dX21 * (this.p1.y - this.p3.y);
        var s = dY12 * dX + dX21 * dY;
        var t = (this.p3.y - this.p1.y) * dX + (this.p1.x - this.p3.x) * dY;
        if (D < 0) return s <= 0 && t <= 0 && s + t >= D;
        return s >= 0 && t >= 0 && s + t <= D;
    }

    toString() {
        return Fmt.toString(this.constructor.name, 
            (this.p1) ? `${this.p1.x},${this.p1.y}` : this.p1, 
            (this.p2) ? `${this.p2.x},${this.p2.y}` : this.p2, 
            (this.p3) ? `${this.p3.x},${this.p3.y}` : this.p3);
    }

}