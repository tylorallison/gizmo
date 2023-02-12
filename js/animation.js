export { Animation };

import { Sketch } from './sketch.js';
import { Timer } from './timer.js';
import { Random } from './random.js';
import { Schema } from './schema.js';

// =========================================================================
/** 
 * An animation is a sketch used to render a series of animation cels (sketches).
 * @extends Sketch
 * @property {boolean} [loop=true] - indicates if the animation should loop
 */
class Animation extends Sketch {
    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'loop', { dflt: true });
        Schema.apply(this, 'timer', { link: true, eventable: false });
        Schema.apply(this, 'sketchIdx', { eventable: false, dflt: 0 });
        Schema.apply(this, 'sketches', { dflt: [], readonly: true });
        Schema.apply(this, 'sketch', { link: true, renderable: true, parser: ((o,x) => ((o.sketches && o.sketches.length) ? o.sketches[o.sketchIdx] : null)) });
        Schema.apply(this, 'width', { readonly: true, getter: ((o,x) => ((o.sketch) ? o.sketch.width : 0)) });
        Schema.apply(this, 'height', { readonly: true, getter: ((o,x) => ((o.sketch) ? o.sketch.height : 0)) });
        Schema.apply(this, 'ttl', { readonly: true, getter: (o,x) => ( o.sketches.reduce((pv, cv) => pv+cv.ttl, 0 )) });
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    constructor(spec) {
        let sketches = spec.sketches || [];
        if (spec.jitter) spec.sketchIdx = Random.rangeInt(0, sketches.length-1);
        super(spec);
        this.onTimer = this.onTimer.bind(this);
    }

    // EVENT HANDLERS ------------------------------------------------------
    onTimer(evt) {
        console.log(`animation timer`);
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
    enable() {
        console.log(`animation enable done: ${this.done} sketches.length: ${this.sketches.length} active: ${this.active}`);
        if (!this.active) {
            console.log(`animation not active`);
            if (this.sketch) this.sketch.enable();
            // start timer
            //console.log(`!this.done: ${!this.done}`)
            //console.log(`length check: ${this.sketches.length > 1}`)
            if ((!this.done) && (this.sketches.length > 1 || !this.loop)) {
                console.log(`gctx: ${this.constructor.root(this).gctx} ttl: ${this.sketch.ttl}`);
                this.timer = new Timer({gctx: this.constructor.root(this).gctx, ttl: this.sketch.ttl, cb: this.onTimer});
            }
        }
        super.enable();
    }

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

    subrender(ctx, x=0, y=0, width=0, height=0) {
        if (this.sketch) this.sketch.render(ctx, x, y, width, height);
    }

}