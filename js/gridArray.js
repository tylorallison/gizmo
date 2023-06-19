export { GridArray, GridBucketArray };

import { Direction } from './direction.js';
import { GizmoData } from './gizmoData.js';
import { Util } from './util.js';
import { Vect } from './vect.js';

/**
 * Implements a 2-dimensional grid array and methods for indexing and accessing data within
 * @extends GizmoData
 */
class GridArray extends GizmoData {
    static directions = Array.from(Direction.all);

    /** @member {string} GridArray#cols=16 - columns in grid array */
    static { this.schema(this, 'cols', { readonly: true, dflt: 16 }); }
    /** @member {string} GridArray#rows=16 - rows in grid array */
    static { this.schema(this, 'rows', { readonly: true, dflt: 16 }); }
    /** @member {string} GridArray#length - length of flat array */
    static { this.schema(this, 'length', { readonly: true, parser: (o,x) => o.cols*o.rows }); }
    /** @member {string} GridArray#entries - array storage */
    static { this.schema(this, 'entries', { readonly: true, parser: (o,x) => x.entries || [] }); }

    // STATIC METHODS ------------------------------------------------------

    /**
     * @typedef {Object} ArrayIndex
     * @property {number} x - row index (i)
     * @property {number} y - column index (j)
    */

    /**
     * @typedef {Object} ArrayDimension
     * @property {number} x - number of columns
     * @property {number} y - number of rows
    */

    /**
     * Returns the column (i) and row (j) indices from the given flat index (idx)
     * @param {int} idx - flat array index
     * @param {ArrayDimension} dim - dimensions for the array
     * @returns {ArrayIndex} 
     */
    static _ijFromIdx(idx, dimx, dimy) {
        if (idx < 0) return {x:-1,y:-1};
        let i = idx % dimx;
        if (i>dimx) i = -1;
        let j = Math.floor(idx/dimx);
        if (j>dimy) j = -1;
        return {x:i, y:j};
    }
    static ijFromIdx(idx, dim) {
        if (!dim) return {x:-1,y:-1};
        return this._ijFromIdx(idx, dim.x, dim.y);
    }

    /**
     * Returns the flat index (idx) from the given column and row indices (i,j)
     * @param {ArrayIndex} ij - array index
     * @param {ArrayDimension} dim - dimensions for the array
     * @returns {int}
     */
    static _idxFromIJ(i, j, dimx, dimy) {
        if (i >= dimx || i<0) return -1;
        if (j >= dimy || j<0) return -1;
        return i + dimx*j;
    }
    static idxFromIJ(ij, dim) {
        if (!ij || !dim) return -1;
        return this._idxFromIJ(ij.x, ij.y, dim.x, dim.y);
    }

    /**
     * Returns the adjacent flat index based on given index and {@link Direction}
     * @param {int} idx - starting flat array index
     * @param {Direction} dir - direction of adjacent index requested
     * @param {ArrayDimension} dim - dimensions for the array
     * @returns {int}
     */
    static _idxFromDir(idx, dir, dimx, dimy) {
        let ij = this._ijFromIdx(idx, dimx, dimy);
        return this._idxFromIJ(ij.x + Direction.asX(dir), ij.y + Direction.asY(dir), dimx, dimy);
    }
    static idxFromDir(idx, dir, dim) {
        if (!dim) return -1;
        return this._idxFromDir(idx, dir, dim.x, dim.y);
    }

    /**
     * Generator that yields all (flat) indexes between two given points (indices) using Bresenham's line algorithm
     * @generator
     * @param {int} idx1 - flat index of point one
     * @param {int} idx2 - flat index of point two
     * @param {ArrayDimension} dim - dimensions for the array
     * @yields {int}
     */
    static *idxsBetween(idx1, idx2, dim) {
        if (!dim) return;
        let ij1 = this.ijFromIdx(idx1, dim);
        let ij2 = this.ijFromIdx(idx2, dim);
        for (const [i,j] of Util.pixelsInSegment(ij1.x, ij1.y, ij2.x, ij2.y)) {
            yield this.idxFromIJ(i, j, dim);
        }
    }

