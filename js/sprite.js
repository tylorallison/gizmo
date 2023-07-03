export { Sprite };

import { Sketch } from './sketch.js';

/** ========================================================================
 * A sprite is a sketch used to render a JS image.
 */
class Sprite extends Sketch {
    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('img', {readonly: true});
        this.schema('width', {getter: ((o,x) => ((o.img) ? o.img.width : 0)), readonly: true});
        this.schema('height', {getter: ((o,x) => ((o.img) ? o.img.height : 0)), readonly: true});
    }

    // METHODS -------------------------------------------------------------
    subrender(ctx, x=0, y=0, width=0, height=0) {
        if (!this.img) return;
        // scale if necessary
        if ((width && width !== this.width) || (height && height !== this.height)) {
            if (this.width && this.height) {
                // src dims
                let sw = this.width;
                let sh = this.height;
                // dst dims
                let dw = width;
                let dh = height;
                ctx.drawImage(this.img, 
                    0, 0, sw, sh, 
                    x, y, dw, dh);
            }
        } else {
            ctx.drawImage(this.img, x, y);
        }
    }

}
