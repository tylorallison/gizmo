import { GameState } from '../js/gameState.js';
import { Assets } from '../js/asset.js';
import { Rect } from '../js/rect.js';
import { Evts } from '../js/evt.js';

describe('a game state', () => {

    let tevt;
    beforeEach(() => {
        tevt = {};
        Evts.listen(null, 'StateStarted', (evt) => tevt = evt);
    });
    afterEach(() => {
        Assets.clear();
        Evts.clear();
    });

    it('can be started', async ()=>{
        let state = new GameState( {} );
        await state.start();
        expect(tevt.tag).toEqual('StateStarted');
    });

    it('registers assets', async ()=>{
        let state = new GameState( { xassets: [
            Rect.xspec({tag: 'test'}),
        ] });
        await state.start();
        expect(tevt.tag).toEqual('StateStarted');
        let asset = Assets.get('test');
        expect(asset).toBeTruthy();
        await state.stop();
        expect(Assets.get('test')).toBeFalsy();
    });

    it('can be restarted', async ()=>{
        let state = new GameState( { xassets: [
            Rect.xspec({tag: 'test'}),
        ] });
        expect(state.state).toEqual('inactive');
        await state.start();
        expect(state.state).toEqual('active');
        await state.stop();
        expect(state.state).toEqual('inactive');
        await state.start();
        expect(state.state).toEqual('active');
        expect(Assets.get('test')).toBeTruthy();
        await state.stop();
    });

});
