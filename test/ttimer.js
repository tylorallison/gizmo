import { Evts } from '../js/evt.js';
import { Fmt } from '../js/fmt.js';
import { Timer } from '../js/timer.js';

describe('timers', () => {

    let counter, incr;
    beforeEach(() => {
        counter = 0;
        incr = () => counter++;
    });
    afterEach(() => {
        Evts.clear();
    });

    it('can be triggered by game ticker', ()=>{
        let timer = new Timer({
            cb: incr,
            ttl: 500,
        });
        Evts.trigger(null, 'GameTock', { elapsed: 500 });
        expect(counter).toBe(1);
    });


    it('can be looped', ()=>{
        let timer = new Timer({
            cb: incr,
            ttl: 500,
            loop: true,
        });
        Evts.trigger(null, 'GameTock', { elapsed: 500 });
        Evts.trigger(null, 'GameTock', { elapsed: 500 });
        expect(counter).toBe(2);
    });

    it('loop tracks overlap', ()=>{
        let timer = new Timer({
            cb: incr,
            ttl: 150,
            loop: true,
        });
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        expect(counter).toBe(0);
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        expect(counter).toBe(1);
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        expect(counter).toBe(2);
    });

    it('destroyed timers are ignored', ()=>{
        let timer = new Timer({
            cb: incr,
            ttl: 500,
            loop: true,
        });
        timer.destroy();
        Evts.trigger(null, 'GameTock', { elapsed: 500 });
        expect(counter).toBe(0);
    });

});
