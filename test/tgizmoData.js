import { EvtSystem, ExtEvtEmitter, ExtEvtReceiver } from '../js/event.js';
import { GizmoData } from '../js/gizmoData.js';
import { Schema } from '../js/schema.js';

describe('gizmo data r2', () => {
    it('can be poked', ()=>{
        let ticker = 1;
        class TGizmoDataSub extends GizmoData {
            static { 
                Schema.apply(this, 'data'); 
                Schema.apply(this, 'tick', { autogen: true, setter: () => ticker++, dflt: 'foo'} ); 
            };
        };
        class TGizmoData extends GizmoData {
            static { 
                Schema.apply(this, 'sub', { link: true }); 
            };
        };
        let o = new TGizmoData({sub: new TGizmoDataSub({data: 'foo'})});
        console.log(`o: ${o}`);
        console.log(`o.$trunk: ${o.$trunk}`);
        console.log(`o.sub: ${o.sub}`);
        console.log(`o.sub.$trunk: ${o.sub.$trunk}`);
        console.log(`o.sub.tick: ${o.sub.tick}`);
        o.sub.data = 'bar';
        console.log(`o.sub.tick: ${o.sub.tick}`);
    });
});

describe('gizmo data', () => {

    it('can trigger trunk update on child update', ()=>{
        class TLeaf extends GizmoData {
            static { 
                Schema.apply(this, 'el'); 
            };
        };
        class TSub extends GizmoData {
            static { 
                Schema.apply(this, 'leaf', { onBranchSet: (o,k,ov,nv) => { console.log( `${o} set ${k} from ${ov} to ${nv}`); }, link: true }); 
            };
        };
        class TRoot extends GizmoData {
            static { 
                Schema.apply(this, 'sub', { onBranchSet: (o,k,ov,nv) => { console.log( `${o} set ${k} from ${ov} to ${nv}`); }, link: true }); 
            };
        };
        let root = new TRoot({sub: new TSub({leaf: new TLeaf({el: 'hello'})})});
        root.sub.leaf.el = 'there';
        //let sub = new TSub({leaf: new TLeaf({el: 'hello'})});
        //console.log(`sub.leaf.el: ${sub.leaf.el}`);
        //console.log(`sub.leaf: ${sub.leaf}`);
        //sub.leaf.el = 'there;'
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