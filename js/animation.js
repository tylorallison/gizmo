export { Animation };

import { Sketch } from './sketch.js';
import { Timer } from './timer.js';
import { Random } from './random.js';
import { Asset } from './asset.js';
import { ImageMedia } from './media.js';
import { Sprite } from './sprite.js';

// =========================================================================
/** 
 * An animation is a sketch used to render a series of animation cels (sketches).
 * @extends Sketch
 */
class Animation extends Sketch {
    // SCHEMA --------------------------------------------------------------
    /** @member {boolean} Animation#loop - should the animation be looped */
    static { this.schema('loop', { dflt: true }); }
    /** @member {boolean} Animation#timer - timer for this animation */
    static { this.schema('timer', { link: true, serializable: false, eventable: false }); }
    /** @member {boolean} Animation#sketchIdx - index of current animation frame */
    static { this.schema('sketchIdx', { eventable: false, dflt: 0 }); }
    /** @member {Sketch[]} Animation#sketches - array of cels/sketches to animate */
    static { this.schema('sketches', { dflt: [], readonly: true }); }
    /** @member {boolean} Animation#sketch - the current animation frame/sketch */
    static { this.schema('sketch', { link: true, parser: ((o,x) => ((o.sketches && o.sketches.length) ? o.sketches[o.sketchIdx] : null)) }); }
    /** @member {boolean} Animation#width - width of current animation frame */
    static { this.schema('width', { getter: ((o,x) => ((o.sketch) ? o.sketch.width : 0)) }); }
    /** @member {boolean} Animation#height - height of current animation frame */
    static { this.schema('height', { getter: ((o,x) => ((o.sketch) ? o.sketch.height : 0)) }); }
    /** @member {integer} Sketch#ttl - time to live for current animation frame */
    static { this.schema('ttl', { getter: (o,x) => ( o.sketches.reduce((pv, cv) => pv+cv.ttl, 0 )) }); }

    static from(srcs, spec={}) {
        let sketches = [];
        if (!Array.isArray(srcs)) srcs = [srcs];
        for (const src of srcs) {
            // source is media
            if (src instanceof ImageMedia) {
                sketches.push(Sprite.from(src));
            // source is an asset
            } else if (src instanceof Asset) {
                sketches.push(src);
            // source is a string or media spec ...
            } else {
                sketches.push(Sprite.from(src));
            }
        }
        let asset = new this(Object.assign({}, spec, { sketches: sketches }));
        return asset;
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    /**
     * Animation constructor
     * @param {Object} spec - object with key/value pairs used to pass properties to the constructor
     */
    constructor(spec) {
        let sketches = spec.sketches || [];
        if (spec.jitter) spec.sketchIdx = Random.rangeInt(0, sketches.length-1);
        super(spec);
        this.onTimer = this.onTimer.bind(this);
    }

    // EVENT HANDLERS ------------------------------------------------------
    /**
     * onTimer is an event callback executed when the animation loop timer is done with each animation frame
     * @param {Evt} evt 
     */
    onTimer(evt) {
        this.timer = null;
        // advance frame accounting for timer overflow
        let overflow = evt.overflow || 0;
        do {
            let ok = this.advance();
            // if frame does not advance, last frame has been hit and we are not looping... signal we are done and exit
            if (!ok) {
                if (!this.done) this.done = true;
                break;
            }
            // otherwise, continue to advance cels while cel ttl is < overflow
            if (this.sketch.ttl >= overflow) {
                this.timer = new Timer({gctx: this.constructor.root(this).gctx, ttl: this.sketch.ttl-overflow, cb: this.onTimer});
                break;
            } else {
                overflow -= this.sketch.ttl;
            }
        } while (overflow > 0);
    }

    // METHODS -------------------------------------------------------------
    /**
     * enable the animation by creating/starting the animation timer
     */
    enable() {
        if (!this.active) {
            if (this.sketch) this.sketch.enable();
            // start timer
            if ((!this.done) && (this.sketches.length > 1 || !this.loop)) {
                this.timer = new Timer({gctx: this.constructor.root(this).gctx, ttl: this.sketch.ttl, cb: this.onTimer});
            }
        }
        super.enable();
    }

    /**
     * disable the animation by stopping the animation timer
     */
    disable() {
        // disable current sketch
        if (this.sketch) this.sketch.disable();
        // stop timer
        if (this.timer) {
            this.timer.destroy();
            this.timer = null;
        }
        super.disable();
    }

    /**
     * reset the animation
     */
    reset() {
        this.sketchIdx = 0;
        this.done = false;
    }

    advance() {
        if (!this.sketches && !this.sketches.length) return false;
        let idx = this.sketchIdx + 1;
        if (idx >= this.sketches.length) {
            if (!this.loop) return false;
            idx = 0;
        }
        if (idx !== this.sketchIdx) {
            this.sketch.disable();
            this.sketchIdx = idx;
            this.sketch = this.sketches[this.sketchIdx];
            this.sketch.enable();
        }
        return true;
    }

    rewind() {
        if (!this.sketches && !this.sketches.length) return false;
        let idx = this.sketchIdx - 1;
        if (idx < 0) {
            if (!this.loop) return false;
            idx = this.sketches.length-1;
        }
        if (idx !== this.sketchIdx) {
            this.sketch.disable();
            this.sketchIdx = idx;
            this.sketch = this.sketches[this.sketchIdx];
            this.sketch.enable();
        }
        return true;
    }

    async load() {
        return Promise.all(this.sketches.map((x) => x.load()));
    }

    copy(overrides={}) {
        let sketches = (this.sketches || []).map((x) => x.copy());
        return new this.constructor(Object.assign({}, this.$store, { sketches: sketches}, overrides));
    }

    /**
     * subrender renders the current animation frame
     * @param {canvasContext} ctx - canvas context on which to draw
     * @param {number} [x=0] - x position to render sketch at
     * @param {number} [y=0] - y position to render sketch at
     * @param {number} [width=0] - desired width to render, if unspecified, sketch will render at internal width
     * @param {number} [height=0] - desired height to render, if unspecified, sketch will render at internal height
     */
    subrender(ctx, x=0, y=0, width=0, height=0) {
        if (this.sketch) this.sketch.render(ctx, x, y, width, height);
    }

}
