export { Grid };

import { Array2D } from './array2d.js';
import { Bounds } from './bounds.js';
import { Direction } from './dir.js';
import { Fmt } from './fmt.js';
import { Mathf } from './math.js';
import { Util } from './util.js';

/** ========================================================================
 * A grid-based object (gizmo) storage bucket which allows for quick lookups of game elements based on location.
 */

class Grid extends Array2D {
    static dfltCols = 8;
    static dfltRows = 8;

    static {
        this.schema(this, 'locator', { readonly: true, dflt: ((v) => v.xform) });
        this.schema(this, 'bounds', { readonly: true, parser: (o,x) => x.bounds || Bounds.zero });
        this.schema(this, 'dbg', { dflt: false });
        this.schema(this, 'rowSize', { readonly: true, parser: (o,x) => o.bounds.height/o.rows });
        this.schema(this, 'colSize', { readonly: true, parser: (o,x) => o.bounds.width/o.cols });
    }

    constructor(spec={}) {
        super(spec);
        //this.locator = spec.locator || ((v) => v);
        //this.bounds = spec.bounds || Bounds.zero;
        this.gridSort = spec.gridSort;
        //this.dbg = spec.dbg;
        //this.rowSize = this.bounds.height/this.rows;
        //this.colSize = this.bounds.width/this.cols;
        this.rowHalfSize = this.rowSize * .5;
        this.colHalfSize = this.colSize * .5;
        this.gidxs = new Map();
    }

    // STATIC METHODS ------------------------------------------------------
    static ifromx(x, colSize, minx=0, cols=undefined) {
        let i = Math.floor((x-minx)/colSize);
        if (i < 0) i = 0;
        if (cols && i >= cols) i = cols-1;
        return i;
    }
    static jfromy(y, rowSize, miny=0, rows=undefined) {
        let j = Math.floor((y-miny)/rowSize);
        if (j < 0) j = 0;
        if (rows && j >= rows) j = rows-1;
        return j;
    }

    static xfromidx(idx, cols, colSize, minx=0, center=false) {
        return minx + (((idx % cols) * colSize) + ((center) ? colSize*.5 : 0));
    }

    static yfromidx(idx, cols, rowSize, miny=0, center=false) {
        return miny + ((Math.floor(idx/cols) * rowSize) + ((center) ? rowSize*.5 : 0));
    }

    static getgidx(gzo, gbounds=Bounds.zero, colSize=0, rowSize=0, cols=0, rows=0) {
        // check that object overlaps w/ grid
        if (!gbounds.overlaps(gzo)) return null;
        // check if object has bounds...
        let minx = 0, miny = 0, maxx = 0, maxy = 0;
        if (('minx' in gzo) && ('miny' in gzo) && ('maxx' in gzo) && ('maxy' in gzo)) {
            minx = gzo.minx;
            miny = gzo.miny;
            maxx = Math.max(gzo.minx,gzo.maxx-1);
            maxy = Math.max(gzo.miny,gzo.maxy-1);
        // if object only has position...
        } else if (('x' in gzo) && ('y' in gzo)) {
            minx = gzo.x;
            miny = gzo.y;
            maxx = gzo.x;
            maxy = gzo.y;
        // object doesn't have dimensions or position, so cannot be tracked in grid...
        } else {
            return null;
        }
        let gidx = [];
        let maxi = this.ifromx(maxx, colSize, gbounds.minx, cols);
        let maxj = this.jfromy(maxy, rowSize, gbounds.miny, rows);
        for (let i=this.ifromx(minx, colSize, gbounds.minx, cols); i<=maxi; i++) {
            for (let j=this.jfromy(miny, rowSize, gbounds.miny, rows); j<=maxj; j++) {
                // compute grid index
                let idx = this.idxfromij(i,j,cols,rows);
                // track object gidx
                gidx.push(idx);
            }
        }
        return gidx;
    }

    // METHODS -------------------------------------------------------------
    ifromx(x) {
        let i = Math.floor((x-this.bounds.minx)/this.colSize);
        if (i < 0) i = 0;
        if (i >= this.cols) i = this.cols-1;
        return i;
    }
    jfromy(y) {
        let j = Math.floor((y-this.bounds.miny)/this.rowSize);
        if (j < 0) j = 0;
        if (j >= this.rows) j = this.rows-1;
        return j;
    }

    idxfromxy(x,y) {
        let i = Math.floor(x/this.colSize);
        let j = Math.floor(y/this.rowSize);
        if (i < 0) i = 0;
        if (j < 0) j = 0;
        if (i >= this.cols) i = this.cols-1;
        if (j >= this.rows) j = this.rows-1;
        return i + this.cols*j;
    }

    xfromidx(idx, center=false) {
        return this.bounds.minx + (((idx % this.cols) * this.colSize) + ((center) ? this.colHalfSize : 0));
    }
    yfromidx(idx, center=false) {
        return this.bounds.miny + ((Math.floor(idx/this.cols) * this.rowSize) + ((center) ? this.rowHalfSize : 0));
    }

    idxof(gzo) {
        let gidx = this.gidxs.get(gzo.gid) || [];
        return gidx.slice();
    }

    resize(bounds, cols, rows) {
        // array/grid resize
        if (this.cols != cols || this.rows != rows) super.resize(cols, rows);
        // bounds resize
        this.bounds = bounds;
        this.colSize = this.bounds.width/this.cols;
        this.rowSize = this.bounds.height/this.rows;
        this.rowHalfSize = this.rowSize * .5;
        this.colHalfSize = this.colSize * .5;
        // recheck position of all assigned objects
        for (const gzo of this) this.recheck(gzo);
    }

    contains(gzo) {
        return this.gidxs.has(gzo.gid);
    }

