import { Bounds } from './bounds.js';
import { Hex } from './hex.js';
import { Mathf } from './math.js';
import { Segment } from './segment.js';
import { Tri } from './tri.js';
import { Vect } from './vect.js';

export { Contains, Overlaps, Intersect };

class Contains {

    static _segment(sp1x, sp1y, sp2x, sp2y, px, py, inclusive=true) {
        const cp = (py - sp1y) * (sp2x - sp1x) - (px - sp1x) * (sp2y - sp1y);
        if (!Mathf.approx(cp, 0)) return false;
        const sminx = (sp1x < sp2x) ? sp1x : sp2x;
        const smaxx = (sp1x > sp2x) ? sp1x : sp2x;
        const sminy = (sp1y < sp2y) ? sp1y : sp2y;
        const smaxy = (sp1y > sp2y) ? sp1y : sp2y;
        if (inclusive) {
            return (sminx <= px && px <= smaxx && sminy <= py && py <= smaxy);
        } else {
            return (sminx < px && px < smaxx && sminy < py && py < smaxy);
        }
    }
    static segment(s, p, inclusive=true) {
        if (!Segment.iSegment(s) || !Vect.iVect(p)) return false;
        return this._segment(s.p1.x, s.p1.y, s.p2.x, s.p2.y, p.x, p.y, inclusive);
    }

    static _tri(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y, px, py, inclusive=true) {
        const dX = px - tp3x;
        const dY = py - tp3y;
        const dX21 = tp3x - tp2x;
        const dY12 = tp2y - tp3y;
        const D = dY12 * (tp1x - tp3x) + dX21 * (tp1y - tp3y);
        const s = dY12 * dX + dX21 * dY;
        const t = (tp3y - tp1y) * dX + (tp1x - tp3x) * dY;
        if (inclusive) {
            if (D < 0) return s <= 0 && t <= 0 && s + t >= D;
            return s >= 0 && t >= 0 && s + t <= D;
        } else {
            if (D < 0) return s < 0 && t < 0 && s + t > D;
            return s > 0 && t > 0 && s + t < D;
        }
    }
    static tri(t, p, inclusive=true) {
        if (!Tri.iTri(t) || !Vect.iVect(p)) return false;
        return this._tri(t.p1.x, t.p1.y, t.p2.x, t.p2.y, t.p3.x, t.p3.y, p.x, p.y, inclusive);
    }

    static _bounds(bminx, bminy, bmaxx, bmaxy, px, py, inclusive=true) {
        if (inclusive) {
            return px >= bminx && px <= bmaxx &&
                py >= bminy && py <= bmaxy;
        } else {
            return px > bminx && px < bmaxx &&
                py > bminy && py < bmaxy;
        }
    }
    static bounds(b, p, inclusive=true) {
        if (!Bounds.iBounds(b) || !Vect.iVect(p)) return false;
        return this._bounds(
            b.minx, b.miny, b.maxx, b.maxy, 
            p.x, p.y, inclusive);
    }


    static _hex(hpx, hpy, hsize, px, py, inclusive=true) {
        const mid = Hex._mid(hpx, hpy, hsize);
        if (this._bounds(
            mid.minx, mid.miny, mid.maxx, mid.maxy, 
            px, py, inclusive)) return true;
        const top = Hex._top(hpx, hpy, hsize);
        if (this._tri(
            top.p1.x, top.p1.y, top.p2.x, top.p2.y, top.p3.x, top.p3.y, 
            px, py, inclusive)) return true;
        const bottom = Hex._bottom(hpx, hpy, hsize);
        if (this._tri(
            bottom.p1.x, bottom.p1.y, bottom.p2.x, bottom.p2.y, bottom.p3.x, bottom.p3.y, 
            px, py, inclusive)) return true;
        return false;
    }
    static hex(h, p, inclusive=true) {
        if (!Hex.iHex(h) || !Vect.iVect(p)) return false;
        return this._hex(
            h.p.x, h.p.y, h.size, 
            p.x, p.y, inclusive);
    }

}

class Overlaps {

