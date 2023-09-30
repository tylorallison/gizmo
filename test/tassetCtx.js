import { AssetCtx, Assets } from '../js/asset.js';
import { ImageMedia } from '../js/media.js';
import { Sprite } from '../js/sprite.js';
import { Asset } from '../js/asset.js';

//import { Game } from '../js/game.js';
//import { UiPanel } from '../js/uiPanel.js';

describe('an asset context', () => {
    afterEach(() => {
        Assets.clear();
    });

    xit('can be referenced via game asset specifications', async ()=>{
        // asset specifications defined as static members of the game
        // -- these are evaluated at declaration of class
        // -- media resolved when game is started (not at declaration)
        class TestGame extends Game {
            static xassets = [
                Sprite.xspec({
                    tag: 'token',
                    media: ImageMedia.xspec({src: '../media/token.png'}),
                }),
            ];
        }

        let game = new TestGame();
        // -- media is not loaded until here
        game.start();
        let panel = new UiPanel({
            sketch: AssetCtx.get('token'),
        });

    });

    it('can add and load assets by spec', async ()=>{
        Assets.add(Sprite.xspec({
            media: ImageMedia.xspec({src: '../media/token.png'}),
            tag: 'token',
        }));
        await Assets.advance();
        let asset = Assets.get('token');
        expect(asset instanceof Asset).toBeTruthy();
        expect(asset.height).toEqual(48);
        expect(asset.width).toEqual(96);
    });

    it('can add and load raw assets', async ()=>{
        Assets.add(Sprite.from('../media/token.png', { tag: 'token'}));
        await Assets.advance();
        let asset = Assets.get('token');
        expect(asset instanceof Asset).toBeTruthy();
        expect(asset.height).toEqual(48);
        expect(asset.width).toEqual(96);
    });

    it('can load/unload assets', async ()=>{
        let xasset = Sprite.from('../media/token.png', { tag: 'token'});
        Assets.add(xasset);
        await Assets.advance();
        let asset = Assets.get('token');
        expect(asset instanceof Asset).toBeTruthy();
        expect(asset.height).toEqual(48);
        expect(asset.width).toEqual(96);
        Assets.delete(xasset);
        asset = Assets.get('token');
        expect(asset).toBeFalsy();
    });

});