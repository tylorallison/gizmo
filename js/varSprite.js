
export { VarSprite };

import { Sprite } from './sprite.js';
import { Prng } from './prng.js';

/** ========================================================================
 * A variable sprite is a sketch used to render a JS image.
 */
class VarSprite extends Sprite {
    static {
        this.schema(this, 'img', {readonly: true, parser: (o,x) => {
            if ('variations' in x) {
                return Prng.choose(x.variations);
            }
            return null;
        }});
    }
}