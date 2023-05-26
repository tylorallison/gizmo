export { HexGrid };

import { Bounds } from './bounds.js';
import { HexArray } from './hexArray.js';


class HexGrid extends HexArray {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema(this, 'locator', { readonly: true, dflt: ((v) => v.xform) });
        //this.schema(this, 'bounds', { readonly: true, parser: (o,x) => x.bounds || Bounds.zero });
        this.schema(this, 'dbg', { eventable: false, dflt: false });
        this.schema(this, 'tileSize', { readonly: true, dflt: 32 });
    }

    // STATIC METHODS ------------------------------------------------------
    /*
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