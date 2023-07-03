import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { Gizmo, GizmoContext, Gadget } from '../js/gizmo.js';
import { UpdateSystem } from '../js/updateSystem.js';

class TUpdateRoot extends Gizmo {
    static { this.schema('sub', {link: true}); };
    static { this.schema('psub', {proxy: true}); };
};

class TUpdateSub extends Gadget {
    static { this.schema('var1'); };
    static { this.schema('var2'); };
};

describe('an update system', () => {

    let gctx, receiver, tevts, sys, g;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
        sys = new UpdateSystem( { gctx: gctx });
        g = new TUpdateRoot({ gctx: gctx, sub: new TUpdateSub({ data: 'hello world'}), psub: new TUpdateSub({ data: 'nihao' }) });
        receiver = ExtEvtReceiver.gen();
        EvtSystem.listen(gctx, receiver, 'gizmo.updated', (tevt) => tevts.push(tevt));
        tevts = [];
    });

    it('gizmos trigger updates', ()=>{
        GizmoData.set(
	g.sub.var1 = 'bar';
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        let tevt = tevts.pop() || {};
        expect(tevt.actor).toEqual(g);
        expect(tevt.update).toEqual({ 'sub.var1': 'bar'});
        g.psub.var1 = 'zaijian';
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        tevt = tevts.pop() || {};
        expect(tevt.actor).toEqual(g);
        expect(tevt.update).toEqual({ 'psub.var1': 'zaijian'});
    });

    it('gizmos updates are correlated', ()=>{
        g.psub.var1 = 'foo';
        g.psub.var2 = 'bar';
        g.psub.var1 = 'baz';
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(tevts.length).toEqual(1);
        let tevt = tevts.pop() || {};
        expect(tevt.actor).toEqual(g);
        expect(tevt.update).toEqual({ 'psub.var1': 'baz', 'psub.var2': 'bar'});
    });

    it('destroyed system does not trigger updates', ()=>{
        expect(gctx.evtEmitterLinks.get('gizmo.set').length).toEqual(1);
        sys.destroy();
        expect(gctx.evtEmitterLinks.get('gizmo.set')).ToBeFalsey;
        g.psub.var1 = 'bar';
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(tevts.length).toEqual(0);
    });

});
