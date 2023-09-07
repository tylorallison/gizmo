import { AssetCtx } from '../js/assetCtx.js';
import { Media } from '../js/media.js';

describe('media assets', () => {
    let ctx;
    beforeEach(() => {
        ctx = new AssetCtx();
        AssetCtx.advance(ctx);
    });
    afterEach(() => {
        AssetCtx.withdraw();
    });

    it('can be async loaded', async ()=>{
        let media = await Media.load('../media/token.png');
        expect(media.data instanceof ArrayBuffer).toBeTruthy();
        console.log(`media: ${media}`);
    });

    it('can be constructed using from helper', async ()=>{
        let media = Media.from('../media/token.png');
        expect(media.data instanceof ArrayBuffer).toBeTruthy();
        console.log(`media: ${media}`);
    });

});