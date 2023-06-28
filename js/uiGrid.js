export { UiGrid };

import { Bounds } from './bounds.js';
import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { Stats } from './stats.js';
import { UiView } from './uiView.js';
import { Direction } from './direction.js';
import { Grid } from './grid.js';
import { HexGrid } from './hexgrid.js';
import { Vect } from './vect.js';
import { Overlaps } from './intersect.js';

class UiGrid extends UiView {
    // FIXME: move all functions from schema to be static methods of the class.  You can change behavior by subclassing and overriding static functions.  
    // This makes it possible to serialize data and still have customizable functions.

    static {
        this.schema(this, 'bounder', { readonly: true, dflt: ((gzo) => new Bounds({x:gzo.xform.bounds.minx+gzo.xform.x, y:gzo.xform.bounds.miny+gzo.xform.y, width:gzo.xform.bounds.width, height:gzo.xform.bounds.height})) });
        //this.schema(this, 'bounds', { parser: (o,x) => (x.bounds || Bounds.zero), atUpdate: (r, o, k, ov, nv) => { console.log(`r: ${r} o: ${o}`); r.resize(); }});
        this.schema(this, 'createFilter', { readonly: true, dflt: ((gzo) => false) });
        this.schema(this, 'renderFilter', { eventable: false, dflt: ((idx, view) => true) });
        this.schema(this, 'optimizeRender', { eventable: false, dflt: true });
        this.schema(this, 'chunks', { link: false, parser: (o,x) => {
            if (x.chunks) return x.chunks;
            const rows = x.rows || 8;
            const cols = x.cols || 8;
            const xgrid = {
                rows: rows,
                cols: cols,
                colSize: o.xform.width/cols,
                rowSize: o.xform.height/rows,
                bounder: o.bounder,
                bucketSort: x.bucketSort || ((a, b) => (a.z === b.z) ? a.xform.y-b.xform.y : a.z-b.z),
            }
            if (x.hex) {
                return new HexGrid(xgrid);
            } else {
                return new Grid(xgrid);
            }
        }});
        this.schema(this, 'gzoIdxMap', { link: false, readonly: true, parser: (o,x) => new Map() });
        this.schema(this, 'rerender', { parser: (o,x) => true });
        this.schema(this, 'chunkUpdates', { readonly: true, parser: (o,x) => new Set()});
        this.schema(this, 'chunkCanvas', { readonly: true, parser: (o,x) => document.createElement('canvas') });
        this.schema(this, 'chunkCtx', { readonly: true, parser: (o,x) => o.chunkCanvas.getContext('2d') });
        this.schema(this, 'gridCanvas', { readonly: true, parser: (o,x) => document.createElement('canvas') });
        this.schema(this, 'gridCtx', { readonly: true, parser: (o,x) => o.gridCanvas.getContext('2d') });
        this.schema(this, 'alignx', { dflt: .5 });
        this.schema(this, 'aligny', { dflt: .5 });
        this.schema(this, 'rowSize', { parser: (o,x) => o.xform.height/o.chunks.rows });
        this.schema(this, 'colSize', { parser: (o,x) => o.xform.width/o.chunks.cols });
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
        this.gridCanvas.width = this.xform.width;
        this.gridCanvas.height = this.xform.height;
        this.chunkCanvas.width = this.chunks.colSize;
        this.chunkCanvas.height = this.chunks.rowSize;
        //console.log(`${this} size ${this.xform.width},${this.xform.height} dim: ${this.chunks.cols},${this.chunks.rows} csize: ${this.chunks.colSize},${this.chunks.rowSize}`)
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
        let view = evt.actor;
        let needsUpdate = evt.render;
        // -- keep track of grid indices that need to be rerendered (e.g.: all grid indices associated with updated view before and after rechecking grid)
        let gidxs = this.chunks.idxof(view);
        for (const idx of gidxs) {
            needsUpdate = true;
            this.chunkUpdates.add(idx);
        }
        // -- recheck grid to update grid position
        this.chunks.recheck(view);
        gidxs = this.idxof(view);
        for (const idx of gidxs) {
            needsUpdate = true;
            this.chunkUpdates.add(idx);
        }
        if (needsUpdate) EvtSystem.trigger(this, 'gizmo.updated');
    }

