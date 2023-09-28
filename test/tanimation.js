import { Rect } from '../js/rect.js';
import { Animation } from '../js/animation.js';
import { UiView } from '../js/uiView.js';
import { ImageMedia } from '../js/media.js';
import { Sprite } from '../js/sprite.js';
import { EventCtx } from '../js/eventCtx.js';
import { Fmt } from '../js/fmt.js';

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

    let ectx, anim, view;
    beforeEach(() => {
        ectx = new EventCtx();
        EventCtx.advance(ectx);
        anim = new Animation({jitter: true, sketches: [
            new Rect({ tag: 'rect.blue', color: 'blue', borderColor: 'red', border: 2, width: 20, height: 20, ttl: 100 }),
            new Rect({ tag: 'rect.green', color: 'green', borderColor: 'red', border: 2, width: 20, height: 20, ttl: 100 }),
        ]});
        view = new TSketchView({ sketch: anim });
    });
    afterEach(() => {
        EventCtx.withdraw();
    });

    it('timer stops when animation is destroyed', ()=>{
        let links = EventCtx.$instance.findLinksForEvt(null, 'game.tock');
        expect(links.length).toEqual(0);
        anim.enable();
        links = EventCtx.$instance.findLinksForEvt(null, 'game.tock');
        expect(links.length).toEqual(1);
        view.destroy();
        links = EventCtx.$instance.findLinksForEvt(null, 'game.tock');
        expect(links.length).toEqual(0); // update system has listener
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