    static _segments(s1p1x, s1p1y, s1p2x, s1p2y, s2p1x, s2p1y, s2p2x, s2p2y, inclusive=true) {
        // colinear test
        const m1 = Segment._slope(s1p1x, s1p1y, s1p2x, s1p2y);
        const m2 = Segment._slope(s2p1x, s2p1y, s2p2x, s2p2y);
        const b1 = Segment._intercept(s1p1x, s1p1y, s1p2x, s1p2y);
        const b2 = Segment._intercept(s2p1x, s2p1y, s2p2x, s2p2y);
        if (inclusive && Mathf.approx(m1, m2) && Mathf.approx(b1, b2)) {
            if (s1p1x >= s2p1x && s1p1x <= s2p2x && s1p1y >= s2p1y && s1p1y <= s2p2y) return true;
            if (s1p2x >= s2p1x && s1p2x <= s2p2x && s1p2y >= s2p1y && s1p2y <= s2p2y) return true;
            if (s2p1x >= s1p1x && s2p1x <= s1p2x && s2p1y >= s1p1y && s2p1y <= s1p2y) return true;
            if (s2p2x >= s1p1x && s2p2x <= s1p2x && s2p2y >= s1p1y && s2p2y <= s1p2y) return true;
        }
        const bx = s1p2x-s1p1x;
        const by = s1p2y-s1p1y;
        const dx = s2p2x-s2p1x;
        const dy = s2p2y-s2p1y;
        const bDotDPerp = bx * dy - by * dx;
        if (bDotDPerp == 0) return false;
        const cx = s2p1x-s1p1x;
        const cy = s2p1y-s1p1y;
        const t = (cx * dy - cy * dx) / bDotDPerp;
        if (inclusive) {
            if (t < 0 || t > 1) return false;
        } else {
            if (t <= 0 || t >= 1) return false;
        }
        const u = (cx * by - cy * bx) / bDotDPerp;
        if (inclusive) {
            if (u < 0 || u > 1) return false;
        } else {
            if (u <= 0 || u >= 1) return false;
        }
        //let intersection = Vect.add(s1.p1, Vect.smult(b, t));
        // intersection = Vector2.Sum(a1, Vector2.Multiply(b, t));
        return true;
    }
    static segments(s1, s2, inclusive=true) {
        if (!Segment.iSegment(s1) || !Segment.iSegment(s2)) return false;
        return this._segments(
            s1.p1.x, s1.p1.y, s1.p2.x, s1.p2.y, 
            s2.p1.x, s2.p1.y, s2.p2.x, s2.p2.y, inclusive);
    }

    static _tris( t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y, t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y, inclusive=true) {
        // check bounding box of tri vs given bounds
        const t1min = Tri._min(t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y);
        const t1max = Tri._max(t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y);
        const t2min = Tri._min(t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y);
        const t2max = Tri._max(t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y);
        if (!this._bounds(
            t1min.x, t1min.y, t1max.x, t1max.y, 
            t2min.x, t2min.y, t2max.x, t2max.y, inclusive)) return false;
        // check intersection of triangle edges
        if (this.segments( 
            Tri._edge1(t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y), 
            Tri._edge1(t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y), inclusive )) return true;
        if (this.segments( 
            Tri._edge1(t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y), 
            Tri._edge2(t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y), inclusive )) return true;
        if (this.segments( 
            Tri._edge1(t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y), 
            Tri._edge3(t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y), inclusive )) return true;
        if (this.segments( 
            Tri._edge2(t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y), 
            Tri._edge1(t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y), inclusive )) return true;
        if (this.segments( 
            Tri._edge2(t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y), 
            Tri._edge2(t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y), inclusive )) return true;
        if (this.segments( 
            Tri._edge2(t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y), 
            Tri._edge3(t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y), inclusive )) return true;
        if (this.segments( 
            Tri._edge3(t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y), 
            Tri._edge1(t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y), inclusive )) return true;
        if (this.segments( 
            Tri._edge3(t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y), 
            Tri._edge2(t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y), inclusive )) return true;
        if (this.segments( 
            Tri._edge3(t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y), 
            Tri._edge3(t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y), inclusive )) return true;
        // check if entirely within each other
        if (Contains._tri(
            t1p1x, t1p1y, t1p2x, t1p2y, t1p3x, t1p3y, 
            t2p1x, t2p1y, inclusive)) return true;
        if (Contains._tri(
            t2p1x, t2p1y, t2p2x, t2p2y, t2p3x, t2p3y, 
            t1p1x, t1p1y, inclusive)) return true;
        return false;
    }
    static tris(t1, t2, inclusive=true) {
        if (!Tri.iTri(t1) || !Tri.iTri(t2)) return false;
        return this._tris(
            t1.p1.x, t1.p1.y, t1.p2.x, t1.p2.y, t1.p3.x, t1.p3.y, 
            t2.p1.x, t2.p1.y, t2.p2.x, t2.p2.y, t2.p3.x, t2.p3.y, inclusive);
    }

