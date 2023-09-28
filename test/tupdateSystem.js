import { EventCtx } from '../js/eventCtx.js';
import { Gizmo, Gadget } from '../js/gizmo.js';
import { UpdateSystem } from '../js/updateSystem.js';

class TUpdateRoot extends Gizmo {
    static { this.schema('sub', {link: true}); };
    static { this.schema('psub', {link: true}); };
};

class TUpdateSub extends Gadget {
    static { this.schema('var1'); };
    static { this.schema('var2'); };
};

describe('an update system', () => {

    let ectx, tevts, sys, g;
    beforeEach(() => {
        ectx = new EventCtx();
        EventCtx.advance(ectx);
        sys = new UpdateSystem();
        g = new TUpdateRoot({ sub: new TUpdateSub({ data: 'hello world'}), psub: new TUpdateSub({ data: 'nihao' }) });
        EventCtx.listen(null, 'gizmo.updated', (tevt) => tevts.push(tevt));
        tevts = [];
    });
    afterEach(() => {
        EventCtx.withdraw();
    });

    it('gizmos trigger updates', ()=>{
        g.sub.var1 = 'bar';
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        let tevt = tevts.pop() || {};
        expect(tevt.actor).toEqual(g);
        expect(tevt.update).toEqual({ 'sub.var1': 'bar'});
        g.psub.var1 = 'zaijian';
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        tevt = tevts.pop() || {};
        expect(tevt.actor).toEqual(g);
        expect(tevt.update).toEqual({ 'psub.var1': 'zaijian'});
    });

    it('gizmos updates are correlated', ()=>{
        g.psub.var1 = 'foo';
        g.psub.var2 = 'bar';
        g.psub.var1 = 'baz';
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(tevts.length).toEqual(1);
        let tevt = tevts.pop() || {};
        expect(tevt.actor).toEqual(g);
        expect(tevt.update).toEqual({ 'psub.var1': 'baz', 'psub.var2': 'bar'});
    });

    it('destroyed system does not trigger updates', ()=>{
        sys.destroy();
        g.psub.var1 = 'bar';
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(tevts.length).toEqual(0);
    });

});
