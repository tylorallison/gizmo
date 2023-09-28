import { EventCtx } from '../js/eventCtx.js';
import { GameState } from '../js/gameState.js';
import { StateMgr } from '../js/stateMgr.js';


describe('a state manager', () => {

    let ectx, mgr;
    beforeEach(() => {
        ectx = new EventCtx();
        EventCtx.advance(ectx);
        mgr = new StateMgr({ });
    });
    afterEach(() => {
        EventCtx.withdraw();
    });

    it('can watch for new states', ()=>{
        let state = new GameState({ tag: 'test'});
        expect(mgr.get('test')).toBe(state);
        expect(state.state).toEqual('none');
    });

    it('can watch for destroyed states', ()=>{
        let state = new GameState({ tag: 'test'});
        expect(mgr.get('test')).toBe(state);
        state.destroy();
        expect(mgr.get('test')).toBeFalsy();
    });

    it('can start a new state', async ()=>{
        let state = new GameState({ tag: 'test'});
        EventCtx.trigger(null, 'state.wanted', {state: 'test'});
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        await new Promise(resolve => EventCtx.listen(state, 'state.started', (evt) => resolve(), state));
        expect(state.state).toEqual('started');
        expect(mgr.current).toBe(state);
    });

    it('can start a new state from static fcn', async ()=>{
        let state = new GameState({ tag: 'test'});
        StateMgr.start('test', null);
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        await new Promise(resolve => EventCtx.listen(state, 'state.started', (evt) => resolve(), state));
        expect(state.state).toEqual('started');
        expect(mgr.current).toBe(state);
    });

    it('can start a second state', async ()=>{
        let state = new GameState({ tag: 'test'});
        let state2 = new GameState({ tag: 'test2'});
        EventCtx.trigger(null, 'state.wanted', {state: 'test'});
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        await new Promise(resolve => EventCtx.listen(state, 'state.started', (evt) => resolve(), state));
        expect(state.state).toEqual('started');
        expect(mgr.current).toBe(state);
        EventCtx.trigger(null, 'state.wanted', {state: 'test2'});
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        await new Promise(resolve => EventCtx.listen(state2, 'state.started', (evt) => resolve(), state2));
        expect(state.state).toEqual('initialized');
        expect(mgr.current).toBe(state2);
    });

});
