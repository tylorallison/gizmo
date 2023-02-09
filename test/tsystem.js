import { GizmoContext } from '../js/gizmoContext.js';
import { EvtSystem, ExtEvtEmitter } from '../js/event.js';
import { Gizmo } from '../js/gizmo.js';
import { System } from '../js/system.js';

describe('systems', () => {

    it('automatically track entities based on match rules', ()=>{
        let g = new Gizmo();
        let emitter = ExtEvtEmitter.gen();
        let e = { gid: 1, wanted: true };
        let system = new System({
            gctx: emitter,
            matchFcn: (e) => e.wanted,
        });
        EvtSystem.trigger(emitter, 'gizmo.created', { actor: e });
        expect(system.store.has(1)).toBeTrue();
        EvtSystem.trigger(emitter, 'gizmo.destroyed', { actor: e });
        expect(system.store.has(1)).toBeFalse();
        let other = { gid: 2, wanted: false };
        EvtSystem.trigger(emitter, 'gizmo.created', { actor: other });
        expect(system.store.has(2)).toBeFalse();
    });

    it('can iterate over tracked entities', ()=>{
        let g = new Gizmo();
        let emitter = ExtEvtEmitter.gen();
        let e = { gid: 1, wanted: true };
        let system = new System({
            gctx: emitter,
            matchFcn: (e) => e.wanted,
            iterateTTL: 100,
        });
        system.iterate = (evt, e) => e.visited = true;
        EvtSystem.trigger(emitter, 'gizmo.created', { actor: e });
        EvtSystem.trigger(emitter, 'game.tock', { deltaTime: 100 });
        expect(e.visited).toBeTrue();
    });

    it('system listeners cleared upon destroy', ()=>{
        let gctx = new GizmoContext({tag: 'test'});
        let links = [];
        EvtSystem.findLinksForEvt(gctx, {tag: 'gizmo.created'}, links);
        expect(links.length).toEqual(0);
        let system = new System({
            gctx: gctx,
        });
        links = [];
        EvtSystem.findLinksForEvt(gctx, {tag: 'gizmo.created'}, links);
        expect(links.length).toEqual(1);
        system.destroy();
        links = [];
        EvtSystem.findLinksForEvt(gctx, {tag: 'gizmo.created'}, links);
        expect(links.length).toEqual(0);
    });

});