import { UpdateSystem } from '../js/updateSystem.js';
import { UiView } from '../js/uiView.js';
import { Evts } from '../js/evt.js';

describe('a view', () => {

    let view, sys, tevts;
    beforeEach(() => {
        view = new UiView();
        sys = new UpdateSystem();
        tevts = [];
        Evts.listen(view, 'GizmoUpdated', (evt) => tevts.push(evt));
    });
    afterEach(() => {
        Evts.clear();
    });

    it('xform updates trigger view event', ()=>{
        view.xform.x = 1;
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        expect(tevts.length).toEqual(1);
        let tevt = tevts.pop() || {};
        expect(tevt.actor).toEqual(view);
        expect(tevt.tag).toEqual('GizmoUpdated');
        expect(tevt.update['xform.x']).toEqual(1);
    });

    it('destroyed view does not trigger events', ()=>{
        view.destroy();
        view.visible = false;
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        expect(tevts.length).toEqual(0);
    });

});