    static *_idxsInRange(idx, range, dimx, dimy) {
        let cij = this._ijFromIdx(idx, dimx, dimy);
        let mini = Math.max(cij.x-range, 0);
        let maxi = Math.min(cij.x+range, dimx);
        let minj = Math.max(cij.y-range, 0);
        let maxj = Math.min(cij.y+range, dimy);
        for (let i=mini; i<=maxi; i++) {
            for (let j=minj; j<=maxj; j++) {
                let d = Vect._dist(cij.x, cij.y, i, j)
                if (d<=range) {
                    yield this._idxFromIJ(i, j, dimx, dimy);
                }
            }
        }
    }
    static *idxsInRange(idx, range, dim) {
        if (!dim) return;
        yield *this._idxsInRange(idx, range, dim.x, dim.y)
    }

    /**
     * Determines if the given two indices are adjacent to each other.
     * @param {int} idx1 - index 1
     * @param {int} idx2 - index 2
     * @returns  {boolean}
     */
    static _idxsAdjacent(idx1, idx2, dimx, dimy) {
        for (const dir of this.constructor.directions) {
            if (this._idxFromDir(idx1, dir, dimx, dimy) === idx2) return true;
        }
        return false;
    }
    static idxsAdjacent(idx1, idx2, dim) {
        if (!dim) return false;
        return this._idxsAdjacent(idx1, idx2, dim.x, dim.y);
    }

    /**
     * Determines if the given two ij points are adjacent to each other.
     * @param {int} ij1 - indexed ij
     * @param {int} ij2 - indexed ij
     * @returns  {boolean}
     */
    static _ijAdjacent(i1, j1, i2, j2) {
        if (i1 === i2 && j1 === j2) return false;
        let di = Math.abs(i1-i2);
        let dj = Math.abs(j1-j2);
        return di<=1 && dj <=1;
    }
    static ijAdjacent(ij1, ij2) {
        if (!ij1 || !ij2) return false;
        return this._ijAdjacent(ij1.x, ij1.y, ij2.x, ij2.y);
    }

    /**
     * Resizes the given grid array and creates a new grid array and optionally shifts array entries based on given offsets.  Any out-of-bounds data is lost.
     * @param {GridArray} ga - grid array to resize
     * @param {ArrayDimension} dim - dimensions for the array
     * @param {i} cols - number of columns for new array
     * @param {i} rows - number of rows for new array
     * @param {i} [offi=0] - column offset for original array data
     * @param {i} [offj=0] - row offset for original array data
     * @returns {int}
     */
    static resize(ga, cols, rows, offi=0, offj=0) {
        // re-align data
        let nentries = new Array(rows*cols);
        for (let i=0; i<cols; i++) {
            for (let j=0; j<rows; j++) {
                let oi = i+offi;
                let oj = j+offj;
                if (oi >= 0 && oi < this.cols && oj >= 0 && oj < this.rows) {
                    let oidx = this._idxFromIJ(oi, oj, ga.cols, ga.rows);
                    let nidx = this._idxFromIJ(i, j, cols, rows);
                    nentries[nidx] = ga.entries[oidx];
                }
            }
        }
        return new GridArray({ rows: rows, cols: cols, entries: nentries });
    }

    // METHODS -------------------------------------------------------------

    /**
     * Returns the column and row indices ([i,j]) from the given flat index (idx)
     * @param {int} idx - flat array index
     * @returns {ArrayIndex} 
     */
    ijFromIdx(idx) {
        return this.constructor._ijFromIdx(idx, this.cols, this.cros);
    }

    /**
     * Returns the flat index (idx) from the given column and row indices (i,j)
     * @param {ArrayIndex} ij - array index
     * @returns {int}
     */
    _idxFromIJ(i,j) {
        return this.constructor._idxFromIJ(i, j, this.cols, this.rows);
    }
    idxFromIJ(ij) {
        if (!ij) return -1;
        return this.constructor._idxFromIJ(ij.x, ij.y, this.cols, this.rows);
    }

    /**
     * Returns the adjacent flat index based on given index and {@link Direction}
     * @param {int} idx - starting flat array index
     * @param {Direction} dir - direction of adjacent index requested
     * @returns {int}
     */
    idxFromDir(idx, dir) {
        return this.constructor._idxFromDir(idx, dir, this.cols, this.rows);
    }

