export { Array2D };

import { Direction } from './direction.js';
import { GizmoData } from './gizmoData.js';
import { Schema } from './schema.js';

class Array2D extends GizmoData {
    static dfltCols = 16;
    static dfltRows = 16;

    static {
        Schema.apply(this, 'cols', { readonly: true, dflt: 16 });
        Schema.apply(this, 'rows', { readonly: true, dflt: 16 });
        Schema.apply(this, 'length', { readonly: true, parser: (o,x) => o.cols*o.rows });
        Schema.apply(this, 'entries', { link: 'array', readonly: true, parser: (o,x) => x.entries || [] });
    }

    // CONSTRUCTOR ---------------------------------------------------------
    /*
    constructor(spec={}) {
        super(spec);
        this.cols = spec.cols || this.constructor.dfltCols;
        this.rows = spec.rows || this.constructor.dfltRows;
        this.nentries = this.cols * this.rows;
        this.grid = spec.grid || new Array(this.nentries);
    }
    */

    // STATIC METHODS ------------------------------------------------------
    static ifromidx(idx, cols, length=undefined) {
        if (idx < 0) return -1;
        if (length && idx >= length) return -1;
        return idx % cols;
    }

    static jfromidx(idx, cols, length=undefined) {
        if (idx < 0) return -1;
        if (length && idx >= length) return -1;
        return Math.floor(idx/cols);
    }

    static ijfromidx(idx, cols, length=undefined) {
        if (idx < 0) return -1;
        if (length && idx >= length) return -1;
        return [idx % this.cols, Math.floor(idx/this.cols)];
    }

    static idxfromij(i, j, cols, rows) {
        if (i >= cols) return -1;
        if (j >= rows) return -1;
        return i + cols*j;
    }

    static idxfromdir(idx, dir, cols, rows) {
        return this.idxfromij(this.ifromidx(idx, cols) + Direction.asX(dir), this.jfromidx(idx, cols) + Direction.asY(dir), cols, rows);
    }

    static *idxsBetween(idx1, idx2, cols, rows, length=undefined) {
        let i1 = this.ifromidx(idx1, cols, length);
        let j1 = this.jfromidx(idx1, cols, length);
        let i2 = this.ifromidx(idx2, cols, length);
        let j2 = this.jfromidx(idx2, cols, length);
        for (const [i,j] of Util.pixelsInSegment(i1, j1, i2, j2)) {
            yield this.idxfromij(i, j, cols, rows);
        }
    }

    // -- resize
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
    // -- index methods
    ifromidx(idx) {
        if (idx < 0) return -1;
        if (idx >= this.length) return -1;
        return idx % this.cols;
    }

    jfromidx(idx) {
        if (idx < 0) return -1;
        if (idx >= this.length) return -1;
        return Math.floor(idx/this.cols);
    }

    ijfromidx(idx) {
        if (idx < 0) return -1;
        if (idx >= this.length) return -1;
        return [idx % this.cols, Math.floor(idx/this.cols)];
    }

    idxfromij(i,j) {
        if (i < 0) return -1;
        if (j < 0) return -1;
        if (i >= this.cols) return -1;
        if (j >= this.rows) return -1;
        return i + this.cols*j;
    }

    idxfromdir(idx, dir) {
        return this.idxfromij(this.ifromidx(idx) + Direction.asX(dir), this.jfromidx(idx) + Direction.asY(dir));
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

    // -- accessor methods
    getij(i, j) {
        let idx = this.idxfromij(i, j);
        return this.entries[idx];
    }

    getidx(idx) {
        return this.entries[idx];
    }

    setij(i, j, v) {
        let idx = this.idxfromij(i, j);
        this.entries[idx] = v;
    }

    setidx(idx, v) {
        this.entries[idx] = v;
    }

    clear() {
        this.entries.splice(0);
    }

    // -- iterators
    *[Symbol.iterator]() {
        for (let i=0; i<this.length; i++) {
            yield *this.entries[i];
        }
    }

    *find(filter=(v) => true) {
        for (let i=0; i<this.length; i++) {
            let v = this.entries[i];
            if (filter(v)) yield [i, v];
        }
    }

}