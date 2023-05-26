import { Bounds } from './bounds.js';
import { Mathf } from './math.js';
import { Segment } from './segment.js';
import { Tri } from './tri.js';
import { Vect } from './vect.js';

export { Contains, Overlaps, Intersect };

class Contains {
    static segment(s, p, inclusive=true) {
        // colinear test
        let cp = (p.y - s.p1.y) * (s.p2.x - s.p1.x) - (p.x - s.p1.x) * (s.p2.y - s.p1.y)
        if (!Mathf.approx(cp, 0)) return false;
        let smin = ('min' in s) ? s.min : Vect.min(s.p1, s.p2);
        let smax = ('max' in s) ? s.max : Vect.max(s.p1, s.p2);
        if (inclusive) {
            return (smin.x <= p.x && p.x <= smax.x && smin.y <= p.y && p.y <= smax.y);
        } else {
            return (smin.x < p.x && p.x < smax.x && smin.y < p.y && p.y < smax.y);
        }
    }

    static tri(t, p, inclusive=true) {
        if (!Tri.iTri(t) || !Vect.iVect(p)) return false;
        var dX = p.x - t.p3.x;
        var dY = p.y - t.p3.y;
        var dX21 = t.p3.x - t.p2.x;
        var dY12 = t.p2.y - t.p3.y;
        var D = dY12 * (t.p1.x - t.p3.x) + dX21 * (t.p1.y - t.p3.y);
        var s = dY12 * dX + dX21 * dY;
        var t = (t.p3.y - t.p1.y) * dX + (t.p1.x - t.p3.x) * dY;
        if (inclusive) {
            if (D < 0) return s <= 0 && t <= 0 && s + t >= D;
            return s >= 0 && t >= 0 && s + t <= D;
        } else {
            if (D < 0) return s < 0 && t < 0 && s + t > D;
            return s > 0 && t > 0 && s + t < D;
        }
    }

    static bounds(b, p, inclusive=true) {
        if (!Bounds.iBounds(b) || !Vect.iVect(p)) return false;
        if (inclusive) {
            return p.x >= b.minx && p.x <= b.maxx &&
                p.y >= b.miny && p.y <= b.maxy;
        } else {
            return p.x > b.minx && p.x < b.maxx &&
                p.y > b.miny && p.y < b.maxy;
        }
    }
}

class Overlaps {
    static segments(s1, s2, inclusive=true) {
        if (!Segment.iSegment(s1) || !Segment.iSegment(s2)) return false;
        // colinear test
        let m1 = ('m' in s1) ? s1.m : Segment.slope(s1);
        let m2 = ('m' in s2) ? s2.m : Segment.slope(s2);
        let b1 = ('b' in s1) ? s1.b : Segment.intercept(s1);
        let b2 = ('b' in s2) ? s2.b : Segment.intercept(s2);
        if (inclusive && Mathf.approx(m1, m2) && Mathf.approx(b1, b2)) {
            if (s1.p1.x >= s2.p1.x && s1.p1.x <= s2.p2.x && s1.p1.y >= s2.p1.y && s1.p1.y <= s2.p2.y) return true;
            if (s1.p2.x >= s2.p1.x && s1.p2.x <= s2.p2.x && s1.p2.y >= s2.p1.y && s1.p2.y <= s2.p2.y) return true;
            if (s2.p1.x >= s1.p1.x && s2.p1.x <= s1.p2.x && s2.p1.y >= s1.p1.y && s2.p1.y <= s1.p2.y) return true;
            if (s2.p2.x >= s1.p1.x && s2.p2.x <= s1.p2.x && s2.p2.y >= s1.p1.y && s2.p2.y <= s1.p2.y) return true;
        }
        let b = Vect.sub(s1.p2, s1.p1);
        let d = Vect.sub(s2.p2, s2.p1);
        let bDotDPerp = b.x * d.y - b.y * d.x;
        if (bDotDPerp == 0) return false;
        let c = Vect.sub(s2.p1, s1.p1);
        let t = (c.x * d.y - c.y * d.x) / bDotDPerp;
        if (inclusive) {
            if (t < 0 || t > 1) return false;
        } else {
            if (t <= 0 || t >= 1) return false;
        }
        let u = (c.x * b.y - c.y * b.x) / bDotDPerp;
        if (inclusive) {
            if (u < 0 || u > 1) return false;
        } else {
            if (u <= 0 || u >= 1) return false;
        }
        //let intersection = Vect.add(s1.p1, Vect.smult(b, t));
        // intersection = Vector2.Sum(a1, Vector2.Multiply(b, t));
        return true;
    }

