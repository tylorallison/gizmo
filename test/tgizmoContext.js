import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { GizmoContext } from '../js/gizmoContext.js';

describe('gizmo contexts', () => {

    it('can trigger events', ()=>{
        let gctx = new GizmoContext();
        let receiver = ExtEvtReceiver.gen();
        //let listeners = gctx.evtGetListeners();
        let counter = 0;
        let incr = () => counter++;
        EvtSystem.listen(gctx, receiver, 'test', incr);
        EvtSystem.trigger(gctx, 'test');
        expect(counter).toBe(1);
        expect(EvtSystem.getCount(gctx, 'test')).toBe(1);
    });

});