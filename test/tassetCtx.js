import { SheetRef, ImageRef, Asset, Sprite, GadgetRef } from '../js/asset.js';
import { AssetCtx } from '../js/assetCtx.js';
import { FileLoader } from '../js/fileLoader.js';
import { Game } from '../js/game.js';
import { Hierarchy } from '../js/hierarchy.js';
import { UiPanel } from '../js/uiPanel.js';
//import { ImageRef } from '../js/refs.js';
//import { Sprite } from '../js/sprite.js';

describe('an asset', () => {
    it('can be created w preloaded media', async ()=>{
        let img = await FileLoader.loadImage('../media/token.png');
        let sprite = new Sprite({ img: img });
        expect(sprite.img).toBe(img);
    });

    it('can be created w helper for media', async ()=>{
        let sprite = Sprite.from('../media/token.png');
        console.log(`sprite: ${sprite}`);
        let sprite2 = Sprite.from('../media/token.png');
        console.log(`sprite2: ${sprite}`);
        setTimeout(() => {
            console.log(`sprite.img ${sprite.img} === sprite2.img ${sprite2.img}: ${sprite.img === sprite2.img}`);
        });
    });

    xit('can be referenced via game asset definitions', async ()=>{
        class TestGame extends Game {
            static xassets = [
            ];
        }
    });

    xit('can be manually defined and referenced', async ()=>{
        let game = new Game();
        AssetCtx.add(Sprite.from('../media/token.png', { tag: 'token' }));
        AssetCtx.load().then(() => {
            let panel = new UiPanel({
                sketch: AssetCtx.get('token'),
            });
        })
    });

    xit('can resolve media reference', async ()=>{
        /*
        let sprite = new Sprite({
            tag: 'test',
            img: new ImageRef({tag: 'test', src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAM5JREFUOE9jZKAQMFKon2E4GvD7f9v/f4eXwoOGyTYazIaJsdtdRfE2CgekeYflagaXuGdYw3bPIikGt65fDMiGoBjw85D2/39X3jAw6Ygw7CpjAysGARgbJMdylY2BdepjuD6sBoAUFe/hYuh1+QY2AMb+o/0LvwHfp4n/BzkT5AWQISANIABjg+T4pJ8x2K99id0FDAwMCgeDxe9bSbBhhMGxFxDD7Ne+VGRgYHgAU4CekBSgEjI4UugTqDhOA0DyMENwpXK4ZpCCYZCUARFBUhFhEjuAAAAAAElFTkSuQmCC'}),
        });
        console.log(`sprite.img: ${sprite.img}`);
        let sprite2 = new Sprite({
            tag: 'sprite2',
            img: new ImageRef({src: '../media/token.png'}),
        });
        let sprite3 = new Sprite({
            tag: 'sprite3',
            img: new ImageRef({src: '../media/token.png'}),
        });
        let sprite4 = new Sprite({
            tag: 'sprite4', 
            img: new SheetRef({src: '../media/token.png', width: 16, height: 16, x: 0, y: 0}), 
        });
        setTimeout(() => {
            console.log(`sprite.img: ${sprite.img}`);
            console.log(`sprite2.img: ${sprite2.img}`);
            console.log(`sprite3.img: ${sprite3.img}`);
            console.log(`sprite4.img: ${sprite4.img}`);
        }, 500);
        */
    });
});

xdescribe('an asset context', () => {
    //let assets;
    //beforeEach(() => {
        //assets = new Assets({});
    //});

    it('can dynamically load an asset', async ()=>{
        let sprite = new Sprite({
            tag: 'test',
            img: new ImageRef({src: '../media/token.png'}),
        });

        let ctx = new AssetCtx({
            xassets: [
                Sprite.xspec({
                    tag: 'test',
                    img: new ImageRef({src: '../media/token.png'}),
                }),
            ],
        });
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