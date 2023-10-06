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
        expect(state.state).toEqual('inactive');
    });

    it('can watch for destroyed states', ()=>{
        let state = new GameState({ tag: 'test'});
        expect(mgr.get('test')).toBe(state);
        state.destroy();
        expect(mgr.get('test')).toBeFalsy();
    });

    it('can start a new state', async ()=>{
        let state = new GameState({ tag: 'test'});
        Evts.trigger(null, 'StateWanted', {state: 'test'});
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        await new Promise(resolve => Evts.listen(state, 'StateStarted', (evt) => resolve(), state));
        expect(state.state).toEqual('active');
        expect(mgr.current).toBe(state);
    });

    it('can start a new state from static fcn', async ()=>{
        let state = new GameState({ tag: 'test'});
        StateMgr.start('test', null);
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        await new Promise(resolve => Evts.listen(state, 'StateStarted', (evt) => resolve(), state));
        expect(state.state).toEqual('active');
        expect(mgr.current).toBe(state);
    });

    it('can start a second state', async ()=>{
        let state = new GameState({ tag: 'test'});
        let state2 = new GameState({ tag: 'test2'});
        Evts.trigger(null, 'StateWanted', {state: 'test'});
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        await new Promise(resolve => Evts.listen(state, 'StateStarted', (evt) => resolve(), state));
        expect(state.state).toEqual('active');
        expect(mgr.current).toBe(state);
        Evts.trigger(null, 'StateWanted', {state: 'test2'});
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        await new Promise(resolve => Evts.listen(state2, 'StateStarted', (evt) => resolve(), state2));
        expect(state.state).toEqual('inactive');
        expect(mgr.current).toBe(state2);
    });

});
