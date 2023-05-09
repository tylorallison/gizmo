export { UiGrid };

import { Array2D } from "./array2d.js";
import { Bounds } from "./bounds.js";
import { EvtSystem } from "./event.js";
import { Fmt } from "./fmt.js";
import { Stats } from "./stats.js";
import { UiView } from "./uiView.js";
import { Vect } from "./vect.js";
import { Util } from "./util.js";

class UiGrid extends UiView {
    // FIXME: move all functions from schema to be static methods of the class.  You can change behavior by subclassing and overriding static functions.  
    // This makes it possible to serialize data and still have customizable functions.

    static {
        this.schema(this, 'locator', { readonly: true, dflt: ((gzo) => new Bounds({x:gzo.xform.bounds.minx+gzo.xform.x, y:gzo.xform.bounds.miny+gzo.xform.y, width:gzo.xform.bounds.width, height:gzo.xform.bounds.height})) });
        this.schema(this, 'bounds', { parser: (o,x) => (x.bounds || Bounds.zero), atUpdate: (r, o, k, ov, nv) => { console.log(`r: ${r} o: ${o}`); r.resize(); }});
        this.schema(this, 'createFilter', { readonly: true, dflt: ((gzo) => false) });
        this.schema(this, 'renderFilter', { eventable: false, dflt: ((idx, view) => true) });
        this.schema(this, 'optimizeRender', { eventable: false, dflt: true });
        this.schema(this, 'chunks', { link: false, parser: (o,x) => {
            if (x.chunks) return x.chunks;
            return new Array2D({rows: x.rows || 8, cols: x.cols || 8});
        }});
        this.schema(this, 'gzoIdxMap', { link: false, readonly: true, parser: (o,x) => new Map() });
        this.schema(this, 'rerender', { parser: (o,x) => true });
        this.schema(this, 'chunkUpdates', { readonly: true, parser: (o,x) => new Set()});
        this.schema(this, 'chunkCanvas', { readonly: true, parser: (o,x) => document.createElement('canvas') });
        this.schema(this, 'chunkCtx', { readonly: true, parser: (o,x) => o.chunkCanvas.getContext('2d') });
        this.schema(this, 'gridCanvas', { readonly: true, parser: (o,x) => document.createElement('canvas') });
        this.schema(this, 'gridCtx', { readonly: true, parser: (o,x) => o.gridCanvas.getContext('2d') });
        this.schema(this, 'chunkSort', { readonly: true, parser: (o,x) => x.chunkSort || ((a, b) => (a.z === b.z) ? a.xform.y-b.xform.y : a.z-b.z) });
        this.schema(this, 'alignx', { dflt: .5 });
        this.schema(this, 'aligny', { dflt: .5 });
        this.schema(this, 'rowSize', { parser: (o,x) => o.bounds.height/o.chunks.rows });
        this.schema(this, 'colSize', { parser: (o,x) => o.bounds.width/o.chunks.cols });
        this.schema(this, 'length', { getter: (o,x) => o.chunks.length });
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpre(spec) {
        super.cpre(spec);
        this.onChildUpdate = this.onChildUpdate.bind(this);
        this.onChildDestroyed = this.onChildDestroyed.bind(this);
        this.onViewCreated = this.onViewCreated.bind(this);
    }
    cpost(spec) {
        super.cpost(spec);
        // -- resize offscreen canvases
        this.gridCanvas.width = this.bounds.width;
        this.gridCanvas.height = this.bounds.height;
        this.chunkCanvas.width = this.colSize;
        this.chunkCanvas.height = this.rowSize;
        // handle view creation event handling
        if (this.createFilter) {
            EvtSystem.listen(this.gctx, this, 'gizmo.created', this.onViewCreated, { filter: (evt) => evt.actor && this.createFilter(evt.actor) });
        }
    }
    

    // EVENT HANDLERS ------------------------------------------------------
    onViewCreated(evt) {
        this.add(evt.actor);
    }

    onChildUpdate(evt) {
        Stats.count('UiGrid.onChildUpdate');
        //console.log(`onChildUpdate: ${Fmt.ofmt(evt)}`);
        let view = evt.actor;
        let needsUpdate = evt.render;
        // -- keep track of grid indices that need to be rerendered (e.g.: all grid indices associated with updated view before and after rechecking grid)
        let gidxs = this.idxof(view);
        for (const idx of gidxs) {
            needsUpdate = true;
            this.chunkUpdates.add(idx);
        }
        // -- recheck grid to update grid position
        this.recheck(view);
        gidxs = this.idxof(view);
        for (const idx of gidxs) {
            needsUpdate = true;
            this.chunkUpdates.add(idx);
        }
        //console.log(`needs update: ${needsUpdate} this: ${this}`);
        if (needsUpdate) EvtSystem.trigger(this, 'gizmo.updated');
    }

    onChildDestroyed(evt) {
        //console.log(`onChildDestroyed: ${Fmt.ofmt(evt)}`);
        this.remove(evt.actor);
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

    static vfromidx(idx, cols, colSize, rowSize, minx=0, miny=0, center=false) {
        return new Vect({
            x:this.xfromidx(idx, cols, colSize, minx, center),
            y:this.yfromidx(idx, cols, rowSize, miny, center)
        });
    }

    static getGridIdxs(loc, gbounds=Bounds.zero, colSize=0, rowSize=0, cols=0, rows=0) {
        // check that object overlaps w/ grid
        // check if object has bounds...
        let minx = 0, miny = 0, maxx = 0, maxy = 0;
        if (Bounds.iBounds(loc)) {
            minx = loc.minx;
            miny = loc.miny;
            maxx = Math.max(loc.minx,loc.maxx-1);
            maxy = Math.max(loc.miny,loc.maxy-1);
        // if object only has position...
        } else if (Vect.iVect(loc)) {
            minx = loc.x;
            miny = loc.y;
            maxx = loc.x;
            maxy = loc.y;
        // object doesn't have dimensions or position, so cannot be tracked in grid...
        } else {
            return [];
        }
        if (!Bounds._overlaps(gbounds.minx, gbounds.miny, gbounds.maxx, gbounds.maxy, minx, miny, maxx, maxy, true)) {
            return [];
        }
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

    // METHODS -------------------------------------------------------------
    has(gzo) {
        return this.gzoIdxMap.has(gzo.gid);
    }

    recheck(gzo) {
        if (!gzo) return;
        let ogidxs = this.gzoIdxMap.get(gzo.gid) || [];
        let ngidxs = this.getGridIdxs(gzo);
        if (!Util.arraysEqual(ogidxs, ngidxs)) {
            // remove old
            for (const idx of ogidxs) {
                if (!ngidxs.includes(idx)) {
                    let entries = this.chunks[idx] || [];
                    let i = entries.indexOf(gzo);
                    if (i >= 0) entries.splice(i, 1);
                }
            }
            // add new
            for (const idx of ngidxs) {
                if (!ogidxs.includes(idx)) {
                    if (!this.chunks[idx]) this.chunks[idx] = [];
                    this.chunks[idx].push(gzo);
                }
                if (this.gridSort) this.chunks[idx].sort(this.gridSort);
            }
            // assign new gidxs
            this.gzoIdxMap.set(gzo.gid, ngidxs);
        } else {
            // resort
            for (const idx of ngidxs) {
                if (this.chunkSort) this.chunks[idx].sort(this.chunkSort);
            }
        }
    }

    getLocal(worldPos, chain=true) {
        let localPos = this.xform.getLocal(worldPos, chain);
        localPos.x -= this.xform.minx + this.bounds.x + Math.round((this.xform.width - this.bounds.width)*this.alignx);
        localPos.y -= this.xform.miny + this.bounds.y + Math.round((this.xform.height - this.bounds.height)*this.aligny);
        return localPos;
    }

    getGridIdxs(gzo) {
        let loc = this.locator(gzo);
        return this.constructor.getGridIdxs(loc, this.bounds, this.colSize, this.rowSize, this.chunks.cols, this.chunks.rows)
    }

    ifromx(x) {
        let i = Math.floor((x-this.bounds.minx)/this.colSize);
        if (i < 0) i = 0;
        if (i >= this.chunks.cols) i = this.chunks.cols-1;
        return i;
    }

    jfromy(y) {
        let j = Math.floor((y-this.bounds.miny)/this.rowSize);
        if (j < 0) j = 0;
        if (j >= this.chunks.rows) j = this.chunks.rows-1;
        return j;
    }

    xfromidx(idx, center=false) {
        return (((idx % this.chunks.cols) * this.colSize) + ((center) ? this.colSize/2 : 0));
    }
    yfromidx(idx, center=false) {
        return ((Math.floor(idx/this.chunks.cols) * this.rowSize) + ((center) ? this.rowSize/2 : 0));
    }

    vfromidx(idx, center=false) {
        return new Vect({x:this.xfromidx(idx, center), y:this.yfromidx(idx, center)});
    }

    ifromidx(idx) {
        return this.chunks.ifromidx(idx);
    }

    jfromidx(idx) {
        return this.chunks.jfromidx(idx);
    }

    ijfromidx(idx) {
        return this.chunks.ijfromidx(idx);
    }

    idxfromij(i,j) {
        return this.chunks.idxfromij(i,j);
    }

    idxfromxy(x,y) {
        return this.chunks.idxfromij(this.ifromx(x),this.jfromy(y));
    }

    idxfromdir(idx, dir) {
        return this.chunks.idxfromdir(idx, dir);
    }

    idxsAdjacent(idx1, idx2) {
        return this.chunks.idxsAdjacent(idx1, idx2);
    }

    *idxsBetween(idx1, idx2) {
        yield *this.chunks.idxsBetween(idx1, idx2);
    }

    idxof(gzo) {
        let gidxs = this.gzoIdxMap.get(gzo.gid) || [];
        return gidxs.slice();
    }

    *[Symbol.iterator]() {
        let found = new Set();
        for (let idx=0; idx<this.chunks.length; idx++) {
            if (this.chunks[idx]) {
                let entries = Array.from(this.chunks[idx]);
                for (const gzo of entries) {
                    if (found.has(gzo.gid)) continue;
                    found.add(gzo.gid);
                    yield gzo;
                }
            }
        }
    }

    *keys() {
        for (let i=0; i<this.chunks.length; i++) {
            if (this.chunks[i]) yield i;
        }
    }

    *getij(i, j) {
        let idx = this.chunks.idxfromij(i, j);
        if (this.chunks[idx]) {
            yield *Array.from(this.chunks[idx]);
        }
    }

    *getidx(idx) {
        if (this.chunks[idx]) {
            yield *Array.from(this.chunks[idx]);
        }
    }

    *find(filter=(v) => true) {
        let found = new Set();
        for (let i=0; i<this.chunks.length; i++) {
            if (this.chunks[i]) {
                let entries = Array.from(this.chunks[i]);
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
        for (let i=0; i<this.chunks.length; i++) {
            if (this.chunks[i]) {
                let entries = Array.from(this.chunks[i]);
                for (const gzo of entries) {
                    if (filter(gzo)) return gzo;
                }
            }
        }
        return null;
    }

    *findAtIdx(gidxs, filter=(v) => true) {
        if (!Util.iterable(gidxs)) gidxs = [gidxs];
        let found = new Set();
        for (const idx of gidxs) {
            let entries = this.chunks[idx] || [];
            for (const gzo of Array.from(entries)) {
                if (found.has(gzo.gid)) continue;
                if (filter(gzo)) {
                    found.add(gzo.gid);
                    yield gzo;
                }
            }
        }
    }

    firstAtIdx(gidxs, filter=(v) => true) {
        if (!Util.iterable(gidxs)) gidxs = [gidxs];
        for (const idx of gidxs) {
            let entries = this.chunks[idx] || [];
            for (const gzo of Array.from(entries)) {
                if (filter(gzo)) {
                    return gzo;
                }
            }
        }
        return null;
    }

    *findAtPos(x, y, filter=(v) => true) {
        let gidxs = this.constructor.getGridIdxs({ x:x, y:y }, this.bounds, this.colSize, this.rowSize, this.chunks.cols, this.chunks.rows);
        for (const gzo of this.findAtIdx(gidxs, filter)) {
            let otherBounds = this.locator(gzo);
            if (Bounds.containsXY(otherBounds, x, y)) yield gzo;
        }
    }

    firstAtPos(x, y, filter=(v) => true) {
        let gidxs = this.constructor.getGridIdxs({ x:x, y:y }, this.bounds, this.colSize, this.rowSize, this.chunks.cols, this.chunks.rows);
        for (const gzo of this.findAtIdx(gidxs, filter)) {
            let otherBounds = this.locator(gzo);
            if (Bounds.containsXY(otherBounds, x, y)) return gzo;
        }
        return null;
    }

    *findAtBounds(bounds, filter=(v) => true) {
        let gidxs = this.constructor.getGridIdxs(bounds, this.bounds, this.colSize, this.rowSize, this.chunks.cols, this.chunks.rows);
        for (const gzo of this.findAtIdx(gidxs, filter)) {
            let otherBounds = this.locator(gzo);
            if (Bounds.overlaps(otherBounds, bounds)) yield gzo;
        }
    }

    firstAtBounds(bounds, filter=(v) => true) {
        let gidxs = this.constructor.getGridIdxs(bounds, this.bounds, this.colSize, this.rowSize, this.chunks.cols, this.chunks.rows);
        for (const gzo of this.findAtIdx(gidxs, filter)) {
            let otherBounds = this.locator(gzo);
            if (Bounds.overlaps(otherBounds, bounds)) return gzo;
        }
        return null;
    }

    add(gzo) {
        let gidxs = this.getGridIdxs(gzo);
        //console.log(`gzo: ${gzo} bounds: ${this.bounds} dim: ${this.chunks.cols},${this.chunks.rows} loc: ${this.locator(gzo)} gidxs: ${gidxs}`);
        let needsUpdate = false;
        // assign object to grid
        for (const idx of gidxs) {
            needsUpdate = true;
            if (!this.chunks[idx]) this.chunks[idx] = [];
            this.chunks[idx].push(gzo);
            if (this.chunkSort) this.chunks[idx].sort(this.chunkSort);
            // update list of updated chunks
            this.chunkUpdates.add(idx);
        }
        // assign gizmo gidx
        this.gzoIdxMap.set(gzo.gid, gidxs);
        // listen for gizmo events
        EvtSystem.listen(gzo, this, 'gizmo.updated', this.onChildUpdate);
        EvtSystem.listen(gzo, this, 'gizmo.destroyed', this.onChildDestroyed);
        // if chunkUpdates have been set, trigger update for grid
        if (needsUpdate) EvtSystem.trigger(this, 'gizmo.updated');
    }

    remove(gzo) {
        if (!gzo) return;
        // ignore gizmo events
        EvtSystem.ignore(gzo, this, 'gizmo.updated', this.onChildUpdate);
        EvtSystem.ignore(gzo, this, 'gizmo.destroyed', this.onChildDestroyed);
        let gidxs = this.gzoIdxMap.get(gzo.gid);
        this.gzoIdxMap.delete(gzo.gid);
        let needsUpdate = false;
        for (const idx of gidxs) {
            needsUpdate = true;
            let entries = this.chunks[idx] || [];
            let i = entries.indexOf(gzo);
            if (i >= 0) entries.splice(i, 1);
            //console.log(`remove adding idx to update: ${idx}`);
            this.chunkUpdates.add(idx);
        }
        if (needsUpdate) EvtSystem.trigger(this, 'gizmo.updated');
    }

    resize() {
        if ((this.bounds.width !== this.gridCanvas.width) || (this.bounds.height !== this.gridCanvas.height)) {
            this.rowSize = this.bounds.height/this.chunks.rows;
            this.colSize = this.bounds.width/this.chunks.cols;
            this.gridCanvas.width = this.bounds.width;
            this.gridCanvas.height = this.bounds.height;
            this.chunkCanvas.width = this.colSize;
            this.chunkCanvas.height = this.rowSize;
            let gzos = Array.from(this);
            this.chunks.clear();
            for (const gzo of gzos) {
                let gidxs = this.getGridIdxs(gzo);
                for (const idx of gidxs) {
                    if (!this.chunks[idx]) this.chunks[idx] = [];
                    this.chunks[idx].push(gzo);
                    if (this.chunkSort) this.chunks[idx].sort(this.chunkSort);
                }
            }
            if (this.chunkSort) {
                for (let idx=0; idx<this.chunks.length; idx++) {
                    if (this.chunks[idx]) this.chunks[idx].sort(this.chunkSort);
                }
            }
            this.rerender = true;
        }
    }

    renderChunk(idx, dx, dy) {
        // everything from the grid "chunk" is rendered to an offscreen chunk canvas
        let tx = this.xfromidx(idx);
        let ty = this.yfromidx(idx);
        //console.log(`d: ${dx},${dy} t: ${tx},${ty}`);
        if (this.optimizeRender) {
            if (!this.xform.bounds.overlaps(new Bounds({x:dx+tx, y:dy+ty, width:this.colSize, height:this.rowSize}))) {
                if (this.dbg) console.log(`-- chunk: ${idx} ${dx+tx},${dy+ty} is out of bounds against ${this.xform.bounds}`);
                return;
            }
        }
        this.chunkCtx.clearRect( 0, 0, this.colSize, this.rowSize );
        this.chunkCtx.translate(-tx, -ty);
        // iterate through all views at given idx
        let rendered = false;
        for (const view of this.getidx(idx)) {
            rendered = true;
            if (this.renderFilter(idx, view)) view.render(this.chunkCtx);
        }
        this.chunkCtx.translate(tx, ty);
        // -- resulting chunk is rendered to grid canvas
        this.gridCtx.clearRect(tx, ty, this.colSize, this.rowSize);
        this.gridCtx.drawImage(this.chunkCanvas, tx, ty);
    }

    subrender(ctx) {
        // compute delta between xform space and grid space
        let dx = this.xform.minx + this.bounds.x + Math.round((this.xform.width - this.bounds.width)*this.alignx);
        let dy = this.xform.miny + this.bounds.y + Math.round((this.xform.height - this.bounds.height)*this.aligny);
        // render any updated chunks
        if (this.rerender) {
            this.chunkUpdates.clear();
            this.rerender = false;
            for (let idx=0; idx<this.chunks.length; idx++) {
                this.renderChunk(idx, dx, dy);
            }
        } else {
            let chunkUpdates = Array.from(this.chunkUpdates);
            this.chunkUpdates.clear();
            for (const idx of chunkUpdates) {
                this.renderChunk(idx, dx, dy);
            }
        }
        // render grid canvas
        ctx.drawImage(this.gridCanvas, dx, dy);
        // overlay grid
        if (this.dbg && this.dbg.grid) {
            for (let i=0; i<=this.chunks.cols; i++) {
                ctx.strokeStyle = 'rgba(0,255,0,.5)';
                ctx.beginPath();
                ctx.moveTo(dx+i*this.colSize, dy);
                ctx.lineTo(dx+i*this.colSize, dy+this.bounds.height);
                ctx.stroke();
            }
            for (let j=0; j<=this.chunks.rows; j++) {
                ctx.strokeStyle = 'rgba(0,255,0,.5)';
                ctx.beginPath();
                ctx.moveTo(dx, dy+this.rowSize*j);
                ctx.lineTo(dx+this.bounds.width, dy+this.rowSize*j);
                ctx.stroke();
            }
        }


    }


}