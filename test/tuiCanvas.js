import { GizmoContext } from '../js/gizmo.js';
import { UpdateSystem } from '../js/updateSystem.js';
import { UiCanvas } from '../js/uiCanvas.js';
import { XForm } from '../js/xform.js';

describe('a ux canvas', () => {

    let gctx, sys;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
        sys = new UpdateSystem( { gctx: gctx });
    });

    it('can be constructed w/ specified dimensions', ()=>{
        let v = new UiCanvas({
            gctx: gctx, 
            canvasId: 'canvas.test', 
            fitToWindow: false, 
            xform: new XForm({fixedWidth: 200, fixedHeight: 100})
        });
        expect(v.canvas.id).toEqual('canvas.test');
        expect(v.canvas.width).toEqual(200);
        expect(v.canvas.height).toEqual(100);
    });

});