    onChildDestroyed(evt) {
        //console.log(`onChildDestroyed: ${Fmt.ofmt(evt)}`);
        this.remove(evt.actor);
    }

    // STATIC METHODS ------------------------------------------------------

    // METHODS -------------------------------------------------------------

    // grid proxy functions
    includes(gzo) { return this.chunks.includes(gzo); }
    idxsFromGzo(gzo) { return this.chunks.idxsFromGzo(gzo); }
    _ijFromPoint(x, y) { return this.chunks._ijFromPoint(x,y); }
    ijFromPoint(p) { return this.chunks.ijFromPoint(p); }
    pointFromIdx(idx, center=false) { return this.chunks.pointFromIdx(idx, center); }
    _pointFromIJ(i, j, center=false) { return this.chunks._pointFromIJ(i, j, center); }
    pointFromIJ(ij, center=false) { return this.chunks.pointFromIJ(ij, center); }
    ijFromIdx(idx) { return this.chunks.ijFromIdx(idx); }
    _idxFromIJ(i,j) { return this.chunks._idxFromIJ(i,j); }
    idxFromIJ(ij) { return this.chunks.idxFromIJ(ij); }
    _idxFromPoint(x, y) { return this.chunks._idxFromPoint() }
    idxFromPoint(xy) { return this.chunks.idxFromPoint(xy); }
    idxFromDir(idx, dir) { return this.chunks.idxFromDir(idx, dir); }
    idxsAdjacent(idx1, idx2) { return this.chunks.idxsAdjacent(idx1, idx2); }
    *idxsBetween(idx1, idx2) { yield *this.chunks.idxsBetween(idx1, idx2); }
    idxof(gzo) { return this.chunks.idxof(gzo); }
    *[Symbol.iterator]() { yield *this.chunks; }
    *keys() { yield *this.chunks.keys(); }
    *_getij(i, j) { yield *this.chunks._getij(i,j); }
    *getij(ij) { yield *this.chunks.getij(ij); }
    *getidx(idx) { yield *this.chunks.getidx(idx); }
    *find(filter=(v) => true) { yield *this.chunks.find(filter); }
    first(filter=(v) => true) { return this.chunks.first(filter); }
    *findForIdx(gidxs, filter=(v) => true) { yield *this.chunks.findForIdx(gidxs, filter); }
    firstForIdx(gidxs, filter=(v) => true) { return this.chunks.firstForIdx(gidxs, filter); }
    *_findForPoint(x, y, filter=(v) => true) { yield *this.chunks._findForPoint(x, y, filter); }
    *findForPoint(p, filter=(v) => true) { yield *this.chunks.findForPoint(p, filter); }
    _firstForPoint(x, y, filter=(v) => true) { return this.chunks._firstForPoint(x, y, filter); }
    firstForPoint(p, filter=(v) => true) { return this.chunks.firstForPoint(p, filter); }
    *_findForBounds(bminx, bminy, bmaxx, bmaxy, filter=(v) => true) { yield *this.chunks._findForBounds(bminx, bminy, bmaxx, bmaxy, filter); }
    *findForBounds(b, filter=(v) => true) { yield *this.chunks.findForBounds(b, filter); }
    _firstForBounds(bminx, bminy, bmaxx, bmaxy, filter=(v) => true) { return this.chunks._firstForBounds(bminx, bminy, bmaxx, bmaxy, filter); }
    firstForBounds(b, filter=(v) => true) { return this.chunks.firstForBounds(b, filter); }
    *findForNeighbors(idx, filter=(v) => true, dirs=Direction.any) { yield *this.chunks.findForNeighbors(idx, filter, dirs); }
    firstForNeighbors(idx, filter=(v) => true, dirs=Direction.any) { return this.chunks.firstForNeighbors(idx, filter, dirs); }

