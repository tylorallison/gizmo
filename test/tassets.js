import { Sprite } from '../js/sprite.js';
import { Assets } from '../js/assets.js';
import { Rect } from '../js/rect.js';
import { XForm } from '../js/xform.js';
import { ImageRef, SheetRef } from '../js/refs.js';

describe('an asset class', () => {
    let assets;
    beforeEach(() => {
        assets = new Assets({});
    });

    it('can load a rectangle', async ()=>{
        let spec = Rect.xspec({tag: 'test.rect', color: 'blue', borderColor: 'red', border: 2, x_xform: XForm.xspec({ fixedWidth: 32, fixedHeight: 32 })});
        assets.register([spec]);
        await assets.load();
        let asset = assets.get('test.rect');
        expect(asset).toBeTruthy();
        if (asset) {
            expect(asset.tag).toEqual(spec.tag);
            expect(asset.color).toEqual(spec.color);
            expect(asset.borderColor).toEqual(spec.borderColor);
            expect(asset.border).toEqual(spec.border);
            expect(asset.x_xform).toEqual(spec.x_xform);
        }
    });

    it('can load a sprite from buffer', async ()=>{
        let spec = Sprite.xspec({tag: 'test.sprite', img: new ImageRef({src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAM5JREFUOE9jZKAQMFKon2E4GvD7f9v/f4eXwoOGyTYazIaJsdtdRfE2CgekeYflagaXuGdYw3bPIikGt65fDMiGoBjw85D2/39X3jAw6Ygw7CpjAysGARgbJMdylY2BdepjuD6sBoAUFe/hYuh1+QY2AMb+o/0LvwHfp4n/BzkT5AWQISANIABjg+T4pJ8x2K99id0FDAwMCgeDxe9bSbBhhMGxFxDD7Ne+VGRgYHgAU4CekBSgEjI4UugTqDhOA0DyMENwpXK4ZpCCYZCUARFBUhFhEjuAAAAAAElFTkSuQmCC'}), });
        assets.register([spec]);
        await assets.load();
        let asset = assets.get('test.sprite');
        expect(asset).toBeTruthy();
        if (asset) {
            expect(asset.tag).toEqual(spec.tag);
            expect(asset.img instanceof HTMLImageElement).toBeTruthy();
            expect(asset.img.width).toEqual(16);
            expect(asset.img.height).toEqual(16);
        }
    });

    it('can load a sprite from file', async ()=>{
        let spec = Sprite.xspec({tag: 'test.sprite', img: new ImageRef({src: '../media/token.png'}), });
        assets.register([spec]);
        await assets.load();
        let asset = assets.get('test.sprite');
        if (asset) {
            expect(asset.tag).toEqual(spec.tag);
            expect(asset.img instanceof HTMLImageElement).toBeTruthy();
            expect(asset.img.width).toEqual(96);
            expect(asset.img.height).toEqual(48);
        }
    });

    it('can load a sprite from sheet', async ()=>{
        let spec = Sprite.xspec({tag: 'test.sprite', img: new SheetRef({src: '../media/token.png', width: 16, height: 16, x: 0, y: 0}), });
        assets.register([spec]);
        await assets.load();
        let asset = assets.get('test.sprite');
        if (asset) {
            expect(asset.tag).toEqual(spec.tag);
            expect(asset.img instanceof HTMLImageElement).toBeTruthy();
            expect(asset.img.width).toEqual(16);
            expect(asset.img.height).toEqual(16);
        }
    });


});