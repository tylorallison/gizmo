import { UpdateSystem } from '../js/updateSystem.js';
import { UiCanvas } from '../js/uiCanvas.js';
import { XForm } from '../js/xform.js';
import { EventCtx } from '../js/eventCtx.js';

describe('a ux canvas', () => {

    let ectx;
    beforeEach(() => {
        ectx = new EventCtx();
        EventCtx.advance(ectx);
    });
    afterEach(() => {
        EventCtx.withdraw();
    });

    it('can be constructed w/ specified dimensions', ()=>{
        let v = new UiCanvas({
            canvasId: 'canvas.test', 
            fitToWindow: false, 
            xform: new XForm({fixedWidth: 200, fixedHeight: 100})
        });
        expect(v.canvas.id).toEqual('canvas.test');
        expect(v.canvas.width).toEqual(200);
        expect(v.canvas.height).toEqual(100);
    });

});
