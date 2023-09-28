import { EventCtx } from '../js/eventCtx.js';
import { Gizmo } from '../js/gizmo.js';
import { System } from '../js/system.js';

describe('systems', () => {

    let ectx;
    beforeEach(() => {
        ectx = new EventCtx();
        EventCtx.advance(ectx);
    });
    afterEach(() => {
        EventCtx.withdraw();
    });

    it('automatically track entities based on match rules', ()=>{
        let g = new Gizmo();
        let e = { gid: 1, wanted: true };
        let system = new System({
            matchFcn: (e) => e.wanted,
        });
        EventCtx.trigger(null, 'gizmo.created', { actor: e });
        expect(system.store.has(1)).toBeTrue();
        EventCtx.trigger(null, 'gizmo.destroyed', { actor: e });
        expect(system.store.has(1)).toBeFalse();
        let other = { gid: 2, wanted: false };
        EventCtx.trigger(null, 'gizmo.created', { actor: other });
        expect(system.store.has(2)).toBeFalse();
    });

    it('can iterate over tracked entities', ()=>{
        let g = new Gizmo();
        let e = { gid: 1, wanted: true };
        let system = new System({
            matchFcn: (e) => e.wanted,
            iterateTTL: 100,
        });
        system.iterate = (evt, e) => e.visited = true;
        EventCtx.trigger(null, 'gizmo.created', { actor: e });
        EventCtx.trigger(null, 'game.tock', { deltaTime: 100 });
        expect(e.visited).toBeTrue();
    });

    it('system listeners cleared upon destroy', ()=>{
        let links = EventCtx.$instance.findLinksForEvt(null, 'gizmo.created');
        expect(links.length).toEqual(0);
        let system = new System({});
        links = EventCtx.$instance.findLinksForEvt(null, 'gizmo.created');
        expect(links.length).toEqual(1);
        system.destroy();
        links = EventCtx.$instance.findLinksForEvt(null, 'gizmo.created');
        expect(links.length).toEqual(0);
    });

});
