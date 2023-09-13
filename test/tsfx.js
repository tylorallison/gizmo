import { Media } from '../js/media.js';
import { Sfx } from '../js/sfx.js';

describe('sfx assets', () => {

    it('can be async loaded from URL', async ()=>{
        let asset = await Sfx.load('../media/test.mp3');
        expect(asset.media instanceof Media).toBeTruthy();
        expect(asset.media.data.byteLength).toEqual(1842);
    });

    it('can be async loaded from media spec', async ()=>{
        let asset = await Sfx.load(Media.xspec({src: '../media/test.mp3'}));
        expect(asset.media instanceof Media).toBeTruthy();
        expect(asset.media.data.byteLength).toEqual(1842);
    });

    it('can be created using from helper', async ()=>{
        let asset = Sfx.from('../media/test.mp3');
        expect(asset.media instanceof Media).toBeTruthy();
        await asset.media.load();
        expect(asset.media.data.byteLength).toEqual(1842);
    });

    it('can be created using constructor', async ()=>{
        let asset = new Sfx({ media: Media.from('../media/test.mp3') });
        expect(asset.media instanceof Media).toBeTruthy();
        await asset.media.load();
        expect(asset.media.data.byteLength).toEqual(1842);
    });

});