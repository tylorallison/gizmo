import { GizmoContext } from '../js/gizmoContext.js';
import { GameState } from '../js/gameState.js';
import { EvtSystem } from '../js/event.js';

describe('a game state', () => {

    let gctx;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
    });

    it('can be started', async ()=>{
        let state = new GameState( { gctx: gctx });
        await state.start();
        expect(EvtSystem.getCount(state, 'state.started')).toBe(1);
    });

    it('registers assets', async ()=>{
        let state = new GameState( { gctx: gctx, assetSpecs: [
            { cls: 'test', tag: 'test' },
        ] });
        await state.start();
        expect(EvtSystem.getCount(state, 'state.started')).toBe(1);
        let asset = state.assets.get('test');
        expect(asset).toBeTruthy();
        await state.stop();
        expect(state.assets.get('test')).toBeFalsy();
    });

    it('can be restarted', async ()=>{
        let state = new GameState( { gctx: gctx, assetSpecs: [
            { cls: 'test', tag: 'test' },
        ] });
        expect(state.state).toEqual('created');
        await state.start();
        expect(state.state).toEqual('started');
        await state.stop();
        expect(state.state).toEqual('initialized');
        await state.start();
        expect(state.state).toEqual('started');
        expect(state.assets.get('test')).toBeTruthy();
    });

});