export { Sfx };

import { Asset } from './asset.js';
import { Media } from './media.js';
import { SfxSystem } from './sfxSystem.js';

/** ========================================================================
 * Audio sound effect asset
 */
class Sfx extends Asset {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('media', {readonly: true});
        //this.schema('media', { parser: (o,x) => x.audio || new ArrayBuffer() });
        this.schema('channel', { dflt: this.dfltChannel });
        this.schema('loop', { dflt: false });
        this.schema('volume', { dflt: 1 });
    }

    static from(src, spec={}) {
        let media;
        if (src instanceof Media) {
            media = src;
        } else {
            media = Media.from(src);
        }
        let asset = new this(Object.assign({}, spec, { media: media }));
        return asset;
    }

    // STATIC VARIABLES ----------------------------------------------------
    static dfltChannel = 'sfx';

    // METHODS -------------------------------------------------------------
    play(actor) {
        SfxSystem.playSfx(actor, this.assetTag, this);
    }

    stop(actor) {
        SfxSystem.stopSfx(actor, this.assetTag, this);
    }

    async load() {
        if (this.media) {
            return this.media.load();
        } else {
            return Promise.resolve();
        }
    }

}
