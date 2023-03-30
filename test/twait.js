import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { Fmt } from '../js/fmt.js';
import { Generator } from '../js/generator.js';
import { Gizmo } from '../js/gizmo.js';
import { GizmoContext } from '../js/gizmoContext.js';
import { SerialData, Serializer } from '../js/serializer.js';
import { UpdateSystem } from '../js/updateSystem.js';
import { WaitAction } from '../js/wait.js';

describe('a wait action', () => {

    let gctx, sys, actor, receiver, tevts;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
        actor = new Gizmo({gctx: gctx});
        //view = new UiView({gctx: gctx});
        sys = new UpdateSystem( { gctx: gctx });
        receiver = ExtEvtReceiver.gen();
        tevts = [];
        EvtSystem.listen(actor, receiver, 'action.started', (evt) => tevts.push(evt));
        EvtSystem.listen(actor, receiver, 'action.done', (evt) => tevts.push(evt));
    });

    // FIXME

    it('promises to finish', async ()=>{
        /*
        let w = new WaitAction({ gctx: gctx, ttl: 100, dbg: true });
        let p = w.perform(actor);
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        let ok = await p;
        expect(ok).toBeTruthy();
        */
    });

    /*
    it('can be serialized and restarted', async ()=>{
        let w = new WaitAction({ gctx: gctx, ttl: 100, dbg: true });
        let p = w.perform(actor);
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 50 });
        let sdata = new SerialData();
        let sw = Serializer.xifyGizmoData(sdata, w);
        let generator = new Generator({gctx: gctx});
        let w2 = generator.generate(sw);
        p = w2.perform(actor);
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 50 });
        let ok = await p;
        expect(ok).toBeTruthy();
    });

    it('promises to finish even if destroyed', async ()=>{
        let w = new WaitAction({ gctx: gctx, ttl: 100, dbg: true });
        let p = w.perform(actor);
        w.destroy();
        let ok = await p;
        expect(ok).toBeFalsy();
    });

    it('triggers start/done events for actor', async ()=>{
        let w = new WaitAction({ gctx: gctx, ttl: 100, dbg: true });
        let p = w.perform(actor);
        expect(tevts.length).toEqual(1);
        let tevt = tevts.pop();
        expect(tevt.tag).toEqual('action.started');
        expect(tevt.action).toBe(w);
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        let ok = await p;
        expect(ok).toBeTruthy();
        expect(tevts.length).toEqual(1);
        tevt = tevts.pop();
        expect(tevt.tag).toEqual('action.done');
        expect(tevt.action).toBe(w);
    });

    it('can update actor when complete', async ()=>{
        let w = new WaitAction({ gctx: gctx, ttl: 100, dbg: true, atts: { hello: 'there'} });
        let p = w.perform(actor);
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        let ok = await p;
        expect(ok).toBeTruthy();
        expect(actor.hello).toEqual('there');
    });
    */

});