    /**
     * Generator that yields all (flat) indexes between two given points (indices) using Bresenham's line algorithm
     * @generator
     * @param {int} idx1 - flat index of point one
     * @param {int} idx2 - flat index of point two
     * @yields {int}
     */
    *idxsBetween(idx1, idx2) {
        yield *this.constructor.idxsBetween(idx1, idx2, {x: this.cols, y:this.rows});
    }

    *idxsInRange(idx, range) {
        yield *this.constructor._idxsInRange(idx, range, this.cols, this.rows)
    }

    /**
     * Determines if the given two indices are adjacent to each other.
     * @param {int} idx1 - index 1
     * @param {int} idx2 - index 2
     * @returns  {boolean}
     */
    idxsAdjacent(idx1, idx2) {
        for (const dir of this.constructor.directions) {
            if (this.idxFromDir(idx1, dir) === idx2) return true;
        }
        return false;
    }

    /**
     * Determines if the given two ij points are adjacent to each other.
     * @param {int} ij1 - indexed ij
     * @param {int} ij2 - indexed ij
     * @returns  {boolean}
     */
    _ijAdjacent(i1, j1, i2, j2) {
        return this.constructor._ijAdjacent(i1, j1, i2, j2)
    }
    ijAdjacent(ij1, ij2) {
        if (!ij1 || !ij2) return false;
        return this.constructor.ijAdjacent(ij1, ij2)
    }

    // -- accessor methods
    /**
     * retrieve array value for the given column, row (i,j) indices
     * @param {ArrayIndex} ij - array index
     * @returns {*}
     */
    _getij(i, j) {
        let idx = this._idxFromIJ(i, j);
        return this.entries[idx];
    }
    getij(ij) {
        if (!ij) return null;
        let idx = this._idxFromIJ(ij.x, ij.y);
        return this.entries[idx];
    }

    /**
     * retrieve array value for the given flat index (idx)
     * @param {int} idx - flat index
     * @returns {*}
     */
    getidx(idx) {
        return this.entries[idx];
    }

    /**
     * set array value for the given column, row (i,j) indices
     * @param {ArrayIndex} ij - array index
     * @param {*} v - value to set
     */
    _setij(i, j, v) {
        let idx = this._idxFromIJ(i, j);
        if (idx !== -1) this.entries[idx] = v;
    }
    setij(ij, v) {
        if (!ij) return;
        let idx = this._idxFromIJ(ij.x, ij.y);
        if (idx !== -1) this.entries[idx] = v;
    }

    /**
     * set array value for the given flat index (idx)
     * @param {int} idx - flat index
     * @param {*} v - value to set
     */
    setidx(idx, v) {
        this.entries[idx] = v;
    }

    _delij(i, j, v) {
        const idx = this._idxFromIJ(i, j);
        delete this.entries[idx];
    }
    delij(ij, v) {
        if (!ij) return;
        this._delij(ij.x, ij.y, v);
    }

    delidx(idx, v) {
        delete this.entries[idx];
    }

    /**
     * clear all contents of the array
     */
    clear() {
        this.entries.splice(0);
    }

    // -- iterators
    /**
     * iterator that returns all array contents
     * @generator
     * @yields {*}
     */
    *[Symbol.iterator]() {
        for (let i=0; i<this.length; i++) {
            yield *this.entries[i];
        }
    }

    /**
     * An array element filter is used to determine if a given array element matches and is used for array predicate functions.
     * @callback GridArray~filter
     * @param {*} v - value to be evaluated
     * @returns {boolean} - indicates if given value matches
     */

    /**
     * generator that returns all array elements that match the given filter
     * @param {GridArray~filter} filter 
     */
    *find(filter=(v) => true) {
        for (let i=0; i<this.length; i++) {
            let v = this.entries[i];
            if (filter(v)) yield [i, v];
        }
    }

    *neighborIdxs(idx) {
        for (const dir of this.constructor.directions) {
            let oidx = this.idxFromDir(idx, dir);
            if (oidx !== -1) yield oidx;
        }
    }

