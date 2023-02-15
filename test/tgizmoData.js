import { EvtSystem, ExtEvtEmitter, ExtEvtReceiver } from '../js/event.js';
import { GizmoData } from '../js/gizmoData.js';
import { Schema } from '../js/schema.js';

describe('gizmo data', () => {

    it('attributes become readonly when attached to readonly GizmoData', ()=>{
        class TLeaf extends GizmoData {
            static { 
                Schema.apply(this, 'el'); 
            };
        };
        class TRO extends GizmoData {
            static { 
                Schema.apply(this, 'leaf', { link: true, readonly: true }); 
            };
        };
        let leaf = new TLeaf({el: 'hello'});
        leaf.el = 'there';
        expect(leaf.el).toEqual('there');
        let ro = new TRO({ leaf: leaf });
        leaf.el = 'again';
        expect(leaf.el).toEqual('there');
        leaf.$unlink();
        leaf.el = 'once more';
        expect(leaf.el).toEqual('once more');
    });

    it('can trigger trunk update on child update', ()=>{
        let subUpdate = {};
        let rootUpdate = {};
        class TLeaf extends GizmoData {
            static { 
                Schema.apply(this, 'el'); 
            };
        };
        class TSub extends GizmoData {
            static { 
                Schema.apply(this, 'leaf', { link: true }); 
            };
        };
        class TSubUpdate extends GizmoData {
            static { 
                Schema.apply(this, 'leaf', { atUpdate: (o,k,ov,nv) => subUpdate = { ov: ov, nv: nv }, link: true }); 
            };
        };
        class TRoot extends GizmoData {
            static { 
                Schema.apply(this, 'sub', { atUpdate: (o,k,ov,nv) => rootUpdate = { ov: ov, nv: nv }, link: true }); 
            };
        };
        let leaf = new TLeaf({el: 'hello'});
        let sub = new TSub();
        let subu = new TSubUpdate();
        let root = new TRoot();
        leaf.el = 'there';
        expect(subUpdate).toEqual({});
        expect(rootUpdate).toEqual({});
        sub.leaf = leaf;
        leaf.el = 'leaf1';
        expect(subUpdate).toEqual({});
        expect(rootUpdate).toEqual({});
        root.sub = sub;
        leaf.el = 'sub1';
        expect(subUpdate).toEqual({});
        expect(rootUpdate).toEqual({ov: 'leaf1', nv: 'sub1'});
        rootUpdate = {};
        subu.leaf = leaf;
        leaf.el = 'leaf2';
        expect(subUpdate).toEqual({ov: 'sub1', nv: 'leaf2'});
        expect(rootUpdate).toEqual({});
        subUpdate = {};
        root.sub = subu;
        leaf.el = 'sub2';
        expect(subUpdate).toEqual({ov: 'leaf2', nv: 'sub2'});
        expect(rootUpdate).toEqual({ov: 'leaf2', nv: 'sub2'});
    });

    it('can be registered', ()=>{
        let cls = class TRegister extends GizmoData {};
        let o = new cls;
        expect(GizmoData.registry.hasOwnProperty('TRegister')).toBeTruthy();
    });

    it('can be linked', ()=>{
        class TGizmoDataSub extends GizmoData {
            static { Schema.apply(this, 'data'); };
        };
        class TGizmoData extends GizmoData {
            static { Schema.apply(this, 'sub', { link: true }); };
        };
        let o = new TGizmoData({sub: new TGizmoDataSub({data: 'foo'})});
        expect(o.sub.data).toEqual('foo');
    });

    it('data changes trigger events', ()=>{
        class TGizmoDataSub extends GizmoData {
            static { Schema.apply(this, 'data'); };
        };
        class TGizmoData extends GizmoData {
            static { 
                Schema.apply(this, 'sub', { link: true });
                ExtEvtEmitter.apply(this)
            };
        };
        let o = new TGizmoData({sub: new TGizmoDataSub({data: 'foo'})});
        expect(o.sub.data).toEqual('foo');
        let receiver = ExtEvtReceiver.gen();
        let tevt;
        EvtSystem.listen(o, receiver, 'gizmo.set', (evt) => tevt = evt);
        o.sub.data = 'bar';
        //EvtSystem.trigger(emitter, 'test');
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(o);
        expect(tevt.set['sub.data']).toEqual('bar');
    });

});