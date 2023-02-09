import { GizmoContext } from '../js/gizmoContext.js';
import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { UpdateSystem } from '../js/updateSystem.js';
import { Rect } from '../js/rect.js';
import { Animation } from '../js/animation.js';
import { UiView } from '../js/uiView.js';
import { Schema } from '../js/schema.js';

class TSketchView extends UiView {
    static {
        Schema.apply(this, 'sketch', { renderable: true, link: true });
    }
    cpost(spec) {
        super.cpost(spec);
        this.sketch = spec.sketch;
    }
    subrender(ctx) {
        this.sketch.render(ctx, this.x, this.y);
    }
}

describe('an animation', () => {

    let gctx, sys, receiver, tevts, anim, view;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
        anim = new Animation({jitter: true, sketches: [
            new Rect({ tag: 'rect.blue', color: 'blue', borderColor: 'red', border: 2, width: 20, height: 20, ttl: 100 }),
            new Rect({ tag: 'rect.green', color: 'green', borderColor: 'red', border: 2, width: 20, height: 20, ttl: 100 }),
        ]});
        view = new TSketchView({ gctx: gctx, sketch: anim });
        sys = new UpdateSystem( { gctx: gctx });
        //receiver = ExtEvtReceiver.gen();
        //tevts = [];
        //EvtSystem.listen(anim, receiver, 'gizmo.updated', (evt) => tevts.push(evt));
    });

    it('timer stops when animation is destroyed', ()=>{
        let links = EvtSystem.findLinksForEvt(gctx, { tag: 'game.tock' });
        expect(links.length).toEqual(1);
        anim.enable();
        links = EvtSystem.findLinksForEvt(gctx, { tag: 'game.tock' });
        expect(links.length).toEqual(2);
        view.destroy();
        links = EvtSystem.findLinksForEvt(gctx, { tag: 'game.tock' });
        expect(links.length).toEqual(1); // update system has listener
    });

    /*
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