    getgidx(gzo) {
        let loc = this.locator(gzo);
        return this.constructor.getgidx(loc, this.bounds, this.colSize, this.rowSize, this.cols, this.rows)
    }

    *[Symbol.iterator]() {
        for (let i=0; i<this.nentries; i++) {
            if (this.grid[i]) {
                yield *Array.from(this.grid[i]);
            }
        }
    }

    *keys() {
        for (let i=0; i<this.nentries; i++) {
            if (this.grid[i]) yield i;
        }
    }

    *getij(i, j) {
        let idx = this.idxfromij(i, j);
        if (this.grid[idx]) {
            yield *Array.from(this.grid[idx]);
        }
    }

    *getidx(idx) {
        if (this.grid[idx]) {
            yield *Array.from(this.grid[idx]);
        }
    }

    *find(filter=(v) => true) {
        let found = new Set();
        for (let i=0; i<this.nentries; i++) {
            if (this.grid[i]) {
                let entries = Array.from(this.grid[i]);
                for (const gzo of entries) {
                    if (found.has(gzo.gid)) continue;
                    if (filter(gzo)) {
                        found.add(gzo.gid);
                        yield gzo;
                    }
                }
            }
        }
    }

    first(filter=(v) => true) {
        for (let i=0; i<this.nentries; i++) {
            if (this.grid[i]) {
                let entries = Array.from(this.grid[i]);
                for (const gzo of entries) {
                    if (filter(gzo)) return gzo;
                }
            }
        }
        return null;
    }

    *findgidx(gidx, filter=(v) => true) {
        if (!Util.iterable(gidx)) gidx = [gidx];
        let found = new Set();
        for (const idx of gidx) {
            let entries = this.grid[idx] || [];
            if (entries) {
                for (const gzo of Array.from(entries)) {
                    if (found.has(gzo.gid)) continue;
                    if (filter(gzo)) {
                        found.add(gzo.gid);
                        yield gzo;
                    }
                }
            }
        }
    }

    *findContains(x, y, filter=(v) => true) {
        let gidx = this.constructor.getgidx({x: x, y:y}, this.bounds, this.colSize, this.rowSize, this.cols, this.rows)
        for (const gzo of this.findgidx(gidx, filter)) {
            let otherBounds = this.locator(gzo);
            if (Bounds.containsXY(otherBounds, x, y)) yield gzo;
        }
    }

    *findOverlaps(bounds, filter=(v) => true) {
        let gidx = this.constructor.getgidx(bounds, this.bounds, this.colSize, this.rowSize, this.cols, this.rows)
        for (const gzo of this.findgidx(gidx, filter)) {
            let otherBounds = this.locator(gzo);
            if (Bounds.overlaps(otherBounds, bounds)) yield gzo;
        }
    }

    *idxsBetween(idx1, idx2) {
        let i1 = this.ifromidx(idx1);
        let j1 = this.jfromidx(idx1);
        let i2 = this.ifromidx(idx2);
        let j2 = this.jfromidx(idx2);
        for (const [i,j] of Util.pixelsInSegment(i1, j1, i2, j2)) {
            yield this.idxfromij(i,j);
        }
    }

    add(gzo) {
        let gidx = this.getgidx(gzo);
        if (!gidx) return;
        // assign object to grid
        for (const idx of gidx) {
            if (!this.grid[idx]) this.grid[idx] = [];
            this.grid[idx].push(gzo);
            if (this.gridSort) this.grid[idx].sort(this.gridSort);
        }
        // assign gizmo gidx
        this.gidxs.set(gzo.gid, gidx);
        if (this.dbg) console.log(`grid add ${gzo} w/ idx: ${gidx}`);
    }

    remove(gzo) {
        if (!gzo) return;
        let gidx = this.gidxs.get(gzo.gid) || [];
        this.gidxs.delete(gzo.gid);
        for (const idx of gidx) {
            let entries = this.grid[idx] || [];
            let i = entries.indexOf(gzo);
            if (i >= 0) entries.splice(i, 1);
        }
    }

    recheck(gzo) {
        if (!gzo) return;
        let ogidx = this.gidxs.get(gzo.gid) || [];
        let gidx = this.getgidx(gzo) || [];
        if (!Util.arraysEqual(ogidx, gidx)) {
            if (this.dbg) console.log(`----- Grid.recheck: ${gzo} old ${ogidx} new ${gidx}`);
            // remove old
            for (const idx of ogidx) {
                let entries = this.grid[idx] || [];
                let i = entries.indexOf(gzo);
                if (i >= 0) entries.splice(i, 1);
            }
            // add new
            for (const idx of gidx) {
                if (!this.grid[idx]) this.grid[idx] = [];
                this.grid[idx].push(gzo);
                if (this.gridSort) this.grid[idx].sort(this.gridSort);
            }
            // assign new gidx
            this.gidxs.set(gzo.gid, gidx);
        } else {
            // resort
            for (const idx of gidx) {
                if (this.gridSort) this.grid[idx].sort(this.gridSort);
            }
        }
    }

    render(ctx, x=0, y=0, color='rgba(0,255,255,.5', occupiedColor='red') {
        for (let i=0; i<this.cols; i++) {
            for (let j=0; j<this.rows; j++) {
               let idx = this.idxfromij(i, j);
                let entries = this.grid[idx] || [];
                ctx.strokeStyle = (entries.length) ? occupiedColor : color;
                ctx.setLineDash([5,5]);
                ctx.lineWidth = 3;
                ctx.strokeRect(x + i*this.colSize, y + j*this.rowSize, this.colSize, this.rowSize);
                ctx.setLineDash([]);
            }
        }
    }

    toString() {
        return Fmt.toString(this.constructor.name, this.cols, this.rows);
    }

}