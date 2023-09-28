import { EventCtx } from '../js/eventCtx.js';
import { Fmt } from '../js/fmt.js';
import { Gizmo } from '../js/gizmo.js';

describe('an event context', () => {

    let emitter, receiver, ctx, counter;
    beforeEach(() => {
        counter = 0;
        ctx = new EventCtx();
        emitter = new Gizmo();
        receiver = new Gizmo();
    });

    it('can trigger events for specific emitter/receiver', ()=>{
        ctx.listen(emitter, 'test', () => counter++, receiver);
        ctx.trigger(emitter, 'test');
        expect(counter).toBe(1);
        ctx.ignore(emitter, 'test', null, receiver);
        ctx.trigger(emitter, 'test');
        expect(counter).toBe(1);
        expect(ctx.linksByGid.size).toEqual(0);
        expect(ctx.linksByTag.size).toEqual(0);
    });

    it('can trigger events for undefined emitter/specific receiver', ()=>{
        ctx.listen(null, 'test', () => counter++, receiver);
        ctx.trigger(emitter, 'test');
        expect(counter).toBe(1);
        ctx.ignore(null, 'test', null, receiver);
        ctx.trigger(emitter, 'test');
        expect(counter).toBe(1);
        expect(ctx.linksByGid.size).toEqual(0);
        expect(ctx.linksByTag.size).toEqual(0);
    });

    it('can trigger events for defined emitter/undefined receiver', ()=>{
        ctx.listen(emitter, 'test', () => counter++);
        ctx.trigger(emitter, 'test');
        expect(counter).toBe(1);
        ctx.ignore(emitter, 'test');
        ctx.trigger(emitter, 'test');
        expect(counter).toBe(1);
        expect(ctx.linksByGid.size).toEqual(0);
        expect(ctx.linksByTag.size).toEqual(0);
    });

    it('can trigger listener once', ()=>{
        ctx.listen(emitter, 'test', () => counter++, receiver, { once: true });
        ctx.trigger(emitter, 'test');
        ctx.trigger(emitter, 'test');
        expect(counter).toBe(1);
        expect(ctx.linksByGid.size).toEqual(0);
        expect(ctx.linksByTag.size).toEqual(0);
    });

    it('can prioritize listeners', ()=>{
        let incr = () => counter++;
        let double = () => counter*=2;
        ctx.listen(emitter, 'test', incr, receiver, { priority: 1, once: true });
        ctx.listen(emitter, 'test', double, receiver, { priority: 2, once: true });
        ctx.trigger(emitter, 'test');
        expect(counter).toBe(2);
        counter = 0;
        ctx.listen(emitter, 'test', incr, receiver, { priority: 2, once: true });
        ctx.listen(emitter, 'test', double, receiver, { priority: 1, once: true });
        ctx.trigger(emitter, 'test');
        expect(counter).toBe(1);
    });

});