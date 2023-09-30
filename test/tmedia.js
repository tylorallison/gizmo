import { Assets, AssetCtx } from '../js/asset.js';
import { Media, ImageMedia } from '../js/media.js';

describe('media assets', () => {
    afterEach(() => {
        Assets.clear();
    });

    it('can be async loaded', async ()=>{
        let media = await Media.load('../media/test.mp3');
        //console.log(`media.data: ${media.data}`);
        expect(media.data instanceof ArrayBuffer).toBeTruthy();
        expect(media.src in AssetCtx.media).toBeTruthy();
        let media2 = await Media.load('../media/test.mp3');
        expect(media2.data instanceof ArrayBuffer).toBeTruthy();
    });

    it('can be constructed using from helper', async ()=>{
        let media = Media.from('../media/test.mp3');
        await media.load();
        //console.log(`media.data: ${media.data}`);
        expect(media.data instanceof ArrayBuffer).toBeTruthy();
    });

    it('can be constructed using constructor', async ()=>{
        let media = new Media({ src: '../media/test.mp3' });
        await media.load();
        expect(media.data instanceof ArrayBuffer).toBeTruthy();
    });

});

describe('image media assets', () => {
    afterEach(() => {
        Assets.clear();
    });

    it('can be async loaded', async ()=>{
        let media = await ImageMedia.load('../media/token.png');
        expect(media.data instanceof Image).toBeTruthy();
        //console.log(`media.src: ${media.src}`);
        //console.log(`AssetCtx.media: ${Fmt.ofmt(AssetCtx.media)}`);
        expect(media.src in AssetCtx.media).toBeTruthy();
        let media2 = await ImageMedia.load('../media/token.png');
        expect(media2.data instanceof Image).toBeTruthy();
        expect(media2.data.height).toEqual(48);
        expect(media2.data.width).toEqual(96);
    });

    it('can be constructed using from helper', async ()=>{
        let media = ImageMedia.from('../media/token.png');
        await media.load();
        expect(media.data instanceof Image).toBeTruthy();
    });

    it('can be constructed using constructor', async ()=>{
        let media = new ImageMedia({ src: '../media/token.png' });
        await media.load();
        expect(media.data instanceof Image).toBeTruthy();
    });

    it('can be scaled', async ()=>{
        let media = await ImageMedia.load({src: '../media/token.png', scale: 2 });
        expect(media.data instanceof Image).toBeTruthy();
        expect(media.data.height).toEqual(96);
        expect(media.data.width).toEqual(192);
    });

    it('can be taken from sheet', async ()=>{
        let media = await ImageMedia.load({ src: '../media/token.png', x: 16, y: 16, width: 16, height: 16 });
        expect(media.data instanceof Image).toBeTruthy();
        expect(media.data.height).toEqual(16);
        expect(media.data.width).toEqual(16);
    });

});