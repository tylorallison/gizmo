
import { EvtSystem, ExtEvtEmitter, ExtEvtReceiver} from '../js/event.js';
import { Helpers } from '../js/helpers.js';

describe('an event system', () => {

    let emitter, receiver;
    beforeEach(() => {
        emitter = Helpers.genEvtEmitter()
        receiver = Helpers.genEvtReceiver()
    });

    it('can trigger events', ()=>{
        let counter = 0;
        let incr = () => counter++;
        EvtSystem.listen(emitter, receiver, 'test', incr);
        EvtSystem.trigger(emitter, 'test');
        expect(counter).toBe(1);
    });

    it('can trigger listener once', ()=>{
        let counter = 0;
        let incr = () => counter++;
        EvtSystem.listen(emitter, receiver, 'test', incr, { once: true });
        EvtSystem.trigger(emitter, 'test');
        EvtSystem.trigger(emitter, 'test');
        expect(counter).toBe(1);
    });

    it('can prioritize listeners', ()=>{
        let counter = 0;
        let incr = () => counter++;
        let double = () => counter*=2;
        EvtSystem.listen(emitter, receiver, 'test', incr, { priority: 1 });
        EvtSystem.listen(emitter, receiver, 'test', double, { priority: 2 });
        EvtSystem.trigger(emitter, 'test');
        expect(counter).toBe(2);
    });

    it('can prioritize listeners 2', ()=>{
        let counter = 0;
        let incr = () => counter++;
        let double = () => counter*=2;
        EvtSystem.listen(emitter, receiver, 'test', incr, { priority: 2 });
        EvtSystem.listen(emitter, receiver, 'test', double, { priority: 1 });
        EvtSystem.trigger(emitter, 'test');
        expect(counter).toBe(1);
    });

    it('can ignore listeners', ()=>{
        let counter = 0;
        let incr = () => counter++;
        EvtSystem.listen(emitter, receiver, 'test', incr);
        EvtSystem.trigger(emitter, 'test');
        EvtSystem.ignore(emitter, receiver, 'test');
        EvtSystem.trigger(emitter, 'test');
        expect(counter).toBe(1);
    });

});