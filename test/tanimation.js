import { GizmoContext } from '../js/gizmo.js';
import { EvtSystem } from '../js/event.js';
import { UpdateSystem } from '../js/updateSystem.js';
import { Rect } from '../js/rect.js';
import { Animation } from '../js/animation.js';
import { UiView } from '../js/uiView.js';
import { ImageMedia } from '../js/media.js';
import { Sprite } from '../js/sprite.js';

class TSketchView extends UiView {
    static {
        this.schema('sketch', { renderable: true, link: true });
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

    it('can be async loaded from list of URLs', async ()=>{
        let asset = await Animation.load(['../media/token.png', '../media/token.png']);
        expect(asset.sketches instanceof Array).toBeTruthy();
        expect(asset.sketches.length).toEqual(2);
        expect(asset.sketches[0].height).toEqual(48);
        expect(asset.sketches[0].width).toEqual(96);
        expect(asset.sketches[1].height).toEqual(48);
        expect(asset.sketches[1].width).toEqual(96);
    });

    it('can be async loaded from single URL', async ()=>{
        let asset = await Animation.load('../media/token.png');
        expect(asset.sketches instanceof Array).toBeTruthy();
        expect(asset.sketches.length).toEqual(1);
        expect(asset.sketches[0].height).toEqual(48);
        expect(asset.sketches[0].width).toEqual(96);
    });

    it('can be async loaded from list of image medias', async ()=>{
        let asset = await Animation.load([ImageMedia.from('../media/token.png'), ImageMedia.from('../media/token.png')]);
        expect(asset.sketches instanceof Array).toBeTruthy();
        expect(asset.sketches.length).toEqual(2);
        expect(asset.sketches[0].height).toEqual(48);
        expect(asset.sketches[0].width).toEqual(96);
        expect(asset.sketches[1].height).toEqual(48);
        expect(asset.sketches[1].width).toEqual(96);
    });

    it('can be async loaded from single image media', async ()=>{
        let asset = await Animation.load(ImageMedia.from('../media/token.png'));
        expect(asset.sketches instanceof Array).toBeTruthy();
        expect(asset.sketches.length).toEqual(1);
        expect(asset.sketches[0].height).toEqual(48);
        expect(asset.sketches[0].width).toEqual(96);
    });

    it('can be async loaded from list of sketches', async ()=>{
        let asset = await Animation.load([Sprite.from('../media/token.png'), Sprite.from('../media/token.png')]);
        expect(asset.sketches instanceof Array).toBeTruthy();
        expect(asset.sketches.length).toEqual(2);
        expect(asset.sketches[0].height).toEqual(48);
        expect(asset.sketches[0].width).toEqual(96);
        expect(asset.sketches[1].height).toEqual(48);
        expect(asset.sketches[1].width).toEqual(96);
    });

    it('can be async loaded from single sketch', async ()=>{
        let asset = await Animation.load(Sprite.from('../media/token.png'));
        expect(asset.sketches instanceof Array).toBeTruthy();
        expect(asset.sketches.length).toEqual(1);
        expect(asset.sketches[0].height).toEqual(48);
        expect(asset.sketches[0].width).toEqual(96);
    });

    it('can be created using from helper', async ()=>{
        let asset = Animation.from(['../media/token.png', ImageMedia.from('../media/token.png'), Sprite.from('../media/token.png')]);
        await asset.load();
        expect(asset.sketches instanceof Array).toBeTruthy();
        expect(asset.sketches.length).toEqual(3);
    });

    it('can be created using constructor', async ()=>{
        let asset = new Animation({sketches: [Sprite.from('../media/token.png'), Sprite.from('../media/token.png')]});
        await asset.load();
        expect(asset.sketches instanceof Array).toBeTruthy();
        expect(asset.sketches.length).toEqual(2);
    });

});
