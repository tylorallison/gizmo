import { Animator } from '../js/animator.js';
import { ImageMedia } from '../js/media.js';
import { Sprite } from '../js/sprite.js';

describe('an animator', () => {

    it('can be async loaded from map of URLs', async ()=>{
        let asset = await Animator.load({idle: '../media/token.png', walk: '../media/token.png'});
        expect(asset.sketches instanceof Object).toBeTruthy();
        expect(asset.sketches.idle.height).toEqual(48);
        expect(asset.sketches.idle.width).toEqual(96);
        expect(asset.sketches.walk.height).toEqual(48);
        expect(asset.sketches.walk.width).toEqual(96);
    });

    it('can be async loaded from map of image medias', async ()=>{
        let asset = await Animator.load({idle: ImageMedia.from('../media/token.png'), walk: ImageMedia.from('../media/token.png')});
        expect(asset.sketches instanceof Object).toBeTruthy();
        expect(asset.sketches.idle.height).toEqual(48);
        expect(asset.sketches.idle.width).toEqual(96);
        expect(asset.sketches.walk.height).toEqual(48);
        expect(asset.sketches.walk.width).toEqual(96);
    });

    it('can be async loaded from map of sketches', async ()=>{
        let asset = await Animator.load({idle: Sprite.from('../media/token.png'), walk: Sprite.from('../media/token.png')});
        expect(asset.sketches instanceof Object).toBeTruthy();
        expect(asset.sketches.idle.height).toEqual(48);
        expect(asset.sketches.idle.width).toEqual(96);
        expect(asset.sketches.walk.height).toEqual(48);
        expect(asset.sketches.walk.width).toEqual(96);
    });

    it('can be created using from helper', async ()=>{
        let asset = Animator.from({idle: '../media/token.png', walk: ImageMedia.from('../media/token.png'), run: Sprite.from('../media/token.png')});
        await asset.load();
        expect(asset.sketches instanceof Object).toBeTruthy();
        expect(asset.sketches.idle.height).toEqual(48);
        expect(asset.sketches.idle.width).toEqual(96);
        expect(asset.sketches.walk.height).toEqual(48);
        expect(asset.sketches.walk.width).toEqual(96);
        expect(asset.sketches.run.height).toEqual(48);
        expect(asset.sketches.run.width).toEqual(96);
    });

    it('can be created using constructor', async ()=>{
        let asset = new Animator({sketches: {idle: Sprite.from('../media/token.png'), walk:Sprite.from('../media/token.png')}});
        await asset.load();
        expect(asset.sketches instanceof Object).toBeTruthy();
        expect(asset.sketches.idle.height).toEqual(48);
        expect(asset.sketches.idle.width).toEqual(96);
        expect(asset.sketches.walk.height).toEqual(48);
        expect(asset.sketches.walk.width).toEqual(96);
    });

});