import { AssetCtx } from '../js/assetCtx.js';
import { ImageRef } from '../js/refs.js';
import { Sprite } from '../js/sprite.js';


describe('an asset context', () => {
    //let assets;
    //beforeEach(() => {
        //assets = new Assets({});
    //});

    it('can dynamically load an asset', async ()=>{
        let sprite = new Sprite({
            tag: 'test',
            img: new ImageRef({src: 'foo'}),
        })
        /*
        let spec = Rect.xspec({tag: 'test.rect', color: 'blue', borderColor: 'red', border: 2 });
        assets.register([spec]);
        await assets.load();
        let asset = assets.get('test.rect');
        expect(asset).toBeTruthy();
        if (asset) {
            expect(asset.args[0].tag).toEqual(spec.args[0].tag);
            expect(asset.args[0].color).toEqual(spec.args[0].color);
            expect(asset.args[0].borderColor).toEqual(spec.args[0].borderColor);
            expect(asset.args[0].border).toEqual(spec.args[0].border);
        }
        */
    });

});