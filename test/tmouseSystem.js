
import { GizmoContext } from '../js/gizmo.js';
import { EvtSystem, ExtEvtReceiver } from "../js/event.js";
import { Helpers } from '../js/helpers.js';
import { MouseSystem } from '../js/mouseSystem.js';
import { UiView } from '../js/uiView.js';
import { XForm } from '../js/xform.js';

describe('a mouse system', () => {

    let gctx, sys, v1, v2;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
        sys = new MouseSystem({gctx: gctx, dbg: false});
        v1 = new UiView({gctx: gctx, active: true, xform: new XForm({x: 100, y: 100, fixedWidth:100, fixedHeight:100, origx: 0, origy: 0})});
        v2 = new UiView({gctx: gctx, active: true, xform: new XForm({x: 150, y: 150, fixedWidth:100, fixedHeight:100, origx: 0, origy: 0})});
    });

    it('can register views', ()=>{
        expect(sys.store.has(v1.gid)).toBeTruthy();
        expect(sys.store.has(v2.gid)).toBeTruthy();
    });

    it('can handle mouse movements', ()=>{
        let receiver = Helpers.genEvtReceiver();
        let moveEvt;
        EvtSystem.listen(sys, receiver, 'mouse.moved', (evt) => moveEvt = evt);
        sys.onMoved({offsetX: 125, offsetY: 135});
        expect(moveEvt.x).toEqual(125);
        expect(moveEvt.y).toEqual(135);
        expect(sys.active).toBeTruthy();
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(v1.mouseOver).toBeTruthy();
        expect(v2.mouseOver).toBeFalsy();

        sys.onMoved({offsetX: 75, offsetY: 75});
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(v1.mouseOver).toBeFalsy();
        expect(v2.mouseOver).toBeFalsy();
        sys.onMoved({offsetX: 175, offsetY: 175});
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(v1.mouseOver).toBeTruthy();
        expect(v2.mouseOver).toBeTruthy();
    });

    it('can handle mouse clicks', ()=>{
        let receiver = Helpers.genEvtReceiver();
        let clickEvt;
        EvtSystem.listen(sys, receiver, 'mouse.clicked', (evt) => clickEvt = evt);

        sys.onClicked({offsetX: 125, offsetY: 135});
        expect(clickEvt.x).toEqual(125);
        expect(clickEvt.y).toEqual(135);
        expect(sys.active).toBeTruthy();
        let v1clicked=false, v2clicked=false;
        EvtSystem.listen(v1, receiver, 'mouse.clicked', () => v1clicked = true);
        EvtSystem.listen(v2, receiver, 'mouse.clicked', () => v2clicked = true);
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(v1clicked).toBeTruthy();
        expect(v2clicked).toBeFalsy();

        v1clicked=false, v2clicked=false;
        sys.onClicked({offsetX: 175, offsetY: 175});
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(v1clicked).toBeTruthy();
        expect(v2clicked).toBeTruthy();

    });

});
