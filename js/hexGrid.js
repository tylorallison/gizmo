export { HexGrid };

import { Bounds } from './bounds.js';
import { HexArray } from './hexArray.js';
import { Contains, Overlaps } from './intersect.js';
import { Tri } from './tri.js';
import { Vect } from './vect.js';


class HexGrid extends HexArray {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema(this, 'locator', { readonly: true, dflt: ((v) => v.xform) });
        //this.schema(this, 'bounds', { readonly: true, parser: (o,x) => x.bounds || Bounds.zero });
        this.schema(this, 'dbg', { eventable: false, dflt: false });
        this.schema(this, 'tileSize', { readonly: true, dflt: 32 });
    }

    // STATIC METHODS ------------------------------------------------------
    static getgidx(objBounds, gridBounds=Bounds.zero, tileSize=0, cols=0, rows=0) {
        //console.log(`objBounds: ${objBounds} gridBounds: ${gridBounds}`);
        if (!Overlaps.bounds(gridBounds, objBounds)) return null;
        let qtr = tileSize*.25;
        let half = tileSize*.5;
        let rsize = qtr+half;
        let qmini = Math.floor(objBounds.minx/half);
        let qminj = Math.floor(objBounds.miny/qtr);
        let mminx = objBounds.minx%half;
        let mminy = objBounds.miny%qtr;
        let qmaxi = Math.floor((objBounds.maxx-1)/half);
        let qmaxj = Math.floor((objBounds.maxy-1)/qtr);
        let mmaxx = (objBounds.maxx-1)%half;
        let mmaxy = (objBounds.maxy-1)%qtr;
        let idxs = [];
        //console.log(`======= qmin: ${qmini},${qminj} qmax: ${qmaxi},${qmaxj} qtr: ${qtr} half: ${half}`);
        let j = Math.floor((objBounds.miny)/rsize);
        for ( let qj=qminj; qj<=qmaxj; qj++) {
            let mqj = (qj%3);
            let ioff = (qj%6) > 2;
            let i = (ioff) ? (qmini-1) >> 1 : qmini >> 1;
            let idx;
            for (let qi=qmini; qi<=qmaxi; qi++) {
                let mqi = (!ioff) ? (qi%2) : ((qi+1)%2);
                idx = this.idxfromij(i,j,cols,rows);
                //console.log(`-- q ${qi},${qj} ioff: ${ioff} mq: ${mqi},${mqj} i,j: ${i},${j} idx: ${idx}`);
                // hex top left
                if (mqi === 0 && mqj === 0) {
                    // along the top most row
                    if (qj === qminj) {
                        if ((half-mminx) > 2*mminy) {
                            idx = this.idxfromij((ioff) ? i : i-1, j-1, cols, rows);
                            //console.log(`>> TTL ${(ioff) ? i : i-1},${j-1} idx: ${idx}`);
                            if (idx !== -1) idxs.push(idx);
                        }
                    } else if (qj === qmaxj && qi === qmaxi) {
                        if ((half-mmaxx) <= 2*mmaxy) {
                            idx = this.idxfromij(i, j, cols, rows);
                            //console.log(`>> BRTL ${(ioff) ? i+1 : i},${j+1} idx: ${idx}`);
                            if (idx !== -1) idxs.push(idx);
                        }
                    }
                    // we have more quadrants to the right or below...
                    if (qi !== qmaxi || qj !== qmaxj) {
                        idx = this.idxfromij(i,j,cols,rows);
                        //console.log(`>> TL ${i},${j} idx: ${idx}`);
                        if (idx !== -1) idxs.push(idx);
                    // special case... check if bounds is within one quadrant
                    } else {
                        if ((half-mmaxx) <= (2*mminy)) {
                            idx = this.idxfromij(i,j,cols,rows);
                            //console.log(`>> TLSC ${i},${j} idx: ${idx}`);
                            if (idx !== -1) idxs.push(idx);
                        }
                    }
                // hex top right
                } else if (mqi === 1 && mqj === 0) {
                    // top most right
                    if (qi === qmaxi && qj === qminj) {
                        //console.log(`TR HERE2 mmaxx: ${mmaxx} vs ${mminy}`);
                        if (mmaxx > (2*mminy)) {
                            idx = this.idxfromij((ioff) ? i+1 : i,j-1,cols,rows);
                            //console.log(`>> TTR ${(ioff) ? i+1 : i},${j-1} idx: ${idx}`);
                            if (idx !== -1) idxs.push(idx);
                        }
                    }
                    // at left edge w/ tiles below
                    if (qi === qmini && qi !== qmaxi) {
                        idx = this.idxfromij(i,j,cols,rows);
                        //console.log(`>> TR ${i},${j} idx: ${idx}`);
                        if (idx !== -1) idxs.push(idx);
                    // special case... check if bounds is within one quadrant
                    } else if (qi === qmini && qj === qmaxj) {
                        //console.log(`TR HERE mminx: ${mminx} vs ${2*mmaxy}`);
                        if (mminx <= (2*mmaxy)) {
                            idx = this.idxfromij(i,j,cols,rows);
                            //console.log(`>> TRSC ${i},${j} idx: ${idx}`);
                            if (idx !== -1) idxs.push(idx);
                        }
                    }
                // hex mid
                } else {
                    // top row is mid
                    if (qj === qminj) {
                        idx = this.idxfromij(i,j,cols,rows);
                        //console.log(`>> M ${i},${j} idx: ${idx}`);
                        if (idx !== -1) idxs.push(idx);
                    }
                }
                if (mqi > 0 && qi !== qmaxi) i++;
            }
            if (mqj > 1) j++;
        }
        idxs.sort((a,b) => a-b);
        //console.log(`idxs: ${idxs}`);
        return idxs;
    }

    static ijfromp(p, tileSize, minx=0, miny=0) {
        if (!p) return null;
        let qtr = tileSize*.25;
        let half = tileSize*.5;
        let rsize = qtr+half;
        let j = Math.floor((p.y-miny)/rsize);
        let xoff = (j%2) ? half : 0;
        let i = Math.floor((p.x-xoff-minx)/tileSize);
        let xm = (p.x-xoff) % tileSize;
        let ym = p.y % rsize;
        // check if point within mid bounds of hex...
        if (ym >= qtr) {
            return new Vect({x:i, y:j});
        // check if point is within top tri of test hex
        } else if (Contains.tri(new Tri({p1: {x:0, y:qtr}, p2: {x:half, y:0}, p3: {x:tileSize, y:qtr}}), {x:xm, y:ym})) {
            return new Vect({x:i, y:j});
        } else if (xm < half) {
            return new Vect({x: (j%2) ? i : i-1, y:j-1});
        }
        return new Vect({x: (j%2) ? i+1 : i, y:j-1});
    }
    /*
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
    */

    render(ctx, x=0, y=0, width=0, height=0, color='rgba(0,255,255,.5)', occupiedColor='red') {
        let half = Math.round(this.tileSize*.5);
        let qtr = Math.round(this.tileSize*.25);
        let rowSize = Math.round(this.tileSize*.75);
        //console.log(`half: ${half} qtr: ${qtr} rowSize: ${rowSize}`);
        //console.log(`render cols: ${this.cols} rows: ${this.rows}`);
        let path = new Path2D();
        path.moveTo(-half, -qtr);
        path.lineTo(0, -half);
        path.lineTo(half, -qtr);
        path.lineTo(half, qtr);
        path.lineTo(0, half);
        path.lineTo(-half, qtr);
        //ctx.moveTo(-half, -qtr);
        path.closePath();

        for (let i=0; i<this.cols; i++) {
            for (let j=0; j<this.rows; j++) {
                let dx = this.tileSize*i + half + ((j%2) ? half : 0);
                let dy = rowSize*j + half;
                let idx = this.idxfromij(i, j);
                let entries = this.entries[idx] || [];
                ctx.translate(x+dx, y+dy);
                ctx.strokeStyle = (entries.length) ? occupiedColor : color;
                ctx.lineWidth = 1;
                ctx.stroke(path);
                ctx.translate(-(x+dx), -(y+dy));
            }
        }
    }

    
}