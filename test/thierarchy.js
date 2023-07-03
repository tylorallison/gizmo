import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { Gizmo, GizmoContext } from '../js/gizmo.js';
import { Hierarchy } from '../js/hierarchy.js';
import { Helpers } from '../js/helpers.js';

describe('hierarchies', () => {

    let gctx, receiver, parent, child, child2;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
        receiver = Helpers.genEvtReceiver();
        parent = new Gizmo({gctx: gctx, tag: 'parent'});
        child = new Gizmo({gctx: gctx, tag: 'child'});
        child2 = new Gizmo({gctx: gctx, tag: 'child2'});
    });

    it('can create parent child relationships', ()=>{
        let tevt = {};
        EvtSystem.listen(gctx, receiver, 'gizmo.adopted', (evt) => tevt = evt);
        Hierarchy.adopt(parent, child);
        expect(tevt.actor).toEqual(child);
        expect(tevt.child).toEqual(child);
        expect(tevt.parent).toEqual(parent);
        expect(parent.children.includes(child)).toBeTrue();
        expect(child.parent).toEqual(parent);
    });

    it('can detect hierarchy loops in parent', ()=>{
        let tevt = {};
        EvtSystem.listen(gctx, receiver, 'gizmo.adopted', (evt) => tevt = evt);
        parent.children.push(child);
        Hierarchy.adopt(parent, child);
        expect(tevt).toEqual({});
    });

    it('can detect hierarchy loops in child', ()=>{
        let tevt = {};
        EvtSystem.listen(gctx, receiver, 'gizmo.adopted', (evt) => tevt = evt);
        child.children.push(parent);
        Hierarchy.adopt(parent, child);
        expect(tevt).toEqual({});
    });

    it('can find root', ()=>{
        Hierarchy.adopt(parent, child);
        Hierarchy.adopt(child, child2);
        let root = Hierarchy.root(child);
        expect(root).toEqual(parent);
        root = Hierarchy.root(child2);
        expect(root).toEqual(parent);
    });

    it('can find object in root hierarchy', ()=>{
        Hierarchy.adopt(parent, child);
        Hierarchy.adopt(child, child2);
        expect(Hierarchy.findInRoot(parent, (v) => v.tag === 'child')).toEqual(child);
        expect(Hierarchy.findInRoot(child, (v) => v.tag === 'child')).toEqual(child);
        expect(Hierarchy.findInRoot(child2, (v) => v.tag === 'child')).toEqual(child);
    });

    it('can find object in hierarchy', ()=>{
        Hierarchy.adopt(parent, child);
        Hierarchy.adopt(child, child2);
        expect(Hierarchy.find(parent, (v) => v.tag === 'child')).toEqual(child);
        expect(Hierarchy.find(child, (v) => v.tag === 'child')).toEqual(child);
        expect(Hierarchy.find(child2, (v) => v.tag === 'child')).toBeFalsy();
    });

    it('can find object in parent', ()=>{
        Hierarchy.adopt(parent, child);
        Hierarchy.adopt(child, child2);
        expect(Hierarchy.findInParent(parent, (v) => v.tag === 'child')).toBeFalsy();
        expect(Hierarchy.findInParent(child, (v) => v.tag === 'child')).toBeFalsy();
        expect(Hierarchy.findInParent(child2, (v) => v.tag === 'child')).toEqual(child);
    });

    it('can find matching children', ()=>{
        Hierarchy.adopt(parent, child);
        Hierarchy.adopt(child, child2);
        expect(Array.from(Hierarchy.children(parent, (v) => v.tag.startsWith('child')))).toEqual([child2, child]);
        expect(Array.from(Hierarchy.children(child, (v) => v.tag.startsWith('child')))).toEqual([child2]);
        expect(Array.from(Hierarchy.children(child2, (v) => v.tag.startsWith('child')))).toEqual([]);
    });

});