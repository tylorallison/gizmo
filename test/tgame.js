
import { EvtSystem } from '../js/event.js';
import { Game } from '../js/game.js';

describe('a game', () => {

    it('can trigger events', ()=>{
        let g = new Game();
        let counter = 0;
        let incr = () => counter++;
        EvtSystem.listen(g, g, 'test', incr);
        EvtSystem.trigger(g, 'test');
        expect(counter).toBe(1);
    });

    it('can be started', async ()=>{
        let g = new Game();
        let tevt = {};
        EvtSystem.listen(g, g, 'game.started', (evt) => tevt=evt );
        await g.start();
        expect(tevt.actor).toBe(g);
    });

});