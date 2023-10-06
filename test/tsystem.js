import { Evts } from '../js/evt.js';
import { Gizmo } from '../js/gizmo.js';
import { System } from '../js/system.js';

describe('systems', () => {

    afterEach(() => {
        Evts.clear();
    });

    it('automatically track entities based on match rules', ()=>{
        let g = new Gizmo();
        let e = { gid: 1, wanted: true };
        let system = new System({
            matchFcn: (e) => e.wanted,
        });
        Evts.trigger(null, 'GizmoCreated', { actor: e });
        expect(system.store.has(1)).toBeTrue();
        Evts.trigger(null, 'GizmoDestroyed', { actor: e });
        expect(system.store.has(1)).toBeFalse();
        let other = { gid: 2, wanted: false };
        Evts.trigger(null, 'GizmoCreated', { actor: other });
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
        Evts.trigger(null, 'GizmoCreated', { actor: e });
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        expect(e.visited).toBeTrue();
    });

    it('system listeners cleared upon destroy', ()=>{
        let links = Evts.findLinksForEvt(null, 'GizmoCreated');
        expect(links.length).toEqual(0);
        let system = new System({});
        links = Evts.findLinksForEvt(null, 'GizmoCreated');
        expect(links.length).toEqual(1);
        system.destroy();
        links = Evts.findLinksForEvt(null, 'GizmoCreated');
        expect(links.length).toEqual(0);
    });

});
