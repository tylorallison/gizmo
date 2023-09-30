import { Evts } from '../js/evt.js';
import { GameState } from '../js/gameState.js';
import { StateMgr } from '../js/stateMgr.js';


describe('a state manager', () => {

    let mgr;
    beforeEach(() => {
        mgr = new StateMgr({ });
    });
    afterEach(() => {
        Evts.clear();
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
        Evts.trigger(null, 'state.wanted', {state: 'test'});
        Evts.trigger(null, 'game.tock', { deltaTime: 100 });
        await new Promise(resolve => Evts.listen(state, 'state.started', (evt) => resolve(), state));
        expect(state.state).toEqual('started');
        expect(mgr.current).toBe(state);
    });

    it('can start a new state from static fcn', async ()=>{
        let state = new GameState({ tag: 'test'});
        StateMgr.start('test', null);
        Evts.trigger(null, 'game.tock', { deltaTime: 100 });
        await new Promise(resolve => Evts.listen(state, 'state.started', (evt) => resolve(), state));
        expect(state.state).toEqual('started');
        expect(mgr.current).toBe(state);
    });

    it('can start a second state', async ()=>{
        let state = new GameState({ tag: 'test'});
        let state2 = new GameState({ tag: 'test2'});
        Evts.trigger(null, 'state.wanted', {state: 'test'});
        Evts.trigger(null, 'game.tock', { deltaTime: 100 });
        await new Promise(resolve => Evts.listen(state, 'state.started', (evt) => resolve(), state));
        expect(state.state).toEqual('started');
        expect(mgr.current).toBe(state);
        Evts.trigger(null, 'state.wanted', {state: 'test2'});
        Evts.trigger(null, 'game.tock', { deltaTime: 100 });
        await new Promise(resolve => Evts.listen(state2, 'state.started', (evt) => resolve(), state2));
        expect(state.state).toEqual('initialized');
        expect(mgr.current).toBe(state2);
    });

});
