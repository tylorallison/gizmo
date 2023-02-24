export { XForm };

import { Bounds } from './bounds.js';
import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';
import { Schema } from './schema.js';
import { Stats } from './stats.js';
import { Vect } from './vect.js';

class XForm extends GizmoData {

    // SCHEMA --------------------------------------------------------------
    static {
        // grip offsets
        // -- offset from grips, in pixels
        // -- applicable when grips are not overlapping
        Schema.apply(this, 'gripOffsetLeft', {dflt: 0});
        Schema.apply(this, 'gripOffsetRight', {dflt: 0});
        Schema.apply(this, 'gripOffsetTop', {dflt: 0});
        Schema.apply(this, 'gripOffsetBottom', {dflt: 0});
        // -- extend grip offsets to force aspect ratio of xform bounds based on given fixedWidth/fixedHeight
        // -- applicable when grips are not overlapping
        // -- if value is true, uses defined fixedWidth/Height to determine forced aspect ratio (defaults to 1:1)
        // -- if value is numeric, uses value as forced aspect ratio (width/height);
        Schema.apply(this, 'gripOffsetForceRatio', {dflt: false});
        // origin
        // -- origin x/y offset (in pixels)
        // -- applicable when grips are overlapping
        Schema.apply(this, 'x', {dflt: 0});
        Schema.apply(this, 'y', {dflt: 0});
        // width/height
        // -- fixed dimensions of transform
        // -- applicable when grips are overlapping
        Schema.apply(this, 'fixedWidth', {dflt: 0});
        Schema.apply(this, 'fixedHeight', {dflt: 0});
        // grips
        // -- grips from parent transform, in percent (0-1)
        Schema.apply(this, 'left', {dflt: 0});
        Schema.apply(this, 'right', {dflt: 0});
        Schema.apply(this, 'top', {dflt: 0});
        Schema.apply(this, 'bottom', {dflt: 0});
        // origin
        // -- origin or pivot point of local transform, in percent of current grip dimensions
        // -- applicable when borders are not overlapping
        Schema.apply(this, 'origx', { dflt: .5 });
        Schema.apply(this, 'origy', { dflt: .5 });
        // -- scale to apply for this transform relative to parent
        Schema.apply(this, 'scalex', { dflt: 1 });
        Schema.apply(this, 'scaley', { dflt: 1 });
        // -- angle to apply for this transform relative to parent
        Schema.apply(this, 'angle', { dflt: 0 });
        // -- autogenerated bounds, regenerated upon xform changes, linking to parent, and gizmo hierarchy changes
        Schema.apply(this, 'bounds', { autogen: true, setter: (o, x) => o.computeBounds(), atUpdate: (o,k,ov,nv) => {
            let gzo = o.$trunk;
            if (gzo) {
                //console.error(`${gzo} set xform.bounds to ${v} gzo.xform: ${gzo.xform}`);
                for (const child of gzo.children) {
                    if (child.xform) child.xform.$regen();
                    //console.log(`autogen child ${child} of ${gzo} bounds: ${child.xform.bounds} parent bounds ${(gzo.xform) ? gzo.xform.bounds : null}`);
                }
            }
        }});
    }

    // private internal state
    #savedTransform;

    constructor(spec={}) {
        let gripOffset = spec.gripOffset || 0;
        if (!spec.hasOwnProperty('gripOffsetLeft')) spec.gripOffsetLeft = gripOffset;
        if (!spec.hasOwnProperty('gripOffsetRight')) spec.gripOffsetRight = gripOffset;
        if (!spec.hasOwnProperty('gripOffsetTop')) spec.gripOffsetTop = gripOffset;
        if (!spec.hasOwnProperty('gripOffsetBottom')) spec.gripOffsetBottom = gripOffset;
        let grip = spec.grip || 0;
        if (!spec.hasOwnProperty('left')) spec.left = grip;
        if (!spec.hasOwnProperty('right')) spec.right = grip;
        if (!spec.hasOwnProperty('top')) spec.top = grip;
        if (!spec.hasOwnProperty('bottom')) spec.bottom = grip;
        let orig = spec.hasOwnProperty('orig') ? spec.orig : .5;
        if (!spec.hasOwnProperty('origx')) spec.origx = orig;
        if (!spec.hasOwnProperty('origy')) spec.origy = orig;
        let scale = spec.scale || 1;
        if (!spec.hasOwnProperty('scalex')) spec.scalex = scale;
        if (!spec.hasOwnProperty('scaley')) spec.scaley = scale;
        super(spec);
    }

    // parent transform linked through gizmo relation (if any)
    get parent() {
        Stats.count('xform.parent');
        let v = this.$trunk;
        if (!v) return null;
        v = v.parent;
        if (!v) return null;
        return v.xform;
    }

    // grip positions relative to parent bounds/rect
    get gripLeft() {
        Stats.count('xform.gripLeft');
        let p = this.parent;
        if (p) return Math.round(p.minx + (p.width*this.left));
        return 0;
    }

