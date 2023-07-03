import { GizmoContext } from '../js/gizmo.js';
import { GameState } from '../js/gameState.js';
import { EvtSystem } from '../js/event.js';
import { Helpers } from '../js/helpers.js';

describe('a game state', () => {

    let gctx;
    let receiver;
    let tevt;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
        let receiver = Helpers.genEvtReceiver();
        tevt = {};
        EvtSystem.listen(gctx, receiver, 'state.started', (evt) => tevt = evt);
    });

    it('can be started', async ()=>{
        let state = new GameState( { gctx: gctx });
        await state.start();
        expect(tevt.tag).toEqual('state.started');
    });

    it('registers assets', async ()=>{
        let state = new GameState( { gctx: gctx, assetSpecs: [
            { cls: 'test', args: [{tag: 'test'}] },
        ] });
        await state.start();
        expect(tevt.tag).toEqual('state.started');
        let asset = state.assets.get('test');
        expect(asset).toBeTruthy();
        await state.stop();
        expect(state.assets.get('test')).toBeFalsy();
    });

    it('can be restarted', async ()=>{
        let state = new GameState( { gctx: gctx, assetSpecs: [
            { cls: 'test', args: [{tag: 'test'}] },
        ] });
        expect(state.state).toEqual('none');
        await state.start();
        expect(state.state).toEqual('started');
        await state.stop();
        expect(state.state).toEqual('initialized');
        await state.start();
        expect(state.state).toEqual('started');
        expect(state.assets.get('test')).toBeTruthy();
    });

});
