export { Grid };

import { GridBucketArray } from './gridArray.js';
import { Bounds } from './bounds.js';
import { Fmt } from './fmt.js';
import { Contains, Overlaps } from './intersect.js';
import { Util } from './util.js';


/** ========================================================================
 * A grid-based object (gizmo) storage bucket which allows for quick lookups of game elements based on location.
 */

class Grid extends GridBucketArray {
    static dfltCols = 8;
    static dfltRows = 8;

    static {
        this.schema('bounder', { readonly: true, parser: (o,x) => ((x.bounder) ? x.bounder : ((v) => v.xform) )});
        //this.schema(this, 'bounds', { readonly: true, parser: (o,x) => x.bounds || Bounds.zero });
        this.schema('dbg', { eventable: false, dflt: false });
        this.schema('rowSize', { readonly: true, dflt: 32 });
        this.schema('colSize', { readonly: true, dflt: 32 });
    }

    constructor(spec={}) {
        if ('size' in spec) {
            if (!('rowSize' in spec)) spec.rowSize = spec.size;
            if (!('colSize' in spec)) spec.colSize = spec.size;
        }
        super(spec);
        this.gridSort = spec.gridSort;
        this.gzoIdxMap = new Map();
    }

    // STATIC METHODS ------------------------------------------------------
    static _ijFromPoint(px, py, dimx, dimy, sizex, sizey) {
        let i = Math.floor(px/sizex);
        if (i < 0 || i > dimx) i = -1;
        let j = Math.floor(py/sizey);
        if (j < 0 || j > dimy) j = -1;
        return {x:i, y:j};
    }
    static ijFromPoint(p, dim, size) {
        if (!p || !dim || !size) return { x:-1, y:-1 };
        return this._ijFromPoint(p.x, p.y, dim.x, dim.y, size.x, size.y);
    }

    static _pointFromIJ(i, j, dimx, dimy, sizex, sizey, center=false) {
        if (i<0 || i>=dimx || j<0 || j>=dimy) return {x:-1, y:-1}
        let x = (i * sizex) + ((center) ? sizex*.5 : 0);
        let y = (j * sizey) + ((center) ? sizey*.5 : 0);
        return {x:x, y:y};
    }
    static pointFromIJ(ij, dim, size, center=false) {
        if (!ij || !dim || !size) return { x:-1, y:-1 };
        return this._pointFromIJ(ij.x, ij.y, dim.x, dim.y, size.x, size.y, center);
    }

    static _pointFromIdx(idx, dimx, dimy, sizex, sizey, center=false) {
        if (idx<0 || idx>(dimx*dimy)) return { x:-1, y:-1 };
        let x = ((idx % dimx) * sizex) + ((center) ? sizex*.5 : 0);
        let y = (Math.floor(idx/dimx) * sizey) + ((center) ? sizey*.5 : 0);
        return {x:x, y:y};
    }
    static pointFromIdx(idx, dim, size, center=false) {
        if (!dim || !size) return { x:-1, y:-1 };
        return this._pointFromIdx(idx, dim.x, dim.y, size.x, size.y, center);
    }

    static _idxsFromBounds(bminx, bminy, bmaxx, bmaxy, dimx, dimy, sizex, sizey) {
        let minij = this._ijFromPoint(bminx, bminy, dimx, dimy, sizex, sizey);
        let maxij = this._ijFromPoint(Math.max(bminx, bmaxx-1), Math.max(bminy, bmaxy-1), dimx, dimy, sizex, sizey);
        let gidxs = [];
        for (let i=Math.max(0, minij.x); i<=Math.min(dimx-1, maxij.x); i++) {
            for (let j=Math.max(0, minij.y); j<=Math.min(dimy-1, maxij.y); j++) {
                let idx = this._idxFromIJ(i, j, dimx, dimy);
                gidxs.push(idx);
            }
        }
        return gidxs;
    }
    static idxsFromBounds(b, dim, size) {
        if (!b || !dim || !size) return [];
        return this._idxsFromBounds(b.minx, b.miny, b.maxx, b.maxy, dim.x, dim.y, size.x, size.y);
    }

