export { Array2D };

import { Direction } from './direction.js';
import { GizmoData } from './gizmoData.js';

/**
 * Implements a 2-dimensional array and methods for indexing and accessing data within
 * @extends GizmoData
 */
class Array2D extends GizmoData {
    /** @member {string} Array2D#cols=16 - columns in 2d array */
    static { this.schema(this, 'cols', { readonly: true, dflt: 16 }); }
    /** @member {string} Array2D#rows=16 - rows in 2d array */
    static { this.schema(this, 'rows', { readonly: true, dflt: 16 }); }
    /** @member {string} Array2D#length - length of flat array */
    static { this.schema(this, 'length', { readonly: true, parser: (o,x) => o.cols*o.rows }); }
    /** @member {string} Array2D#entries - array storage */
    static { this.schema(this, 'entries', { readonly: true, parser: (o,x) => x.entries || [] }); }

    // STATIC METHODS ------------------------------------------------------
    /**
     * Returns the column index (i) from the given flat index (idx)
     * @param {int} idx - flat array index
     * @param {int} cols - number of columns in 2d array
     * @param {int} length - length of 2d array
     * @returns {int}
     */
    static ifromidx(idx, cols, length=undefined) {
        if (idx < 0) return -1;
        if (length && idx >= length) return -1;
        return idx % cols;
    }

    /**
     * Returns the row index (j) from the given flat index (idx)
     * @param {int} idx - flat array index
     * @param {int} cols - number of columns in 2d array
     * @param {int} length - length of 2d array
     * @returns {int}
     */
    static jfromidx(idx, cols, length=undefined) {
        if (idx < 0) return -1;
        if (length && idx >= length) return -1;
        return Math.floor(idx/cols);
    }

    /**
     * Returns the column and row indices ([i,j]) from the given flat index (idx)
     * @param {int} idx - flat array index
     * @param {int} cols - number of columns in 2d array
     * @param {int} length - length of 2d array
     * @returns {int[]}
     */
    static ijfromidx(idx, cols, length=undefined) {
        if (idx < 0) return -1;
        if (length && idx >= length) return -1;
        return [idx % this.cols, Math.floor(idx/this.cols)];
    }

    /**
     * Returns the flat index (idx) from the given column and row indices (i,j)
     * @param {int} i - column index
     * @param {int} j - row index
     * @param {int} cols - number of columns in 2d array
     * @param {int} rows - number of rows in 2d array
     * @returns {int}
     */
    static idxfromij(i, j, cols, rows) {
        if (i >= cols) return -1;
        if (j >= rows) return -1;
        return i + cols*j;
    }

    /**
     * Returns the adjacent flat index based on given index and {@link Direction}
     * @param {int} idx - starting flat array index
     * @param {Direction} dir - direction of adjacent index requested
     * @param {int} cols - number of columns in 2d array
     * @param {int} rows - number of rows in 2d array
     * @returns {int}
     */
    static idxfromdir(idx, dir, cols, rows) {
        return this.idxfromij(this.ifromidx(idx, cols) + Direction.asX(dir), this.jfromidx(idx, cols) + Direction.asY(dir), cols, rows);
    }

    /**
     * Generator that yields all (flat) indexes between two given points (indices) using Bresenham's line algorithm
     * @generator
     * @param {int} idx1 - flat index of point one
     * @param {int} idx2 - flat index of point two
     * @param {int} cols - number of columns in 2d array
     * @param {int} rows - number of rows in 2d array
     * @param {int} length - length of array
     * @yields {int}
     */
    static *idxsBetween(idx1, idx2, cols, rows, length=undefined) {
        let i1 = this.ifromidx(idx1, cols, length);
        let j1 = this.jfromidx(idx1, cols, length);
        let i2 = this.ifromidx(idx2, cols, length);
        let j2 = this.jfromidx(idx2, cols, length);
        for (const [i,j] of Util.pixelsInSegment(i1, j1, i2, j2)) {
            yield this.idxfromij(i, j, cols, rows);
        }
    }