    get gripRight() {
        Stats.count('xform.gripRight');
        let p = this.parent;
        if (p) return Math.round(p.maxx - (p.width*this.right));
        return 0;
    }
    get gripTop() {
        let p = this.parent;
        if (p) return Math.round(p.miny + (p.height*this.top));
        return 0;
    }
    get gripBottom() {
        let p = this.parent;
        if (p) return Math.round(p.maxy - (p.height*this.bottom));
        return 0;
    }

    // grip dimensions in pixels
    get gripWidth() {
        let p = this.parent;
        if (p) return Math.round(p.maxx - (p.width*this.right)) - Math.round(p.minx + (p.width*this.left));
        return 0;
    }
    get gripHeight() {
        let p = this.parent;
        if (p) return Math.round(p.maxy - (p.height*this.bottom)) - Math.round(p.miny + (p.height*this.top));
        return 0;
    }

    // delta from parent origin to current origin in pixels
    get deltax() {
        let gl = this.gripLeft;
        let gr = this.gripRight;
        if (gl === gr) {
            return gl + this.x;
        } else {
            let left = gl + this.gripOffsetLeft;
            let right = gr - this.gripOffsetRight;
            return left + Math.round((right-left)*this.origx);
        }
    }
    get deltay() {
        let gt = this.gripTop;
        let gb = this.gripBottom;
        if (gt === gb) {
            return gt + this.y;
        } else {
            let top = gt + this.gripOffsetTop;
            let bottom = gb - this.gripOffsetBottom;
            return top + Math.round((bottom-top)*this.origy);
        }
    }

    // the defined rect boundary in world coordinates
    get worldBounds() {
    }

    // min/max x/y returns min/max of bounds/rect in local space
    get minx() {
        return this.bounds.x;
    }

    get miny() {
        return this.bounds.y;
    }

    get maxx() {
        return this.bounds.x+this.bounds.width;
    }

    get maxy() {
        return this.bounds.y+this.bounds.height;
    }

    get width() {
        return this.bounds.width;
    }

    get height() {
        return this.bounds.height;
    }

    // inverse scale of transform
    get iscalex() {
        return (this.scalex) ? 1/this.scalex : 0;
    }
    get iscaley() {
        return (this.scaley) ? 1/this.scaley : 0;
    }

    computeBounds() {
        let minx=0, miny=0, width=0, height=0;
        if (this.gripLeft === this.gripRight) {
            minx = Math.round(-this.fixedWidth*this.origx);
            width = this.fixedWidth;
        } else {
            let left = this.gripLeft + this.gripOffsetLeft;
            minx = left - this.deltax;
            let right = this.gripRight - this.gripOffsetRight;
            width = right - left;
        }
        if (this.gripTop === this.gripBottom) {
            miny = Math.round(-this.fixedHeight*this.origy);
            height = this.fixedHeight;
        } else {
            let top = this.gripTop + this.gripOffsetTop;
            miny = top - this.deltay;
            let bottom = this.gripBottom - this.gripOffsetBottom;
            height = bottom-top;
        }
        // -- handled forced ratio
        if (this.gripOffsetForceRatio) {
            let desiredRatio = (typeof this.gripOffsetForceRatio === 'number') ? 
                this.gripOffsetForceRatio : 
                (this.fixedWidth && this.fixedHeight) ? this.fixedWidth/this.fixedHeight : 1;
            let currentRatio = width/height;
            if (this.gripLeft !== this.gripRight) {
                if (width && height) {
                    if (currentRatio>desiredRatio) {
                        let adjustedWidth = height * desiredRatio;
                        minx += Math.round((width-adjustedWidth)*this.origx);
                        width = adjustedWidth;
                    }
                }
            }
            if (this.gripTop !== this.gripBottom) {
                if (width && height) {
                    if (currentRatio<desiredRatio) {
                        let adjustedHeight = width / desiredRatio;
                        miny += Math.round((height-adjustedHeight)*this.origy);
                        height = adjustedHeight;
                    }
                }
            }
        }
        return new Bounds(minx, miny, width, height);
    }

    // apply local coords, then scale, rotation, translation
    apply(ctx, chain=true) {
        if (chain && this.parent) this.parent.apply(ctx);
        let deltax = this.deltax;
        let deltay = this.deltay;
        this.#savedTransform = ctx.getTransform();
        if (deltax || deltay) ctx.translate(deltax, deltay);
        if (this.angle) ctx.rotate(this.angle);
        if (this.scalex !== 1|| this.scaley !== 1) ctx.scale(this.scalex, this.scaley);
    }

