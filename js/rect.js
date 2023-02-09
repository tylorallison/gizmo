export { Rect };

import { Schema } from './schema.js';
import { Sketch } from './sketch.js';
import { Stats } from './stats.js';

/** ========================================================================
 * A rectangle is a sketch primitive.
 */
class Rect extends Sketch {

    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'border', {dflt: 0, renderable: true});
        Schema.apply(this, 'borderColor', {dflt: 'black', renderable: true});
        Schema.apply(this, 'color', {dflt: 'rgba(127,127,127,.75', renderable: true});
        Schema.apply(this, 'fill', {dflt: true, renderable: true});
        Schema.apply(this, 'dash', {dflt: null, renderable: true});
    }

    // METHODS -------------------------------------------------------------
    subrender(ctx, x=0, y=0, width=0, height=0) {
        // default width/height to internal width/height if not specified
        if (!width) width = this.width;
        if (!height) height = this.height;
        Stats.count(`rect.subrender`);
        if (this.fill) {
            ctx.fillStyle = this.color;
            ctx.fillRect(x, y, width, height);
        }
        if (this.border) {
            ctx.lineWidth = this.border;
            ctx.strokeStyle = this.borderColor;
            if (this.dash) ctx.setLineDash(this.dash);
            ctx.strokeRect(x, y, width, height);
            if (this.dash) ctx.setLineDash([]);
        }
    }

}