export { GameCtx };
import { AssetCtx } from './assetCtx';
import { ConfigCtx } from './configCtx.js';
import { EventCtx } from './eventCtx';
import { GizmoCtx } from './gizmoCtx.js';

class GameCtx extends GizmoCtx {

    static get cfg() {
        return this.$instance.cfg;
    }
    static get events() {
        return this.$instance.events;
    }
    static get assets() {
        return this.$instance.assets;
    }

    constructor(spec={}) {
        super(spec);
        this.cfg = spec.cfg || new ConfigCtx();
        this.events = spec.events || new EventCtx();
        this.assets = spec.assets || new AssetCtx();
    }

}