    // revert transform
    revert(ctx, chain=true) {
        // revert reverses order of operations
        ctx.setTransform(this.#savedTransform);
        if (chain && this.parent) this.parent.revert(ctx);
    }

    /**
     * translate world position to local position
     * @param {*} worldPos 
     */
    getLocal(worldPos, chain=true) {
        let localPos;
        // apply parent transform (if any)
        if (chain && this.parent) {
            localPos = this.parent.getLocal(worldPos);
        } else {
            localPos = new Vect(worldPos);
        }
        // apply local transforms
        let deltax = this.deltax;
        let deltay = this.deltay;
        if (deltax||deltay) localPos.sub(deltax, deltay);
        if (this.angle) localPos.rotate(-this.angle, true);
        if (this.scalex !== 1|| this.scaley !== 1) localPos.div(this.scalex, this.scaley);
        return localPos.round();
    }

    /**
     * translate local position to world position
     * @param {*} localPos 
     */
    getWorld(localPos, chain=true) {
        let worldPos = new Vect(localPos);
        // apply local transforms
        if (this.scalex !== 1|| this.scaley !== 1) worldPos.mult(this.scalex, this.scaley);
        if (this.angle) worldPos.rotate(this.angle, true);
        let deltax = this.deltax;
        let deltay = this.deltay;
        if (deltax || deltay) worldPos.add(deltax, deltay);
        // apply parent transform (if any)
        if (chain && this.parent) worldPos = this.parent.getWorld(worldPos);
        return worldPos.round();
    }

    renderGrip(ctx, x, y, which='tl', opts={}) {
        let size=opts.gripSize || 5;
        ctx.beginPath();
        ctx.moveTo(x,y);
        switch (which) {
        case 'tl':
            ctx.lineTo(x-size*2,y-size);
            ctx.lineTo(x-size,y-size*2);
            break;
        case 'tr':
            ctx.lineTo(x+size*2,y-size);
            ctx.lineTo(x+size,y-size*2);
            break;
        case 'bl':
            ctx.lineTo(x-size*2,y+size);
            ctx.lineTo(x-size,y+size*2);
            break;
        case 'br':
            ctx.lineTo(x+size*2,y+size);
            ctx.lineTo(x+size,y+size*2);
            break;
        }
        ctx.fillStyle = opts.gripColor || 'rgba(255,0,255,.5';
        ctx.fill();
    }

    renderOrigin(ctx, x, y, opts={}) {
        let size = opts.originSize || 4;
        ctx.fillStyle = opts.originColor || 'rgba(255,0,0,.5)';
        ctx.fillRect(x-size, y-size, size*2, size*2);
    }

    renderBounds(ctx, left, top, width, height, opts={}) {
        ctx.setLineDash([5,5]);
        ctx.strokeStyle = opts.boundsColor || 'rgba(255,255,0,.5)';
        ctx.strokeRect(left, top, width, height);
        ctx.setLineDash([]);
    }

    render(ctx, chain=false, color="rgba(255,255,0,.5)", opts={}) {
        // get to local coordinate space
        if (chain && this.parent) this.parent.apply(ctx);
        // draw the grips
        if (this.parent) {
            this.renderGrip(ctx, this.gripLeft, this.gripTop, 'tl', opts);
            this.renderGrip(ctx, this.gripRight, this.gripTop, 'tr', opts);
            this.renderGrip(ctx, this.gripLeft, this.gripBottom, 'bl', opts);
            this.renderGrip(ctx, this.gripRight, this.gripBottom, 'br', opts);
        }
        // apply origin transform
        let deltax = this.deltax;
        let deltay = this.deltay;
        this.#savedTransform = ctx.getTransform();
        if (deltax || deltay) ctx.translate(deltax, deltay);
        // draw the origin
        this.renderOrigin(ctx, 0, 0, opts);
        // parentless grips follow origin
        if (!this.parent) {
            this.renderGrip(ctx, this.gripLeft, this.gripTop, 'tl', opts);
            this.renderGrip(ctx, this.gripRight, this.gripTop, 'tr', opts);
            this.renderGrip(ctx, this.gripLeft, this.gripBottom, 'bl', opts);
            this.renderGrip(ctx, this.gripRight, this.gripBottom, 'br', opts);
        }
        // apply local transform
        if (this.angle) ctx.rotate(this.angle);
        if (this.scalex !== 1|| this.scaley !== 1) ctx.scale(this.scalex, this.scaley);
        // draw the bounding rect of this transform
        this.renderBounds(ctx, this.minx, this.miny, this.width, this.height, opts);
        // revert transform
        ctx.setTransform(this.#savedTransform);
        if (chain && this.parent) this.parent.revert(ctx);
    }

    $onLink() {
        console.log(`-- xform onlink ${this.$gdl.parent}`);
        /*
        let bounds = this.computeBounds();
        this.bounds.x = bounds.x;
        this.bounds.y = bounds.y;
        this.bounds.width = bounds.width;
        this.bounds.height = bounds.height;
        */
    }

    toString() {
        return Fmt.toString(this.constructor.name, this.minx, this.miny, this.width, this.height);
    }

}