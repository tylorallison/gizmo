import { GizmoContext } from '../js/gizmoContext.js';
import { EvtSystem } from '../js/event.js';
import { GameState } from '../js/gameState.js';
import { StateMgr } from '../js/stateMgr.js';

describe('a state manager', () => {

    let gctx, mgr;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
        mgr = new StateMgr({ gctx: gctx });
    });

    it('can watch for new states', ()=>{
        let state = new GameState({ gctx: gctx, tag: 'test'});
        expect(mgr.get('test')).toBe(state);
        expect(state.state).toEqual('none');
    });

    it('can watch for destroyed states', ()=>{
        let state = new GameState({ gctx: gctx, tag: 'test'});
        expect(mgr.get('test')).toBe(state);
        state.destroy();
        expect(mgr.get('test')).toBeFalsy();
    });

    it('can start a new state', async ()=>{
        let state = new GameState({ gctx: gctx, tag: 'test'});
        EvtSystem.trigger(gctx, 'state.wanted', {state: 'test'});
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        await new Promise(resolve => EvtSystem.listen(state, state, 'state.started', (evt) => resolve()));
        expect(state.state).toEqual('started');
        expect(mgr.current).toBe(state);
    });

    it('can start a new state from static fcn', async ()=>{
        let state = new GameState({ gctx: gctx, tag: 'test'});
        StateMgr.start('test', null, gctx);
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        await new Promise(resolve => EvtSystem.listen(state, state, 'state.started', (evt) => resolve()));
        expect(state.state).toEqual('started');
        expect(mgr.current).toBe(state);
    });

    it('can start a second state', async ()=>{
        let state = new GameState({ gctx: gctx, tag: 'test'});
        let state2 = new GameState({ gctx: gctx, tag: 'test2'});
        EvtSystem.trigger(gctx, 'state.wanted', {state: 'test'});
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        await new Promise(resolve => EvtSystem.listen(state, state, 'state.started', (evt) => resolve()));
        expect(state.state).toEqual('started');
        expect(mgr.current).toBe(state);
        EvtSystem.trigger(gctx, 'state.wanted', {state: 'test2'});
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        await new Promise(resolve => EvtSystem.listen(state2, state2, 'state.started', (evt) => resolve()));
        expect(state.state).toEqual('initialized');
        expect(mgr.current).toBe(state2);
    });

});