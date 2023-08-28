export { Asset };
import { Gadget } from './gizmo.js';

class Asset extends Gadget{
    static { this.schema('tag', { readonly: true }); }
    static { this.schema('global', { readonly: true }); }
}