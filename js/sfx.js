export { Sfx };

import { Gadget } from './gizmo.js';
import { SfxSystem } from './sfxSystem.js';

/** ========================================================================
 * Audio sound effect asset
 */
class Sfx extends Gadget {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('assetTag', { readonly: true });
        this.schema('audio', { parser: (o,x) => x.audio || new ArrayBuffer() });
        this.schema('channel', { dflt: this.dfltChannel });
        this.schema('loop', { dflt: false });
        this.schema('volume', { dflt: 1 });
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

}
