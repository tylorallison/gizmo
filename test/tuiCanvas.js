import { UiCanvas } from '../js/uiCanvas.js';
import { XForm } from '../js/xform.js';
import { Evts } from '../js/evt.js';

describe('a ux canvas', () => {

    afterEach(() => {
        Evts.clear();
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
