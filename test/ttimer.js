import { EventCtx } from '../js/eventCtx.js';
import { Fmt } from '../js/fmt.js';
import { Timer } from '../js/timer.js';

describe('timers', () => {

    let counter, incr, ectx;
    beforeEach(() => {
        ectx = new EventCtx();
        EventCtx.advance(ectx);
        counter = 0;
        incr = () => counter++;
    });
    afterEach(() => {
        EventCtx.withdraw();
    });

    it('can be triggered by game ticker', ()=>{
        let timer = new Timer({
            cb: incr,
            ttl: 500,
        });
        EventCtx.trigger(null, 'game.tock', { deltaTime: 500 });
        expect(counter).toBe(1);
    });


    it('can be looped', ()=>{
        let timer = new Timer({
            cb: incr,
            ttl: 500,
            loop: true,
        });
        EventCtx.trigger(null, 'game.tock', { deltaTime: 500 });
        EventCtx.trigger(null, 'game.tock', { deltaTime: 500 });
        expect(counter).toBe(2);
    });

    it('loop tracks overlap', ()=>{
        let timer = new Timer({
            cb: incr,
            ttl: 150,
            loop: true,
        });
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(counter).toBe(0);
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(counter).toBe(1);
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(counter).toBe(2);
    });

    it('destroyed timers are ignored', ()=>{
        let timer = new Timer({
            cb: incr,
            ttl: 500,
            loop: true,
        });
        timer.destroy();
        EventCtx.trigger(null, 'game.tock', { deltaTime: 500 });
        expect(counter).toBe(0);
    });

});