    static _bounds(b1minx, b1miny, b1maxx, b1maxy, b2minx, b2miny, b2maxx, b2maxy, inclusive) {
        let minx = Math.max(b1minx, b2minx);
        let maxx = Math.min(b1maxx, b2maxx);
        let miny = Math.max(b1miny, b2miny);
        let maxy = Math.min(b1maxy, b2maxy);
        if (inclusive) {
            return maxx >= minx && maxy >= miny;
        } else {
            return maxx > minx && maxy > miny;
        }
    }
    static bounds(b1, b2, inclusive) {
        if (!Bounds.iBounds(b1) || !Bounds.iBounds(b2)) return false;
        return this._bounds(
            b1.minx, b1.miny, b1.maxx, b1.maxy, 
            b2.minx, b2.miny, b2.maxx, b2.maxy, inclusive);
    }

    static _triBounds( tp1x, tp1y, tp2x, tp2y, tp3x, tp3y, bminx, bminy, bmaxx, bmaxy, inclusive=true) {
        // check bounding box of tri vs given bounds
        let tb = Tri._bounds(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y);
        if (!this._bounds(
            bminx, bminy, bmaxx, bmaxy, 
            tb.minx, tb.miny, tb.maxx, tb.maxy, inclusive)) return false;
        // check if any point of the tri is within the bounds...
        if (Contains._bounds(
            bminx, bminy, bmaxx, bmaxy, 
            tp1x, tp1y, inclusive)) return true;
        if (Contains._bounds(
            bminx, bminy, bmaxx, bmaxy, 
            tp2x, tp2y, inclusive)) return true;
        if (Contains._bounds(
            bminx, bminy, bmaxx, bmaxy, 
            tp3x, tp3y, inclusive)) return true;
        // check edge intersections
        if (this.segments( 
            Tri._edge1(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y), 
            Bounds._edge1(bminx, bminy, bmaxx, bmaxy), inclusive )) return true;
        if (this.segments( 
            Tri._edge1(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y), 
            Bounds._edge2(bminx, bminy, bmaxx, bmaxy), inclusive )) return true;
        if (this.segments( 
            Tri._edge1(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y), 
            Bounds._edge3(bminx, bminy, bmaxx, bmaxy), inclusive )) return true;
        if (this.segments( 
            Tri._edge1(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y), 
            Bounds._edge4(bminx, bminy, bmaxx, bmaxy), inclusive )) return true;
        if (this.segments( 
            Tri._edge2(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y), 
            Bounds._edge1(bminx, bminy, bmaxx, bmaxy), inclusive )) return true;
        if (this.segments( 
            Tri._edge2(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y), 
            Bounds._edge2(bminx, bminy, bmaxx, bmaxy), inclusive )) return true;
        if (this.segments( 
            Tri._edge2(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y), 
            Bounds._edge3(bminx, bminy, bmaxx, bmaxy), inclusive )) return true;
        if (this.segments( 
            Tri._edge2(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y), 
            Bounds._edge4(bminx, bminy, bmaxx, bmaxy), inclusive )) return true;
        if (this.segments( 
            Tri._edge3(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y), 
            Bounds._edge1(bminx, bminy, bmaxx, bmaxy), inclusive )) return true;
        if (this.segments( 
            Tri._edge3(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y), 
            Bounds._edge2(bminx, bminy, bmaxx, bmaxy), inclusive )) return true;
        if (this.segments( 
            Tri._edge3(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y), 
            Bounds._edge3(bminx, bminy, bmaxx, bmaxy), inclusive )) return true;
        if (this.segments( 
            Tri._edge3(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y), 
            Bounds._edge4(bminx, bminy, bmaxx, bmaxy), inclusive )) return true;
        // finally check if bounds is entirely within triangle
        if (Contains._tri(
            tp1x, tp1y, tp2x, tp2y, tp3x, tp3y, 
            bminx, bminy, inclusive)) return true;
        return false;
    }
    static triBounds(t, b, inclusive=true) {
        if (!Tri.iTri(t) || !Bounds.iBounds(b)) return false;
        return this._triBounds(
            t.p1.x, t.p1.y, t.p2.x, t.p2.y, t.p3.x, t.p3.y, 
            b.minx, b.miny, b.maxx, b.maxy, inclusive);
    }

