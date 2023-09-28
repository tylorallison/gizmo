export { Helpers };

import { ExtEvtEmitter, ExtEvtReceiver } from './event.js';
import { Gadget } from './gizmo.js';

class Helpers {

    static genEvtEmitter(spec={}) {
        let cls = class extends Gadget {}
        ExtEvtEmitter.apply(cls);
        return new cls(spec);
    }

    static genEvtReceiver(spec={}) {
        let cls = class extends Gadget {}
        ExtEvtReceiver.apply(cls);
        return new cls(spec);
    }
}