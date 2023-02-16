export { UiGrid };

import { Array2D } from "./array2d.js";
import { Bounds } from "./bounds.js";
import { EvtSystem } from "./event.js";
import { Fmt } from "./fmt.js";
//import { Bounds } from "./bounds.js";
//import { Fmt } from "./fmt.js";
//import { Grid } from "./grid.js";
import { Schema } from "./schema.js";
//import { Stats } from "./stats.js";
import { UiView } from "./uiView.js";
import { Vect } from "./vect.js";
//import { Vect } from "./vect.js";


class UiGrid extends UiView {

    static {
        //Schema.apply(this, 'locator', { readonly: true, dflt: ((gzo) => gzo.xform) });
        /*
        Schema.apply(this, 'locator', { readonly: true, dflt: (gzo) => {
            let wmin = gzo.xform.getWorld(new Vect(gzo.xform.bounds.minx, gxo.xform.bounds.miny), false);
            let wmax = gzo.xform.getWorld(new Vect(gzo.xform.bounds.maxx, gxo.xform.bounds.maxy), false);
            return new Bounds(wmin.x, wmin.y, wmax.x-wmin.x, wmax.y-wmin.y);
        }});
        */

        Schema.apply(this, 'locator', { readonly: true, dflt: ((gzo) => new Bounds(gzo.xform.bounds.minx+gzo.xform.x, gzo.xform.bounds.miny+gzo.xform.y, gzo.xform.bounds.width, gzo.xform.bounds.height)) });
        Schema.apply(this, 'bounds', { readonly: true, parser: (o,x) => x.bounds || Bounds.zero });

        //Schema.apply(this, 'dbg', { dflt: false });
        //Schema.apply(this, 'rowSize', { readonly: true, parser: (o,x) => o.bounds.height/o.rows });
        //Schema.apply(this, 'colSize', { readonly: true, parser: (o,x) => o.bounds.width/o.cols });

        Schema.apply(this, 'createFilter', { readonly: true, dflt: ((gzo) => false) });

        Schema.apply(this, 'renderFilter', { dflt: ((idx, view) => true) });
        Schema.apply(this, 'chunks', { parser: (o,x) => {
            if (x.chunks) return x.chunks;
            return new Array2D({rows: x.rows || 8, cols: x.cols || 8});
        }});
        Schema.apply(this, 'gidUpdates', { readonly: true, parser: (o,x) => new Set()});
        Schema.apply(this, 'chunkCanvas', { readonly: true, parser: (o,x) => document.createElement('canvas') });
        Schema.apply(this, 'chunkCtx', { readonly: true, parser: (o,x) => o.chunkCanvas.getContext('2d') });
        Schema.apply(this, 'gridCanvas', { readonly: true, parser: (o,x) => document.createElement('canvas') });
        Schema.apply(this, 'gridCtx', { readonly: true, parser: (o,x) => o.gridCanvas.getContext('2d') });
        Schema.apply(this, 'gridSort', { readonly: true, parser: (o,x) => x.gridSort || ((a, b) => (a.z === b.z) ? a.xform.y+a.maxy-(b.xform.y+b.maxy) : a.z-b.z) });

        // FIXME: eval
        Schema.apply(this, 'rowSize', { readonly: true, parser: (o,x) => o.bounds.height/o.chunks.rows });
        Schema.apply(this, 'colSize', { readonly: true, parser: (o,x) => o.bounds.width/o.chunks.cols });
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpost(spec) {
        super.cpost(spec);
        // -- event handlers
        /*
        this.onAdopted = this.onAdopted.bind(this);
        this.onOrphaned = this.onOrphaned.bind(this);
        this.onChildUpdate = this.onChildUpdate.bind(this);
        this.evt.listen(this.constructor.evtAdopted, this.onAdopted);
        this.evt.listen(this.constructor.evtOrphaned, this.onOrphaned);
        this.evt.listen(this.constructor.evtRooted, this.onResized);
        */

        // handle view creation event handling
        if (this.createFilter) {
            this.onViewCreated = this.onViewCreated.bind(this);
            EvtSystem.listen(this.gctx, this, 'gizmo.created', this.onViewCreated, { filter: (evt) => evt.actor && this.createFilter(evt.actor) });
        }

        // -- render filter
        //this.renderFilter = spec.renderFilter || ((idx, view) => true);
        // -- grid
        /*
        this.rows = spec.rows || this.constructor.dfltRows;
        this.cols = spec.cols || this.constructor.dfltCols;
        this.grid = new Grid({
            bounds: this.xform.bounds, 
            //dbg: true, 
            locator: (v) => v.xform.getWorldBounds(false),
            gridSort: (a, b) => (a.z === b.z) ? a.xform.y+a.maxy-(b.xform.y+b.maxy) : a.z-b.z,
        });
        */
        //this.gidupdates = new Set();
        // offscreen canvases for rendering
        //this.sliceCanvas = document.createElement('canvas');
        //this.sliceCtx = this.sliceCanvas.getContext('2d');
        //this.gridCanvas = document.createElement('canvas');
        //this.gridCtx = this.gridCanvas.getContext('2d');
    }
    destroy(spec) {
        /*
        this.evt.ignore(this.constructor.evtAdopted, this.onAdopted);
        this.evt.ignore(this.constructor.evtOrphaned, this.onOrphaned);
        this.evt.ignore(this.constructor.evtRooted, this.onResized);
        */
        super.destroy();
    }

    // EVENT HANDLERS ------------------------------------------------------
    onViewCreated(evt) {
        console.log(`${this} onViewCreated: ${Fmt.ofmt(evt)}`);
        let gidxs = this.getgidx(evt.actor);
        console.log(`gidxs: ${gidxs}`);
    }

    /*
    onAdopted(evt) {
        if (evt.actor !== this) return;
        let child = evt.child;
        //console.log(`-----  onAdopted: ${child}`)
        if (!child) return;
        // -- listen for child updates
        child.evt.listen(child.constructor.evtUpdated, this.onChildUpdate)
        // -- add to grid and note grid index updates
        this.grid.add(child);
        let gidx = this.grid.idxof(child);
        //if (child.idx === 6757) console.log(`====> ${child} has idxs: ${gidx}`);
        for (const idx of gidx) this.gidupdates.add(idx);
    }
    */

    /*
    onOrphaned(evt) {
        if (evt.actor !== this) return;
        let child = evt.child;
        if (!child) return;
        // -- ignore child updates
        child.evt.ignore(child.constructor.evtUpdated, this.onChildUpdate)
        // -- remove from grid and note grid index updates
        let gidx = this.grid.idxof(child);
        for (const idx of gidx) this.gidupdates.add(idx);
        //console.log(`gid updates ${Array.from(this.gidupdates)}`);
        this.grid.remove(child);
        this.evt.trigger(this.constructor.evtUpdated, {actor: this});
    }
    */

    /*
    onChildUpdate(evt) {
        Stats.count("UiGrid.onChildUpdate");
        let view = evt.actor;
        if (!this.grid.contains(view)) return;
        //console.error(`-- onChildUpdate: ${Fmt.ofmt(evt)}`);
        // -- keep track of grid indices that need to be rerendered (e.g.: all grid indices associated with updated view before and after rechecking grid)
        let gidx = this.grid.idxof(view);
        for (const idx of gidx) this.gidupdates.add(idx);
        // -- recheck grid to update grid position
        this.grid.recheck(view);
        gidx = this.grid.idxof(view);
        //if (view.idx === 6757) console.log(`====> ${view} has idxs: ${gidx}`);
        for (const idx of gidx) this.gidupdates.add(idx);
        this.evt.trigger(this.constructor.evtUpdated, {actor: this});
    }
    */

    /*
    onResized(evt) {
        let bounds = this.xform.bounds;
        // grid update
        if (!bounds.equals(this.grid.bounds)) {
            this.grid.resize(bounds, this.grid.cols, this.grid.rows);
        }
        // canvas update
        if (bounds.width !== this.sliceCanvas.width || bounds.height !== this.sliceCanvas.height) {
            this.sliceCanvas.width = bounds.width;
            this.sliceCanvas.height = bounds.height;
            this.gridCanvas.width = bounds.width;
            this.gridCanvas.height = bounds.height;
            for (const gidx of this.grid.keys()) this.gidupdates.add(gidx);
        }
        //console.log(`*** uiGrid on resize: ${Fmt.ofmt(evt)} bounds: ${this.xform.bounds}`);
        super.onResized(evt);
    }
    */

    // METHODS -------------------------------------------------------------
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

    static getgidx(loc, gbounds=Bounds.zero, colSize=0, rowSize=0, cols=0, rows=0) {
        // FIXME: need to ensure that if gzo doesn't have dimensions, but does have position, that it will result in an index
        // check that object overlaps w/ grid
        // check if object has bounds...
        let minx = 0, miny = 0, maxx = 0, maxy = 0;
        if (Bounds.hasBounds(loc)) {
            minx = loc.minx;
            miny = loc.miny;
            maxx = Math.max(loc.minx,loc.maxx-1);
            maxy = Math.max(loc.miny,loc.maxy-1);
        // if object only has position...
        } else if (Vect.hasVect(loc)) {
            minx = gzo.x;
            miny = gzo.y;
            maxx = gzo.x;
            maxy = gzo.y;
        // object doesn't have dimensions or position, so cannot be tracked in grid...
        } else {
            return null;
        }
        if (!Bounds._overlaps(gbounds.minx, gbounds.miny, gbounds.maxx, gbounds.maxy, minx, miny, maxx, maxy, true)) {
            console.log(`no overlap`);
            return null;
        }
        //if (!gbounds.overlaps(loc)) return null;
        let gidx = [];
        let maxi = this.ifromx(maxx, colSize, gbounds.minx, cols);
        let maxj = this.jfromy(maxy, rowSize, gbounds.miny, rows);
        for (let i=this.ifromx(minx, colSize, gbounds.minx, cols); i<=maxi; i++) {
            for (let j=this.jfromy(miny, rowSize, gbounds.miny, rows); j<=maxj; j++) {
                // compute grid index
                let idx = Array2D.idxfromij(i,j,cols,rows);
                // track object gidx
                gidx.push(idx);
            }
        }
        return gidx;
    }

    getgidx(gzo) {
        let loc = this.locator(gzo);
        console.log(`loc: ${loc}`);
        return this.constructor.getgidx(loc, this.bounds, this.colSize, this.rowSize, this.chunks.cols, this.chunks.rows)
    }

    add(gzo) {
    }

    /*
    renderSlice(idx) {
        // everything from the grid "slice" is rendered to an offscreen slice canvas
        let dx = this.grid.xfromidx(idx) - this.grid.minx;
        let dy = this.grid.yfromidx(idx) - this.grid.miny;
        let tx = -this.xform.minx;
        let ty = -this.xform.miny;
        this.sliceCtx.clearRect( dx, dy, this.grid.colSize, this.grid.rowSize );
        //console.log(`slice translate ${tx},${ty}`);
        this.sliceCtx.translate(tx, ty);
        // iterate through all views at given idx
        let rendered = false;
        for (const view of this.grid.getidx(idx)) {
            rendered = true;
            if (this.renderFilter(idx, view)) view.render(this.sliceCtx);
            //console.log(`    >> render ${view} ${this.renderFilter(idx, view)}`);
        }
        this.sliceCtx.translate(-tx, -ty);
        //console.log(`renderSlice: ${idx} dx: ${dx} dy: ${dy} rendered: ${rendered}`);
        // -- resulting slice is rendered to grid canvas
        this.gridCtx.clearRect(dx, dy, this.grid.colSize, this.grid.rowSize);
        //console.log(`drawImage: ${this.xform.minx+dx},${this.xform.miny+dy}`);
        this.gridCtx.drawImage(this.sliceCanvas, 
            dx, dy, this.grid.colSize, this.grid.rowSize, 
            dx, dy, this.grid.colSize, this.grid.rowSize);
    }
    */

    /*
    _childrender(ctx) {
        // render any updated slices
        //console.log(`--- child render: ${Array.from(this.gidupdates).sort()}`);
        let gidupdates = Array.from(this.gidupdates);
        this.gidupdates.clear();
        for (const idx of gidupdates) {
            //console.log(`  >> render slice for ${idx}`);
            this.renderSlice(idx);
        }
        //console.log(`--- after renderslices: ${Array.from(this.gidupdates).sort()}`);
        // -- render grid canvas to given context
        if (this.gridCanvas.width && this.gridCanvas.height) {
            ctx.drawImage(this.gridCanvas, 
                0, 0, this.gridCanvas.width, this.gridCanvas.height,
                this.xform.minx, this.xform.miny, this.gridCanvas.width, this.gridCanvas.height);
        }
        if (this.gidupdates.size) this.evt.trigger(this.constructor.evtUpdated, {actor: this});
    }
    */

    /*
    _render(ctx) {
        //console.log(`--- uiGrid._render bounds ${this.bounds}`);
        if (this.dbg && this.dbg.viewGrid) this.grid.render(ctx, this.xform.minx, this.xform.miny);
    }
    */

    subrender(ctx) {
        ctx.strokeStyle = 'red';
        let width = 50;
        let height = 250;
        let alignx = 0;
        let aligny = 0;
        let xo = Math.round((this.xform.width - width)*alignx);
        let yo = Math.round((this.xform.height - height)*aligny);
        let dx = 25;
        let dy = 0;
        ctx.strokeRect(dx+xo+this.xform.minx, dy+yo+this.xform.miny, 50, 250);
    }


}