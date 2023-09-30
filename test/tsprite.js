import { ImageMedia, Media } from '../js/media.js';
import { Sprite } from '../js/sprite.js';

describe('sprite assets', () => {

    it('can be async loaded from URL', async ()=>{
        let asset = await Sprite.load('../media/token.png');
        expect(asset.media instanceof Media).toBeTruthy();
        expect(asset.height).toEqual(48);
        expect(asset.width).toEqual(96);
    });

    it('can be async loaded from media spec', async ()=>{
        let asset = await Sprite.load(ImageMedia.xspec({src: '../media/token.png', scale: 2}));
        expect(asset.media instanceof Media).toBeTruthy();
        expect(asset.height).toEqual(48*2);
        expect(asset.width).toEqual(96*2);
    });

    it('can be created using from helper', async ()=>{
        let asset = Sprite.from('../media/token.png');
        expect(asset.media instanceof Media).toBeTruthy();
        await asset.media.load();
        expect(asset.height).toEqual(48);
        expect(asset.width).toEqual(96);
    });

    it('can be created using from helper w/ media spec', async ()=>{
        let asset = Sprite.from({src: '../media/token.png', scale: 2});
        expect(asset.media instanceof Media).toBeTruthy();
        await asset.media.load();
        expect(asset.height).toEqual(48*2);
        expect(asset.width).toEqual(96*2);
    });

});