import { EvtSystem } from '../js/event.js';
import { Gizmo } from '../js/gizmo.js';
import { GizmoContext } from '../js/gizmoContext.js';
import { UpdateSystem } from '../js/updateSystem.js';
import { WaitAction } from '../js/wait.js';

describe('a wait action', () => {

    let gctx, sys, actor, tevts;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
        actor = new Gizmo({gctx: gctx});
        //view = new UiView({gctx: gctx});
        sys = new UpdateSystem( { gctx: gctx });
        //receiver = ExtEvtReceiver.gen();
        //tevts = [];
        //EvtSystem.listen(view, receiver, 'gizmo.updated', (evt) => tevts.push(evt));
    });

    it('promises to finish', async ()=>{
        let w = new WaitAction({ gctx: gctx, ttl: 100, dbg: true });
        let p = w.perform(actor);
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        let ok = await p;
        expect(ok).toBeTruthy();
    });

    it('can be terminated early', async ()=>{
        let w = new WaitAction({ gctx: gctx, ttl: 100, dbg: true });
        let p = w.perform(actor);
        w.destroy();
        let ok = await p;
        expect(ok).toBeFalsey();
    });

    /*
    it('xform updates trigger view event', ()=>{
        let w = new WaitAction({ ttl: 100 });
        let receiver = ExtEvtReceiver.gen();
        let counter = 0;
        let incr = () => counter++;
        EvtSystem.listen(g, receiver, 'test', incr);
        EvtSystem.trigger(g, 'test');
        expect(counter).toBe(1);
        expect(EvtSystem.getCount(g, 'test')).toBe(1);
    });
*/

});