    static tris(tri1, tri2, inclusive=true) {
        if (!Tri.iTri(tri1) || !Tri.iTri(tri2)) return false;
        // check bounding box of tri vs given bounds
        let t1min = ('min' in tri1) ? tri1.min : Vect.min(tri1.p1, tri1.p2, tri1.p3);
        let t1max = ('max' in tri1) ? tri1.max : Vect.max(tri1.p1, tri1.p2, tri1.p3);
        let t2min = ('min' in tri2) ? tri2.min : Vect.min(tri2.p1, tri2.p2, tri2.p3);
        let t2max = ('max' in tri2) ? tri2.max : Vect.max(tri2.p1, tri2.p2, tri2.p3);
        if (!this.bounds(Bounds.fromMinMax(t1min.x, t1min.y, t1max.x, t1max.y), Bounds.fromMinMax(t2min.x, t2min.y, t2max.x, t2max.y), inclusive)) return false;
        // check intersection of triangle edges
        if (this.segments( tri1.edge1, tri2.edge1, inclusive )) return true;
        if (this.segments( tri1.edge1, tri2.edge2, inclusive )) return true;
        if (this.segments( tri1.edge1, tri2.edge3, inclusive )) return true;
        if (this.segments( tri1.edge2, tri2.edge1, inclusive )) return true;
        if (this.segments( tri1.edge2, tri2.edge2, inclusive )) return true;
        if (this.segments( tri1.edge2, tri2.edge3, inclusive )) return true;
        if (this.segments( tri1.edge3, tri2.edge1, inclusive )) return true;
        if (this.segments( tri1.edge3, tri2.edge2, inclusive )) return true;
        if (this.segments( tri1.edge3, tri2.edge3, inclusive )) return true;
        // check if entirely within each other
        if (Contains.tri(tri1, tri2.p1, inclusive)) return true;
        if (Contains.tri(tri2, tri1.p1, inclusive)) return true;
        return false;
    }

    static bounds(b1, b2, inclusive) {
        if (!Bounds.iBounds(b1) || !Bounds.iBounds(b2)) return false;
        let minx = Math.max(b1.minx, b2.minx);
        let maxx = Math.min(b1.maxx, b2.maxx);
        let miny = Math.max(b1.miny, b2.miny);
        let maxy = Math.min(b1.maxy, b2.maxy);
        if (inclusive) {
            return maxx >= minx && maxy >= miny;
        } else {
            return maxx > minx && maxy > miny;
        }
    }

    static triBounds(tri, b, inclusive=true) {
        if (!Tri.iTri(tri) || !Bounds.iBounds(b)) return false;
        // check bounding box of tri vs given bounds
        let tmin = ('min' in tri) ? tri.min : Vect.min(tri.p1, tri.p2, tri.p3);
        let tmax = ('max' in tri) ? tri.max : Vect.max(tri.p1, tri.p2, tri.p3);
        if (!this.bounds(b, Bounds.fromMinMax(tmin.x, tmin.y, tmax.x, tmax.y), inclusive)) return false;
        // check if any point of the tri is within the bounds...
        if (Contains.bounds(b, tri.p1, inclusive)) return true;
        if (Contains.bounds(b, tri.p2, inclusive)) return true;
        if (Contains.bounds(b, tri.p3, inclusive)) return true;
        // check edge intersections
        if (this.segments(tri.edge1, b.edge1, inclusive)) return true;
        if (this.segments(tri.edge1, b.edge2, inclusive)) return true;
        if (this.segments(tri.edge1, b.edge3, inclusive)) return true;
        if (this.segments(tri.edge1, b.edge4, inclusive)) return true;
        if (this.segments(tri.edge2, b.edge1, inclusive)) return true;
        if (this.segments(tri.edge2, b.edge2, inclusive)) return true;
        if (this.segments(tri.edge2, b.edge3, inclusive)) return true;
        if (this.segments(tri.edge2, b.edge4, inclusive)) return true;
        if (this.segments(tri.edge3, b.edge1, inclusive)) return true;
        if (this.segments(tri.edge3, b.edge2, inclusive)) return true;
        if (this.segments(tri.edge3, b.edge3, inclusive)) return true;
        if (this.segments(tri.edge3, b.edge4, inclusive)) return true;
        // finally check if bounds is entirely within triangle
        if (Contains.tri(tri, b.min, inclusive)) return true;
        return false;
    }

}

class Intersect {

    static tris(tri1, tri2) {
    }

    static bounds(b1, b2) {
    }

    static triBounds(tri, bounds) {
    }
}