    getLocal(worldPos, chain=true) {
        let localPos = this.xform.getLocal(worldPos, chain);
        //localPos.x -= this.xform.minx + Math.round((this.xform.width)*this.alignx);
        //localPos.y -= this.xform.miny + Math.round((this.xform.height)*this.aligny);
        localPos.x -= this.xform.minx;
        localPos.y -= this.xform.miny;
        return localPos;
    }

    add(gzo) {
        // add to grid
        this.chunks.add(gzo);
        // retrieve idxs
        let gidxs = this.chunks.idxof(gzo);
        let needsUpdate = false;
        // assign object to grid
        for (const idx of gidxs) {
            needsUpdate = true;
            // update list of updated chunks
            this.chunkUpdates.add(idx);
        }
        // listen for gizmo events
        EvtSystem.listen(gzo, this, 'gizmo.updated', this.onChildUpdate);
        EvtSystem.listen(gzo, this, 'gizmo.destroyed', this.onChildDestroyed);
        // if chunkUpdates have been set, trigger update for grid
        if (needsUpdate) EvtSystem.trigger(this, 'gizmo.updated');
    }

    remove(gzo) {
        if (!gzo) return;
        // retrieve idxs for gzo
        const gidxs = this.chunks.idxof(gzo);
        // remove from grid
        this.chunks.remove(gzo);
        // ignore gizmo events
        EvtSystem.ignore(gzo, this, 'gizmo.updated', this.onChildUpdate);
        EvtSystem.ignore(gzo, this, 'gizmo.destroyed', this.onChildDestroyed);
        let needsUpdate = false;
        for (const idx of gidxs) {
            needsUpdate = true;
            this.chunkUpdates.add(idx);
        }
        if (needsUpdate) EvtSystem.trigger(this, 'gizmo.updated');
    }

    resize() {
        console.log(`-- resize`);
        // FIXME
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
                let gidxs = this.chunks.idxof(gzo);
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
        // everything from the grid 'chunk' is rendered to an offscreen chunk canvas
        let t = this.pointFromIdx(idx);
        //console.log(`idx: ${idx} d: ${dx},${dy} t: ${t.x},${t.y}`);
        if (this.parent && this.optimizeRender) {
            const min = this.xform.getWorld({x:t.x+dx, y:t.y+dy}, false);
            const max = this.xform.getWorld({x:t.x+dx+this.colSize, y:t.y+dy+this.rowSize}, false);
            if (!Overlaps.bounds(this.parent.xform.bounds, {minx:min.x, miny:min.y, maxx: max.x, maxy:max.y})) {
                if (this.dbg) console.log(`-- chunk: ${idx} ${t.x},${t.y} is out of bounds against ${this.xform.bounds}`);
                return;
            }
        }
        this.chunkCtx.clearRect( 0, 0, this.colSize, this.rowSize );
        this.chunkCtx.translate(-t.x, -t.y);
        // iterate through all views at given idx
        let rendered = false;
        for (const view of this.getidx(idx)) {
            rendered = true;
            if (this.renderFilter(idx, view)) {
                //console.log(`render view: ${view} to ${this.chunkCtx}`);
                view.render(this.chunkCtx);
            }
        }
        this.chunkCtx.translate(t.x, t.y);
        // -- resulting chunk is rendered to grid canvas
        if (rendered) {
            this.gridCtx.clearRect(t.x, t.y, this.colSize, this.rowSize);
            this.gridCtx.drawImage(this.chunkCanvas, t.x, t.y);
        }
    }

    subrender(ctx) {
        // compute delta between xform space and grid space
        let dx = this.xform.minx;
        let dy = this.xform.miny;
        //let p = { x:0, y:0 };
        //let wp = this.xform.getWorld(p, false);
        //wp = this.xform.parent.getWorld(wp, false);
        //console.log(`delta: ${this.xform.x},${this.xform.y} wp: ${wp}`);
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
            this.chunks.render(ctx, dx, dy);
        }


    }


}