import { GizmoContext } from '../js/gizmoContext.js';
import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { Hierarchy } from '../js/hierarchy.js';
import { Sketch } from '../js/sketch.js';
import { UpdateSystem } from '../js/updateSystem.js';
import { UiCanvas } from '../js/uiCanvas.js';

describe('a sketch', () => {

    let gctx, sys, receiver, tevts, sketch;
    beforeEach(() => {
        /*
        gctx = new GizmoContext({tag: 'test'});
        sketch = new Sketch({gctx: gctx});
        sys = new UpdateSystem( { gctx: gctx });
        receiver = ExtEvtReceiver.gen();
        tevts = [];
        EvtSystem.listen(sketch, receiver, 'gizmo.updated', (evt) => tevts.push(evt));
        */
    });

    it('fixme', ()=>{
    });
    /*
    it('xform updates trigger sketch event', ()=>{
        sketch.xform.x = 1;
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(tevts.length).toEqual(1);
        let tevt = tevts.pop() || {};
        expect(tevt.actor).toEqual(sketch);
        expect(tevt.update).toEqual({'xform.x' :1});
    });

    it('adoption/orphan triggers sketch enable/disable', ()=>{
        let cvs = new UiCanvas({gctx: gctx});
        expect(sketch.active).toBeFalse();
        Hierarchy.adopt(cvs, sketch);
        expect(sketch.active).toBeTrue();
        Hierarchy.orphan(sketch);
        expect(sketch.active).toBeFalse();
    });
    */

});