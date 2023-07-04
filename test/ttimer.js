import { EvtSystem, ExtEvtEmitter } from '../js/event.js';
import { Helpers } from '../js/helpers.js';
import { Timer } from '../js/timer.js';

describe('timers', () => {

    let ticker, counter, incr;
    beforeEach(() => {
        ticker = Helpers.genEvtEmitter();
        counter = 0;
        incr = () => counter++;
    });

    it('can be triggered by game ticker', ()=>{
        let timer = new Timer({
            gctx: ticker,
            cb: incr,
            ttl: 500,
        });
        EvtSystem.trigger(ticker, 'game.tock', { deltaTime: 500 });
        EvtSystem.trigger(ticker, 'game.tock', { deltaTime: 500 });
        expect(counter).toBe(1);
    });


    it('can be looped', ()=>{
        let timer = new Timer({
            gctx: ticker,
            cb: incr,
            ttl: 500,
            loop: true,
        });
        EvtSystem.trigger(ticker, 'game.tock', { deltaTime: 500 });
        EvtSystem.trigger(ticker, 'game.tock', { deltaTime: 500 });
        expect(counter).toBe(2);
    });

    it('loop tracks overlap', ()=>{
        let timer = new Timer({
            gctx: ticker,
            cb: incr,
            ttl: 150,
            loop: true,
        });
        EvtSystem.trigger(ticker, 'game.tock', { deltaTime: 100 });
        expect(counter).toBe(0);
        EvtSystem.trigger(ticker, 'game.tock', { deltaTime: 100 });
        expect(counter).toBe(1);
        EvtSystem.trigger(ticker, 'game.tock', { deltaTime: 100 });
        expect(counter).toBe(2);
    });

    it('destroyed timers are ignored', ()=>{
        let timer = new Timer({
            gctx: ticker,
            cb: incr,
            ttl: 500,
            loop: true,
        });
        timer.destroy();
        EvtSystem.trigger(ticker, 'game.tock', { deltaTime: 500 });
        expect(counter).toBe(0);
    });

});