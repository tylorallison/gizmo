import { GameState } from '../js/gameState.js';
import { AssetCtx } from '../js/assetCtx.js';
import { Rect } from '../js/rect.js';
import { EventCtx } from '../js/eventCtx.js';

describe('a game state', () => {

    let ectx, tevt;
    beforeEach(() => {
        ectx = new EventCtx();
        EventCtx.advance(ectx);
        tevt = {};
        EventCtx.listen(null, 'state.started', (evt) => tevt = evt);
    });
    afterEach(() => {
        EventCtx.withdraw();
    });

    it('can be started', async ()=>{
        let state = new GameState( {} );
        await state.start();
        expect(tevt.tag).toEqual('state.started');
    });

    it('registers assets', async ()=>{
        let state = new GameState( { xassets: [
            Rect.xspec({tag: 'test'}),
        ] });
        await state.start();
        expect(tevt.tag).toEqual('state.started');
        let asset = AssetCtx.get('test');
        expect(asset).toBeTruthy();
        await state.stop();
        expect(AssetCtx.get('test')).toBeFalsy();
    });

    it('can be restarted', async ()=>{
        let state = new GameState( { xassets: [
            Rect.xspec({tag: 'test'}),
        ] });
        expect(state.state).toEqual('none');
        await state.start();
        expect(state.state).toEqual('started');
        await state.stop();
        expect(state.state).toEqual('initialized');
        await state.start();
        expect(state.state).toEqual('started');
        expect(AssetCtx.get('test')).toBeTruthy();
        await state.stop();
    });

});
