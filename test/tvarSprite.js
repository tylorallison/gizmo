import { AssetCtx } from '../js/assetCtx.js';
import { ImageMedia, Media } from '../js/media.js';
import { VarSprite } from '../js/varSprite.js';

describe('varsprite assets', () => {
    let ctx;
    beforeEach(() => {
        ctx = new AssetCtx();
        AssetCtx.advance(ctx);
    });
    afterEach(() => {
        AssetCtx.withdraw();
    });

    it('can be async loaded from URL', async ()=>{
        let asset = await VarSprite.load(['../media/token.png', '../media/token.png']);
        expect(asset.media instanceof Media).toBeTruthy();
        expect(asset.height).toEqual(48);
        expect(asset.width).toEqual(96);
    });

    it('can be async loaded from media spec', async ()=>{
        let asset = await VarSprite.load([ImageMedia.xspec({src: '../media/token.png', scale: 2})]);
        expect(asset.media instanceof Media).toBeTruthy();
        expect(asset.height).toEqual(48*2);
        expect(asset.width).toEqual(96*2);
    });

    it('can be created using from helper', async ()=>{
        let asset = VarSprite.from(['../media/token.png','../media/token.png']);
        expect(asset.media instanceof Media).toBeTruthy();
        await asset.media.load();
        expect(asset.height).toEqual(48);
        expect(asset.width).toEqual(96);
    });

    it('can be created using from helper w/ media spec', async ()=>{
        let asset = VarSprite.from([{src: '../media/token.png', scale: 2}]);
        expect(asset.media instanceof Media).toBeTruthy();
        await asset.media.load();
        expect(asset.height).toEqual(48*2);
        expect(asset.width).toEqual(96*2);
    });

    it('can be created using constructor', async ()=>{
        let asset = new VarSprite({ variations: [ImageMedia.from('../media/token.png'), ImageMedia.from('../media/token.png')]} );
        expect(asset.media instanceof Media).toBeTruthy();
        await asset.media.load();
        expect(asset.height).toEqual(48);
        expect(asset.width).toEqual(96);
    });

});