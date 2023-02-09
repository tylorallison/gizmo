export { Sfx };

import { GizmoData } from './gizmoData.js';
import { Schema } from './schema.js';
import { SfxSystem } from './sfxSystem.js';

/** ========================================================================
 * Audio sound effect asset
 */
class Sfx extends GizmoData {

    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'assetTag', { readonly: true });
        Schema.apply(this, 'audio', { parser: (o,x) => x.audio || new ArrayBuffer() });
        Schema.apply(this, 'channel', { dflt: this.dfltChannel });
        Schema.apply(this, 'loop', { dflt: false });
        Schema.apply(this, 'volume', { dflt: 1 });
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
