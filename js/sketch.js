export { Sketch };

import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';
import { Schema } from './schema.js';
import { Stats } from './stats.js';

/**
 * A sketch is the base abstract data object that represents something that can be drawn to the screen... 
 * - an image (sprite)
 * - an animation
 * - simple js primitives (e.g.: rectangle) for drawing
 * @extends GizmoData
 */
class Sketch extends GizmoData {


    // STATIC VARIABLES ----------------------------------------------------
    /** @const {string} Sketch.renderable=true - indicates if instance of class is renderable by render system */
    static renderable = true;

    static dfltTTL = 100;

    // STATIC PROPERTIES ---------------------------------------------------
    static get zero() {
        return new Sketch();
    }

    // SCHEMA --------------------------------------------------------------
    /** @member {string} Sketch#assetTag - if sketch came from asset, tag associated with asset definition */
    static { Schema.apply(this, 'assetTag', { readonly: true }); }
    /** @member {number} Sketch#width=0 - width of sketch */
    static { Schema.apply(this, 'width', {dflt: 0, readonly: true}); }
    /** @member {number} Sketch#height=0 - height of sketch */
    static { Schema.apply(this, 'height', {dflt: 0, readonly: true}); }
    /** @member {boolean} Sketch#active=false - indicates if sketch is active */
    static { Schema.apply(this, 'active', {dflt: false}); }
    /** @member {boolean|null} Sketch#smoothing=nul - indicates if image smoothing should be applied to this sketch, true/false controls this sketch, null defers to current context setting */
    static { Schema.apply(this, 'smoothing', {dflt: null, renderable: true}); }
    /** @member {float} Sketch#alpha=1 - transparency of sketch, 0 is not visible, 1 is no transparency */
    static { Schema.apply(this, 'alpha', {dflt: 1, renderable: true}); }
    /** @member {integer} Sketch#ttl - time to live for sketch */
    static { Schema.apply(this, 'ttl', {readonly: true, renderable: true, parser: (o,x) => x.hasOwnProperty('ttl') ? x.ttl : o.constructor.dfltTTL}); }
    /** @member {boolean} Sketch#done=false - if sketch has finished animation */
    static { Schema.apply(this, 'done', {parser: () => false}); }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    destroy() {
        this.disable();
        super.destroy();
    }

    // PROPERTIES ----------------------------------------------------------
    get duration() {
        return this.ttl;
    }

    // METHODS -------------------------------------------------------------
    enable() {
        this.active = true;
    }

    disable() {
        this.active = false;
    }

    /**
     * A sketch can be reset...
     */
    reset() {
    }

    /**
     * A sketch can be rendered...
     * @param {canvasContext} ctx - canvas context on which to draw
     */
    render(ctx, x=0, y=0, width=0, height=0) {
        Stats.count('sketch.render');
        if (!this.active) this.enable();
        // apply global context settings
        let savedAlpha = ctx.globalAlpha;
        ctx.globalAlpha *= this.alpha;
        let savedSmoothing = ctx.imageSmoothingEnabled;
        if (this.smoothing !== null) ctx.imageSmoothingEnabled = this.smoothing;
        // pre render, specific to subclass
        this.prerender(ctx, x, y, width, height);
        // private render, specific to subclass
        this.subrender(ctx, x, y, width, height);
        // post render, specific to subclass
        this.postrender(ctx, x, y, width, height);
        // revert global context settings
        ctx.globalAlpha = savedAlpha;
        ctx.imageSmoothingEnabled = savedSmoothing;
    }

    prerender(ctx) {
    }
    subrender(ctx) {
    }
    postrender(ctx) {
    }

    /**
     * convert to string
     */
    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }

}