
export { VarSprite };

import { Sprite } from './sprite.js';
import { Prng } from './prng.js';
import { ImageMedia } from './media.js';

/** ========================================================================
 * A variable sprite is a sketch used to render a JS image.
 */
class VarSprite extends Sprite {

    static {
        this.schema('media', {readonly: true, parser: (o,x) => {
            if ('variations' in x) {
                return Prng.choose(x.variations);
            }
            if ('media' in x) {
                return x.media;
            }
            return null;
        }});
    }

    static from(src, spec={}) {
        let choice;
        if (Array.isArray(src)) {
            choice = Prng.choose(src);
        } else {
            choice = src;
        }
        let media = ImageMedia.from(choice);
        let asset = new this(Object.assign({}, spec, { media: media }));
        return asset;
    }

}
