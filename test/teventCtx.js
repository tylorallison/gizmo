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
    });

    it('can trigger events for undefined emitter/specific receiver', ()=>{
        ctx.listen(null, 'test', () => counter++, receiver);
        ctx.trigger(emitter, 'test');
        expect(counter).toBe(1);
    });

    it('can trigger listener once', ()=>{
        ctx.listen(emitter, 'test', () => counter++, receiver, { once: true });
        ctx.trigger(emitter, 'test');
        ctx.trigger(emitter, 'test');
        expect(counter).toBe(1);
        expect(ctx.linksByGid.get(emitter.gid)).toEqual(undefined);
        expect(ctx.linksByGid.get(receiver.gid)).toEqual(undefined);
        console.log(`ctx.linksByGid: ${Fmt.ofmt(ctx.linksByGid)}`);
    });

});