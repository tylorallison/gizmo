export { Hex };

import { Bounds } from './bounds.js';
import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';
import { Tri } from './tri.js';
import { Vect } from './vect.js';

class Hex extends GizmoData {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema(this, 'p', { dflter: () => Vect.zero });
        this.schema(this, 'size', { dflt: 32 });
    }

    static iHex(obj) {
        return obj && ('p' in obj) && ('size' in obj);
    }

    static top(h) {
        if (!h) return null;
        let size = h.size || 0;
        let p = h.p || Vect.zero;
        let half = size*.5;
        let qtr = size*.25;
        return new Tri({p1: new Vect({x:p.x-half, y:p.y-qtr}), p2: new Vect({x:p.x, y:p.y-half}), p3: new Vect({x:p.x+half, y:p.y-qtr})});
    }

    static mid(h) {
        if (!h) return null;
        let size = h.size || 0;
        let p = h.p || Vect.zero;
        let half = size*.5;
        let qtr = size*.25;
        return new Bounds({x:p.x-half, y:p.y-qtr, width:size, height:half});
    }

    static bottom(h) {
        if (!h) return null;
        let size = h.size || 0;
        let p = h.p || Vect.zero;
        let half = size*.5;
        let qtr = size*.25;
        return new Tri({p1: new Vect({x:p.x+half, y:p.y+qtr}), p2: new Vect({x:p.x, y:p.y+half}), p3: new Vect({x:p.x-half, y:p.y+qtr})});
    }

    static bounds(h) {
        if (!h) return null;
        let size = h.size || 0;
        let p = h.p || Vect.zero;
        let half = size*.5;
        return new Bounds({x: p-half, y: p.y-half, width: size, height: size});
    }

    get top() {
        let half = this.size*.5;
        let qtr = this.size*.25;
        return new Tri({p1: new Vect({x:this.p.x-half, y:this.p.y-qtr}), p2: new Vect({x:this.p.x, y:this.p.y-half}), p3: new Vect({x:this.p.x+half, y:this.p.y-qtr})});
    }

    get mid() {
        let half = this.size*.5;
        let qtr = this.size*.25;
        return new Bounds({x:this.p.x-half, y:this.p.y-qtr, width:size, height:half});
    }

    get bottom() {
        let half = this.size*.5;
        let qtr = this.size*.25;
        return new Tri({p1: new Vect({x:this.p.x+half, y:this.p.y+qtr}), p2: new Vect({x:this.p.x, y:this.p.y+half}), p3: new Vect({x:this.p.x-half, y:this.p.y+qtr})});
    }

    get bounds() {
        let half = this.size*.5;
        return new Bounds({x: this.p-half, y: this.p.y-half, width: this.size, height: this.size});
    }

    /*
    get edge1() {
        return new Segment({ p1: this.p1, p2: this.p2 });
    }
    get edge2() {
        return new Segment({ p1: this.p2, p2: this.p3 });
    }
    get edge3() {
        return new Segment({ p1: this.p3, p2: this.p1 });
    }
    */

    toString() {
        return Fmt.toString(this.constructor.name, 
            (this.p) ? `${this.p.x},${this.p.y}` : this.p, 
            this.size);
    }
}