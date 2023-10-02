export { Sprite };

import { ImageMedia } from './media.js';
import { Sketch } from './sketch.js';

/** ========================================================================
 * A sprite is a sketch used to render a JS image.
 */
class Sprite extends Sketch {
    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('media', {readonly: true});
        this.schema('width', {getter: ((o,x) => ((o.media && o.media.data) ? o.media.data.width : 0))});
        this.schema('height', {getter: ((o,x) => ((o.media && o.media.data) ? o.media.data.height : 0))});
    }

    static from(src, spec={}) {
        let media;
        if (src instanceof ImageMedia) {
            media = src;
        } else {
            media = ImageMedia.from(src);
        }
        let asset = new this(Object.assign({}, spec, { media: media }));
        return asset;
    }

    // METHODS -------------------------------------------------------------
    subrender(ctx, x=0, y=0, width=0, height=0) {
        if (!this.media || !this.media.data) return;
        // scale if necessary
        if ((width && width !== this.width) || (height && height !== this.height)) {
            if (this.width && this.height) {
                // src dims
                let sw = this.width;
                let sh = this.height;
                // dst dims
                let dw = width;
                let dh = height;
                ctx.drawImage(this.media.data, 
                    0, 0, sw, sh, 
                    x, y, dw, dh);
            }
        } else {
            ctx.drawImage(this.media.data, x, y);
        }
    }

    async load() {
        if (this.media) {
            return this.media.load();
        } else {
            return Promise.resolve();
        }
    }

}