    static _hexs(h1px, h1py, h1size, h2px, h2py, h2size, inclusive=true) {
        const m1 = Hex._mid(h1px, h1py, h1size);
        const m2 = Hex._mid(h2px, h2py, h2size);
        if (this.bounds(m1, m2, inclusive)) return true;
        const t1 = Hex._top(h1px, h1py, h1size);
        const b1 = Hex._bottom(h1px, h1py, h1size);
        if (this.triBounds(t1, m2, inclusive)) return true;
        if (this.triBounds(b1, m2, inclusive)) return true;
        const t2 = Hex._top(h2px, h2py, h2size);
        const b2 = Hex._bottom(h2px, h2py, h2size);
        if (this.triBounds(t2, m1, inclusive)) return true;
        if (this.triBounds(b2, m1, inclusive)) return true;
        if (this.tris(t1, b2, inclusive)) return true;
        if (this.tris(t2, b1, inclusive)) return true;
        return false;
    }
    static hexs(h1, h2, inclusive=true) {
        if (!Hex.iHex(h1) || !Hex.iHex(h2)) return false;
        return this._hexs(
            h1.p.x, h1.p.y, h1.size, 
            h2.p.x, h2.p.y, h2.size, inclusive);
    }

    static _hexBounds(hpx, hpy, hsize, bminx, bminy, bmaxx, bmaxy, inclusive=true) {
        const hb = Hex._bounds(hpx, hpy, hsize);
        // check bounding box of hex vs given bounds
        if (!this._bounds(
            bminx, bminy, bmaxx, bmaxy, 
            hb.minx, hb.miny, hb.maxx, hb.maxy, inclusive)) return false;
        // check hex mid vs. bounds
        let hm = Hex._mid(hpx, hpy, hsize);
        if (this._bounds(
            bminx, bminy, bmaxx, bmaxy, 
            hm.minx, hm.miny, hm.maxx, hm.maxy, inclusive)) return true;
        // check hex top/bottom vs. bounds
        let top = Hex._top(hpx, hpy, hsize);
        if (this._triBounds(
            top.p1.x, top.p1.y, top.p2.x, top.p2.y, top.p3.x, top.p3.y, 
            bminx, bminy, bmaxx, bmaxy, inclusive)) return true;
        let btm = Hex._bottom(hpx, hpy, hsize);
        if (this._triBounds(
            btm.p1.x, btm.p1.y, btm.p2.x, btm.p2.y, btm.p3.x, btm.p3.y, 
            bminx, bminy, bmaxx, bmaxy, inclusive)) return true;
        return false;
    }
    static hexBounds(h, b, inclusive=true) {
        if (!Hex.iHex(h) || !Bounds.iBounds(b)) return false;
        return this._hexBounds(
            h.p.x, h.p.y, h.size, 
            b.minx, b.miny, b.maxx, b.maxy);
    }

    static _hexTri(hpx, hpy, hsize, tp1x, tp1y, tp2x, tp2y, tp3x, tp3y, inclusive=true) {
        // check bounding box of hex vs tri
        let hb = Hex._bounds(hpx, hpy, hsize);
        let tb = Tri._bounds(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y);
        if (!this.bounds(tb, hb, inclusive)) return false;
        // check hex mid vs. tri
        let hm = Hex._mid(hpx, hpy, hsize);
        if (this._triBounds(tp1x, tp1y, tp2x, tp2y, tp3x, tp3y, hm.minx, hm.miny, hm.maxx, hm.maxy, inclusive)) return true;
        // check hex top/bottom vs. tri
        let top = Hex._top(hpx, hpy, hsize);
        if (this._tris(
            tp1x, tp1y, tp2x, tp2y, tp3x, tp3y,
            top.p1.x, top.p1.x, top.p2.x, top.p2.y, top.p3.x, top.p3.y,
            inclusive)) return true;
        let btm = Hex._bottom(hpx, hpy, hsize);
        if (this._tris(
            tp1x, tp1y, tp2x, tp2y, tp3x, tp3y,
            btm.p1.x, btm.p1.x, btm.p2.x, btm.p2.y, btm.p3.x, btm.p3.y,
            inclusive)) return true;
        return false;
    }
    static hexTri(h, t, inclusive=true) {
        if (!Hex.iHex(h) || !Tri.iTri(t)) return false;
        return this._hexTri(
            h.p.x, h.p.y, h.size,
            t.p1.x, t.p1.y, t.p2.x, t.p2.y, t.p3.x, t.p3.y,
            inclusive,
        );
    }

}

// FIXME
class Intersect {

    static tris(tri1, tri2) {
    }

    static bounds(b1, b2) {
    }

    static triBounds(tri, bounds) {
    }
}