import { Evts } from '../js/evt.js';
import { Gizmo } from '../js/gizmo.js';
import { MoveAction, MoveSystem, MoveToAction } from '../js/move.js';
import { Vect } from '../js/vect.js';

describe('a move system', () => {
    let tevt, sys;
    beforeEach(() => {
        tevt = {};
        sys = new MoveSystem({
            actorLocator: (actor) => new Vect(actor),
            targetLocator: (target) => new Vect(target),
            actorMover: (actor, pos) => { 
                //console.log(`pos: ${pos}`); 
                actor.x = pos.x; 
                actor.y = pos.y;
            },
        });
    });
    afterEach(() => {
        Evts.clear();
    });

    class tMover extends Gizmo {
        static { this.schema('x', {dflt: 0})};
        static { this.schema('y', {dflt: 0})};
    }

    it('moves an actor', async ()=>{
        let action = new MoveAction({
            speed: 10,
            heading: 0,
        });
        let actor = new tMover({x:100,y:100});
        action.perform(actor);
        Evts.trigger(null, 'GameTock', { elapsed: 10 });
        expect(actor.x).toEqual(200);
        expect(actor.y).toEqual(100);
    });

    it('accelerates to target speed', async ()=>{
        let action = new MoveAction({
            speed: 10,
            accel: 1,
            heading: 0,
        });
        let actor = new tMover({x:100,y:100});
        action.perform(actor);
        Evts.trigger(null, 'GameTock', { elapsed: 2 });
        expect(actor.x).toEqual(102);
        expect(actor.y).toEqual(100);
        expect(action.currentSpeed).toEqual(2);
        Evts.trigger(null, 'GameTock', { elapsed: 8 });
        expect(action.currentSpeed).toEqual(10);
        expect(actor.x).toEqual(150);
        expect(actor.y).toEqual(100);
    });

    it('can move to a target', async ()=>{
        let target = new tMover({x:100,y:200});
        let action = new MoveToAction({
            speed: 10,
            heading: 0,
            target: target,
        });
        let actor = new tMover({x:100,y:100});
        Evts.listen(actor, 'ActionDone', (evt) => tevt = evt);
        action.perform(actor);
        Evts.trigger(null, 'GameTock', { elapsed: 1 });
        expect(actor.x).toEqual(100);
        expect(actor.y).toEqual(110);
        expect(action.currentSpeed).toEqual(10);
        Evts.trigger(null, 'GameTock', { elapsed: 9 });
        expect(actor.x).toEqual(100);
        expect(actor.y).toEqual(200);
        expect(action.currentSpeed).toEqual(0);
        expect(action.ok).toBeTruthy();
        expect(action.done).toBeTruthy();
        expect(tevt.tag).toEqual('ActionDone');
    });

    it('can move to a target with overrun', async ()=>{
        let target = new tMover({x:100,y:200});
        let action = new MoveToAction({
            speed: 10,
            heading: 0,
            target: target,
        });
        let actor = new tMover({x:100,y:100});
        Evts.listen(actor, 'ActionDone', (evt) => tevt = evt);
        action.perform(actor);
        Evts.trigger(null, 'GameTock', { elapsed: 5 });
        expect(actor.x).toEqual(100);
        expect(actor.y).toEqual(150);
        expect(action.currentSpeed).toEqual(10);
        Evts.trigger(null, 'GameTock', { elapsed: 10 });
        expect(actor.x).toEqual(100);
        expect(actor.y).toEqual(200);
        expect(action.currentSpeed).toEqual(0);
        expect(action.ok).toBeTruthy();
        expect(action.done).toBeTruthy();
        expect(tevt.tag).toEqual('ActionDone');
    });


});