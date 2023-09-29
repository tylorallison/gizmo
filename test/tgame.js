
import { Evts } from '../js/evt.js';
import { Game } from '../js/game.js';

describe('a game', () => {

    afterEach(() => {
        Evts.clear();
    });

    it('can trigger events', ()=>{
        let g = new Game();
        let counter = 0;
        let incr = () => counter++;
        Evts.listen(g, 'test', incr);
        Evts.trigger(g, 'test');
        expect(counter).toBe(1);
    });

    it('can be started', async ()=>{
        let g = new Game();
        let tevt = {};
        Evts.listen(g, 'GameStarted', (evt) => tevt=evt );
        await g.start();
        expect(tevt.actor).toBe(g);
    });

});