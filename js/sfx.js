export { Sfx };

import { GizmoData } from './gizmoData.js';
import { SfxSystem } from './sfxSystem.js';

/** ========================================================================
 * Audio sound effect asset
 */
class Sfx extends GizmoData {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema(this, 'assetTag', { readonly: true });
        this.schema(this, 'audio', { parser: (o,x) => x.audio || new ArrayBuffer() });
        this.schema(this, 'channel', { dflt: this.dfltChannel });
        this.schema(this, 'loop', { dflt: false });
        this.schema(this, 'volume', { dflt: 1 });
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