    *keys() {
        for (let i=0; i<this.length; i++) {
            if (this.entries[i]) yield i;
        }
    }

}

/**
 * Implements object buckets for each grid array entry.
 * @extends GridArray
 */
class GridBucketArray extends GridArray {
    static {
        this.schema(this, 'bucketSort', { readonly: true });
    }

    *_getij(i, j) {
        let idx = this._idxFromIJ(i, j);
        if (this.entries[idx]) {
            yield *Array.from(this.entries[idx]);
        }
    }
    *getij(ij) {
        if (!ij) return;
        yield this._getij(ij.x, ij.y);
    }

    *getidx(idx) {
        if (this.entries[idx]) {
            yield *Array.from(this.entries[idx]);
        }
    }

    _setij(i, j, v) {
        const idx = this._idxFromIJ(i, j);
        if (!this.entries[idx]) this.entries[idx] = [];
        const entries = this.entries[idx];
        entries.push(v);
        if (this.bucketSort) entries.sort(this.bucketSort);
    }
    setij(ij, v) {
        if (!ij) return;
        this._setij(ij.x, ij.y, v);
    }

    setidx(idx, v) {
        if (!this.entries[idx]) this.entries[idx] = [];
        const entries = this.entries[idx];
        entries.push(v);
        if (this.bucketSort) entries.sort(this.bucketSort);
    }

    _delij(i, j, v) {
        const idx = this._idxFromIJ(i, j);
        entries = this.entries[idx];
        if (entries) {
            let i = entries.indexOf(v);
            if (i !== -1) entries.splice(i, 1);
            if (!entries.length) {
                delete entries[idx];
            }
        }
    }
    delij(ij, v) {
        if (!ij) return;
        this._delij(ij.x, ij.y, v);
    }

    delidx(idx, v) {
        const entries = this.entries[idx];
        if (entries) {
            let i = entries.indexOf(v);
            if (i !== -1) entries.splice(i, 1);
            if (!entries.length) {
                delete entries[idx];
            }
        }
    }

    *[Symbol.iterator]() {
        let found = new Set();
        for (let i=0; i<this.length; i++) {
            if (this.entries[i]) {
                let entries = Array.from(this.entries[i]);
                for (const gzo of entries) {
                    if (found.has(gzo.gid)) continue;
                    found.add(gzo.gid);
                    yield gzo;
                }
            }
        }
    }

    *find(filter=(v) => true) {
        let found = new Set();
        for (let i=0; i<this.length; i++) {
            if (this.entries[i]) {
                let entries = Array.from(this.entries[i]);
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
        for (let i=0; i<this.length; i++) {
            if (this.entries[i]) {
                for (const gzo of this.entries[i]) {
                    if (filter(gzo)) return gzo;
                }
            }
        }
        return null;
    }

    *findForIdx(gidxs, filter=(v) => true) {
        if (!Util.iterable(gidxs)) gidxs = [gidxs];
        const found = new Set();
        for (const idx of gidxs) {
            const entries = this.entries[idx] || [];
            for (const gzo of Array.from(entries)) {
                if (found.has(gzo)) continue;
                if (filter(gzo)) {
                    found.add(gzo);
                    yield gzo;
                }
            }
        }
    }

    firstForIdx(gidxs, filter=(v) => true) {
        if (!Util.iterable(gidxs)) gidxs = [gidxs];
        for (const idx of gidxs) {
            let entries = this.entries[idx] || [];
            for (const gzo of entries) {
                if (filter(gzo)) return gzo;
            }
        }
        return null;
    }

    *findForNeighbors(idx, filter=(v) => true, dirs=Direction.any) {
        for (const dir of this.constructor.directions) {
            if (!(dir & dirs)) continue;
            let oidx = this.idxFromDir(idx, dir);
            yield *this.findForIdx(oidx, filter);
        }
    }

    firstForNeighbors(idx, filter=(v) => true, dirs=Direction.any) {
        for (const dir of this.constructor.directions) {
            if (!(dir & dirs)) continue;
            let oidx = this.idxFromDir(idx, dir);
            let match = this.firstForIdx(oidx, filter);
            if (match) return match;
        }
        return null;
    }

}