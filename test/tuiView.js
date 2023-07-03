import { GizmoContext } from '../js/gizmo.js';
import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { UpdateSystem } from '../js/updateSystem.js';
import { UiView } from '../js/uiView.js';

describe('a view', () => {

    let view, gctx, sys, receiver, tevts;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
        view = new UiView({gctx: gctx});
        sys = new UpdateSystem( { gctx: gctx });
        receiver = ExtEvtReceiver.gen();
        tevts = [];
        EvtSystem.listen(view, receiver, 'gizmo.updated', (evt) => tevts.push(evt));
    });

    it('xform updates trigger view event', ()=>{
        view.xform.x = 1;
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(tevts.length).toEqual(1);
        let tevt = tevts.pop() || {};
        expect(tevt.actor).toEqual(view);
        expect(tevt.tag).toEqual('gizmo.updated');
        expect(tevt.update['xform.x']).toEqual(1);
    });

    it('destroyed view does not trigger events', ()=>{
        view.destroy();
        view.visible = false;
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(tevts.length).toEqual(0);
    });

});
