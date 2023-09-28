
import { MouseSystem } from '../js/mouseSystem.js';
import { UiView } from '../js/uiView.js';
import { XForm } from '../js/xform.js';
import { EventCtx } from '../js/eventCtx.js';

describe('a mouse system', () => {

    let ectx, sys, v1, v2;
    beforeEach(() => {
        ectx = new EventCtx();
        EventCtx.advance(ectx);
        sys = new MouseSystem();
        v1 = new UiView({active: true, xform: new XForm({x: 100, y: 100, fixedWidth:100, fixedHeight:100, origx: 0, origy: 0})});
        v2 = new UiView({active: true, xform: new XForm({x: 150, y: 150, fixedWidth:100, fixedHeight:100, origx: 0, origy: 0})});
    });
    afterEach(() => {
        EventCtx.withdraw();
    });

    it('can register views', ()=>{
        expect(sys.store.has(v1.gid)).toBeTruthy();
        expect(sys.store.has(v2.gid)).toBeTruthy();
    });

    it('can handle mouse movements', ()=>{
        let moveEvt;
        EventCtx.listen(sys, 'mouse.moved', (evt) => moveEvt = evt);
        sys.onMoved({offsetX: 125, offsetY: 135});
        expect(moveEvt.x).toEqual(125);
        expect(moveEvt.y).toEqual(135);
        expect(sys.active).toBeTruthy();
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(v1.mouseOver).toBeTruthy();
        expect(v2.mouseOver).toBeFalsy();

        sys.onMoved({offsetX: 75, offsetY: 75});
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(v1.mouseOver).toBeFalsy();
        expect(v2.mouseOver).toBeFalsy();
        sys.onMoved({offsetX: 175, offsetY: 175});
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(v1.mouseOver).toBeTruthy();
        expect(v2.mouseOver).toBeTruthy();
    });

    it('can handle mouse clicks', ()=>{
        let clickEvt;
        EventCtx.listen(sys, 'mouse.clicked', (evt) => clickEvt = evt);

        sys.onClicked({offsetX: 125, offsetY: 135});
        expect(clickEvt.x).toEqual(125);
        expect(clickEvt.y).toEqual(135);
        expect(sys.active).toBeTruthy();
        let v1clicked=false, v2clicked=false;
        EventCtx.listen(v1, 'mouse.clicked', () => v1clicked = true);
        EventCtx.listen(v2, 'mouse.clicked', () => v2clicked = true);
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(v1clicked).toBeTruthy();
        expect(v2clicked).toBeFalsy();

        v1clicked=false, v2clicked=false;
        sys.onClicked({offsetX: 175, offsetY: 175});
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(v1clicked).toBeTruthy();
        expect(v2clicked).toBeTruthy();

    });

});
