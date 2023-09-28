import { UpdateSystem } from '../js/updateSystem.js';
import { UiView } from '../js/uiView.js';
import { EventCtx } from '../js/eventCtx.js';

describe('a view', () => {

    let view, ectx, sys, tevts;
    beforeEach(() => {
        ectx = new EventCtx();
        EventCtx.advance(ectx);
        view = new UiView();
        sys = new UpdateSystem();
        tevts = [];
        EventCtx.listen(view, 'gizmo.updated', (evt) => tevts.push(evt));
    });
    afterEach(() => {
        EventCtx.withdraw();
    });

    it('xform updates trigger view event', ()=>{
        view.xform.x = 1;
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(tevts.length).toEqual(1);
        let tevt = tevts.pop() || {};
        expect(tevt.actor).toEqual(view);
        expect(tevt.tag).toEqual('gizmo.updated');
        expect(tevt.update['xform.x']).toEqual(1);
    });

    it('destroyed view does not trigger events', ()=>{
        view.destroy();
        view.visible = false;
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(tevts.length).toEqual(0);
    });

});