    /**
     * Resizes the given 2d array and creates a new 2d array and optionally shifts array entries based on given offsets.  Any out-of-bounds data is lost.
     * @param {Array2D} a2d - 2d array to resize
     * @param {i} cols - number of columns for new array
     * @param {i} rows - number of rows for new array
     * @param {i} [offi=0] - column offset for original array data
     * @param {i} [offj=0] - row offset for original array data
     * @returns {int}
     */
    static resize(a2d, cols, rows, offi=0, offj=0) {
        // re-align data
        let nentries = new Array(rows*cols);
        for (let i=0; i<cols; i++) {
            for (let j=0; j<rows; j++) {
                let oi = i+offi;
                let oj = j+offj;
                if (oi >= 0 && oi < this.cols && oj >= 0 && oj < this.rows) {
                    let oidx = this.constructor.idxfromij(oi, oj, a2d.cols, a2d.rows);
                    let nidx = this.constructor.idxfromij(i, j, cols, rows);
                    nentries[nidx] = a2d.entries[oidx];
                }
            }
        }
        return new Array2D({ rows: rows, cols: cols, entries: nentries });
    }

    // METHODS -------------------------------------------------------------
    /**
     * Returns the column index (i) from the given flat index (idx)
     * @param {int} idx - flat array index
     * @returns {int}
     */
    ifromidx(idx) {
        if (idx < 0) return -1;
        if (idx >= this.length) return -1;
        return idx % this.cols;
    }

    /**
     * Returns the row index (j) from the given flat index (idx)
     * @param {int} idx - flat array index
     * @returns {int}
     */
    jfromidx(idx) {
        if (idx < 0) return -1;
        if (idx >= this.length) return -1;
        return Math.floor(idx/this.cols);
    }

    /**
     * Returns the column and row indices ([i,j]) from the given flat index (idx)
     * @param {int} idx - flat array index
     * @returns {int[]}
     */
    ijfromidx(idx) {
        if (idx < 0) return -1;
        if (idx >= this.length) return -1;
        return [idx % this.cols, Math.floor(idx/this.cols)];
    }

    /**
     * Returns the flat index (idx) from the given column and row indices (i,j)
     * @param {int} i - column index
     * @param {int} j - row index
     * @returns {int}
     */
    idxfromij(i,j) {
        if (i < 0) return -1;
        if (j < 0) return -1;
        if (i >= this.cols) return -1;
        if (j >= this.rows) return -1;
        return i + this.cols*j;
    }

    /**
     * Returns the adjacent flat index based on given index and {@link Direction}
     * @param {int} idx - starting flat array index
     * @param {Direction} dir - direction of adjacent index requested
     * @returns {int}
     */
    idxfromdir(idx, dir) {
        return this.idxfromij(this.ifromidx(idx) + Direction.asX(dir), this.jfromidx(idx) + Direction.asY(dir));
    }

    /**
     * Generator that yields all (flat) indexes between two given points (indices) using Bresenham's line algorithm
     * @generator
     * @param {int} idx1 - flat index of point one
     * @param {int} idx2 - flat index of point two
     * @yields {int}
     */
    *idxsBetween(idx1, idx2) {
        let i1 = this.ifromidx(idx1);
        let j1 = this.jfromidx(idx1);
        let i2 = this.ifromidx(idx2);
        let j2 = this.jfromidx(idx2);
        for (const [i,j] of Util.pixelsInSegment(i1, j1, i2, j2)) {
            yield this.idxfromij(i,j);
        }
    }

    /**
     * Determines if the given two indices are adjacent to each other.
     * @param {int} idx1 - index 1
     * @param {int} idx2 - index 2
     * @returns  {boolean}
     */
    idxsAdjacent(idx1, idx2) {
        for (const dir of Direction.all) {
            if (this.idxfromdir(idx1, dir) === idx2) return true;
        }
        return false;
    }

    // -- accessor methods
    /**
     * retrieve array value for the given column, row (i,j) indices
     * @param {int} i - column index
     * @param {int} j - row index
     * @returns {*}
     */
    getij(i, j) {
        let idx = this.idxfromij(i, j);
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
     * @param {int} i - column index
     * @param {int} j - row index
     * @param {*} v - value to set
     */
    setij(i, j, v) {
        let idx = this.idxfromij(i, j);
        this.entries[idx] = v;
    }

    /**
     * set array value for the given flat index (idx)
     * @param {int} idx - flat index
     * @param {*} v - value to set
     */
    setidx(idx, v) {
        this.entries[idx] = v;
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
     * @callback Array2D~filter
     * @param {*} v - value to be evaluated
     * @returns {boolean} - indicates if given value matches
     */

    /**
     * generator that returns all array elements that match the given filter
     * @param {Array2D~filter} filter 
     */
    *find(filter=(v) => true) {
        for (let i=0; i<this.length; i++) {
            let v = this.entries[i];
            if (filter(v)) yield [i, v];
        }
    }

}