    static _idxFromPoint(px, py, dimx, dimy, sizex, sizey) {
        let ij = this._ijFromPoint(px, py, dimx, dimy, sizex, sizey);
        return this._idxFromIJ(ij.x, ij.y, dimx, dimy);
    }
    static idxFromPoint(p, dim, size) {
        if (!p || !dim || !size) return -1;
        return this._idxFromPoint(p.x, p.y, dim.x, dim.y, size.x, size.y);
    }

    // METHODS -------------------------------------------------------------
    _ijFromPoint(px, py) {
        return this.constructor._ijFromPoint(px, py, this.cols, this.rows, this.colSize, this.rowSize);
    }
    ijFromPoint(p) {
        if (!p) return {x:-1,y:-1};
        return this.constructor._ijFromPoint(p.x, p.y, this.cols, this.rows, this.colSize, this.rowSize);
    }

    _idxFromPoint(px, py) {
        return this.constructor._idxFromPoint(px, py, this.cols, this.rows, this.colSize, this.rowSize);
    }
    idxFromPoint(p) {
        if (!p) return -1;
        return this.constructor._idxFromPoint(p.x, p.y, this.cols, this.rows, this.colSize, this.rowSize);
    }

    pointFromIdx(idx, center=false) {
        return this.constructor._pointFromIdx(idx, this.cols, this.rows, this.colSize, this.rowSize, center);
    }

    _pointFromIJ(i, j, center=false) {
        return this.constructor._pointFromIJ(i, j, this.cols, this.rows, this.colSize, this.rowSize, center);
    }
    pointFromIJ(ij, center=false) {
        if (!ij) return {x:-1, y:-1};
        return this.constructor._pointFromIJ(ij.x, ij.y, this.cols, this.rows, this.colSize, this.rowSize, center);
    }

    idxof(gzo) {
        let gidx = this.gzoIdxMap.get(gzo.gid) || [];
        return gidx.slice();
    }

    includes(gzo) {
        return this.gzoIdxMap.has(gzo.gid);
    }

    idxsFromGzo(gzo) {
        let b = this.bounder(gzo);
        return this.constructor._idxsFromBounds(b.minx, b.miny, b.maxx, b.maxy, this.cols, this.rows, this.colSize, this.rowSize);
    }

    *_findForPoint(px, py, filter=(v) => true) {
        let gidx = this.constructor._idxFromPoint(px, py, this.cols, this.rows, this.colSize, this.rowSize);
        let found = new Set();
        for (const gzo of this.findForIdx(gidx, filter)) {
            let ob = this.bounder(gzo);
            if (!found.has(gzo) && Contains._bounds(ob.minx, ob.miny, ob.maxx, ob.maxy, px, py)) {
                found.add(gzo);
                yield gzo;
            }
        }
    }
    *findForPoint(p, filter=(v) => true) {
        if (!p) return;
        yield *this._findForPoint(p.x, p.y, filter);
    }

    _firstForPoint(px, py, filter=(v) => true) {
        let gidx = this.constructor._idxFromPoint(px, py, this.cols, this.rows, this.colSize, this.rowSize);
        for (const gzo of this.findForIdx(gidx, filter)) {
            let ob = this.bounder(gzo);
            if (Contains._bounds(ob.minx, ob.miny, ob.maxx, ob.maxy, px, py)) return gzo;
        }
        return null;
    }
    firstForPoint(p, filter=(v) => true) {
        if (!p) return null;
        return this._firstForPoint(p.x, p.y, filter);
    }

