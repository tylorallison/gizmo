export { UiGrid };

import { Bounds } from './bounds.js';
import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { Stats } from './stats.js';
import { UiView } from './uiView.js';
import { Direction } from './direction.js';
import { Grid } from './grid.js';

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
            return new Grid({
                rows: x.rows || 8, 
                cols: x.cols || 8, 
                rowSize: x.rowSize || x.size || 32,
                colSize: x.colSize || x.size || 32,
            });
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
    ijFromIdx(idx) { return this.chunks.ijFromIdx(idx); }
    _idxFromIJ(i,j) { return this.chunks._idxFromIJ(i,j); }
    idxFromIJ(ij) { return this.chunks.idxFromIJ(ij); }
    _idxFromPoint(x, y) { return this.chunks._idxFromPoint() }
    idxfromxy(x,y) { return this.chunks.idxfromij(this.ifromx(x),this.jfromy(y)); }
    idxFromDir(idx, dir) { return this.chunks.idxFromDir(idx, dir); }
    idxsAdjacent(idx1, idx2) { return this.chunks.idxsAdjacent(idx1, idx2); }
    *idxsBetween(idx1, idx2) { yield *this.chunks.idxsBetween(idx1, idx2); }
    idxof(gzo) { return this.chunks.idxof(gzo); }
    *[Symbol.iterator]() { yield *this.chunks; }
    *keys() { yield *this.chunks.keys(); }
    *getij(i, j) { yield *this.chunks.getij(i,j); }
    *getidx(idx) { yield *this.chunks.getidx(i,j); }
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
        localPos.x -= this.xform.minx + this.bounds.x + Math.round((this.xform.width - this.bounds.width)*this.alignx);
        localPos.y -= this.xform.miny + this.bounds.y + Math.round((this.xform.height - this.bounds.height)*this.aligny);
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

    childrender(ctx) {
        //let dx = this.xform.minx + this.bounds.x + Math.round((this.xform.width - this.bounds.width)*this.alignx);
        let dx = this.bounds.x + Math.round((this.xform.width - this.bounds.width)*this.alignx);
        //let dy = this.xform.miny + this.bounds.y + Math.round((this.xform.height - this.bounds.height)*this.aligny);
        let dy = this.bounds.y + Math.round((this.xform.height - this.bounds.height)*this.aligny);
        ctx.translate(dx, dy);
        for (const child of this.children) {
            child.render(ctx);
        }
        ctx.translate(-dx, -dy);
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