    *_findForBounds(bminx, bminy, bmaxx, bmaxy, filter=(v) => true) {
        let gidxs = this.constructor._idxsFromBounds(bminx, bminy, bmaxx, bmaxy, this.cols, this.rows, this.colSize, this.rowSize);
        let found = new Set();
        for (const gzo of this.findForIdx(gidxs, filter)) {
            let ob = this.bounder(gzo);
            if (!found.has(gzo) && Overlaps._bounds(ob.minx, ob.miny, ob.maxx, ob.maxy, bminx, bminy, bmaxx, bmaxy)) {
                found.add(gzo);
                yield gzo;
            }
        }
    }
    *findForBounds(bounds, filter=(v) => true) {
        if (!bounds) return;
        yield *this._findForBounds(bounds.minx, bounds.miny, bounds.maxx, bounds.maxy, filter);
    }

    _firstForBounds(bminx, bminy, bmaxx, bmaxy, filter=(v) => true) {
        let gidxs = this.constructor._idxsFromBounds(bminx, bminy, bmaxx, bmaxy, this.cols, this.rows, this.colSize, this.rowSize);
        for (const gzo of this.findForIdx(gidxs, filter)) {
            let ob = this.bounder(gzo);
            if (Overlaps._bounds(ob.minx, ob.miny, ob.maxx, ob.maxy, bminx, bminy, bmaxx, bmaxy)) return gzo;
        }
        return null;
    }
    firstForBounds(bounds, filter=(v) => true) {
        if (!bounds) return null;
        return this._firstForBounds(bounds.minx, bounds.miny, bounds.maxx, bounds.maxy, filter);
    }

    add(gzo) {
        let gidx = this.idxsFromGzo(gzo);
        if (!gidx) return;
        // assign object to grid
        for (const idx of gidx) this.setidx(idx, gzo);
        // assign gizmo gidx
        this.gzoIdxMap.set(gzo.gid, gidx);
        if (this.dbg) console.log(`grid add ${gzo} w/ idx: ${gidx}`);
    }

    remove(gzo) {
        if (!gzo) return;
        let gidx = this.gzoIdxMap.get(gzo.gid) || [];
        this.gzoIdxMap.delete(gzo.gid);
        // remove object from grid
        for (const idx of gidx) this.delidx(idx, gzo);
    }

    recheck(gzo) {
        if (!gzo) return;
        let ogidx = this.gzoIdxMap.get(gzo.gid) || [];
        let gidx = this.idxsFromGzo(gzo) || [];
        if (!Util.arraysEqual(ogidx, gidx)) {
            if (this.dbg) console.log(`----- Grid.recheck: ${gzo} old ${ogidx} new ${gidx}`);
            // remove old
            for (const idx of ogidx) this.delidx(idx, gzo);
            // add new
            for (const idx of gidx) this.setidx(idx, gzo);
            // assign new gidx
            this.gzoIdxMap.set(gzo.gid, gidx);
            return true;
        } else {
            // resort
            for (const idx of gidx) {
                if (this.bucketSort) this.entries[idx].sort(this.bucketSort);
            }
            return false;
        }
    }

    resize(bounds, cols, rows) {
        // FIXME
        // array/grid resize
        if (this.cols != cols || this.rows != rows) super.resize(cols, rows);
        // bounds resize
        //this.bounds = bounds;
        // recheck position of all assigned objects
        for (const gzo of this) this.recheck(gzo);
    }

    render(ctx, x=0, y=0, color='rgba(0,255,255,.5)', occupiedColor='red') {
        for (let i=0; i<this.cols; i++) {
            for (let j=0; j<this.rows; j++) {
               let idx = this._idxFromIJ(i, j);
                let entries = this.entries[idx] || [];
                ctx.strokeStyle = (entries.length) ? occupiedColor : color;
                //ctx.setLineDash([5,5]);
                ctx.lineWidth = 1;
                ctx.strokeRect(x + i*this.colSize, y + j*this.rowSize, this.colSize, this.rowSize);
                //ctx.setLineDash([]);
            }
        }
    }

    toString() {
        return Fmt.toString(this.constructor.name, this.cols, this.rows);
    }

}
