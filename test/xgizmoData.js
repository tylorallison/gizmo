import { EvtSystem, ExtEvtEmitter, ExtEvtReceiver } from '../js/event.js';
import { Fmt } from '../js/fmt.js';
import { GizmoData } from '../js/gizmoData.js';
import { Schema } from '../js/schema.js';

describe('gizmo data', () => {

    it('readonly atts cannot be set', ()=>{
        class TLeaf extends GizmoData {
            static { Schema.apply(this, 'el', { readonly: true }); };
        };
        let leaf = new TLeaf({el: 'hello'});
        leaf.el = 'there';
        expect(leaf.el).toEqual('hello');
    });

    it('atUpdate atts trigger for root object', ()=>{
        let update = {};
        class TLeaf extends GizmoData {
            static { Schema.apply(this, 'el', { atUpdate: (r,o,k,ov,nv) => update = { r:r, o:o, k:k, ov:ov, nv:nv } }); }
        };
        let leaf = new TLeaf({el: 'hello'});
        leaf.el = 'there';
        expect(update).toEqual({ r:null, o:leaf, k:'el', ov:'hello', nv:'there'});
    });

    it('atUpdate atts trigger for leaf', ()=>{
        let subUpdate = {};
        let rootUpdate = {};
        class TLeaf extends GizmoData {
            static { Schema.apply(this, 'el'); }
        };
        class TSub extends GizmoData {
            static { Schema.apply(this, 'leaf', { link: true }); }
        };
        class TSubUpdate extends GizmoData {
            static { Schema.apply(this, 'leaf', { atUpdate: (r,o,k,ov,nv) => subUpdate = { ov: ov, nv: nv }, link: true }); }
        };
        class TRoot extends GizmoData {
            static { Schema.apply(this, 'sub', { atUpdate: (r,o,k,ov,nv) => rootUpdate = { ov: ov, nv: nv }, link: true }); }
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

    it('attributes become readonly when attached to readonly trunk', ()=>{
        class TLeaf extends GizmoData {
            static { Schema.apply(this, 'el'); }
        };
        class TRO extends GizmoData {
            static { Schema.apply(this, 'leaf', { link: true, readonly: true }); }
        };
        let leaf = new TLeaf({el: 'hello'});
        leaf.el = 'there';
        expect(leaf.el).toEqual('there');
        let ro = new TRO({ leaf: leaf });
        leaf.el = 'again';
        expect(leaf.el).toEqual('there');
        leaf.$handle.unlink();
        leaf.el = 'once more';
        expect(leaf.el).toEqual('once more');
    });

    it('can be registered', ()=>{
        let cls = class TRegister extends GizmoData {};
        let o = new cls;
        expect(GizmoData.registry.has('TRegister')).toBeTruthy();
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

    it('links cannot loop', ()=>{
        class TLeaf extends GizmoData {
            static { Schema.apply(this, 'data'); };
        };
        class TRoot extends GizmoData {
            static { Schema.apply(this, 'sub', { link: true }); };
        };
        let n1 = new TRoot();
        let n2 = new TRoot();
        let n3 = new TRoot();
        let l = new TLeaf({data: 'leaf'});
        n3.sub = l;
        expect(n3.sub.data).toEqual('leaf');
        expect(() => n1.sub = n1).toThrow();
        expect(n1.sub).toEqual(undefined);
        n2.sub = n3;
        expect(n2.sub.sub.data).toEqual('leaf');
        expect(() => n3.sub = n2).toThrow();
        expect(n2.sub.sub.data).toEqual('leaf');
        n1.sub = n2;
        expect(n1.sub.sub.sub.data).toEqual('leaf');
        expect(() => n3.sub = n1).toThrow();
        expect(n1.sub.sub.sub.data).toEqual('leaf');
    });

    it('root changes trigger events', ()=>{
        class TLeaf extends GizmoData {
            static { Schema.apply(this, 'data'); }
            static { Schema.apply(this, 'ndata', { eventable: false }); }
            static { ExtEvtEmitter.apply(this) }
        };
        let o = new TLeaf({data: 'foo', ndata: 'ok'});
        expect(o.data).toEqual('foo');
        let receiver = ExtEvtReceiver.gen();
        let tevt;
        EvtSystem.listen(o, receiver, 'gizmo.set', (evt) => tevt = evt);
        o.data = 'bar';
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(o);
        expect(tevt.set['data']).toEqual('bar');
        tevt = undefined;
        o.ndata = 'bar';
        expect(tevt).toBeFalsy();
        expect(o.ndata).toEqual('bar');
    });

    it('leaf changes trigger events', ()=>{
        class TLeaf extends GizmoData {
            static { Schema.apply(this, 'data'); };
            static { Schema.apply(this, 'ndata', { eventable: false }); };
        };
        class TRoot extends GizmoData {
            static { Schema.apply(this, 'sub', { link: true }); }
            static { Schema.apply(this, 'nsub', { link: true, eventable: false }); }
            static { ExtEvtEmitter.apply(this); }
        };
        let o = new TRoot({sub: new TLeaf({data: 'foo', ndata: 'nfoo'})});
        expect(o.sub.data).toEqual('foo');
        expect(o.sub.ndata).toEqual('nfoo');
        let receiver = ExtEvtReceiver.gen();
        let tevt;
        EvtSystem.listen(o, receiver, 'gizmo.set', (evt) => tevt = evt);
        o.sub.data = 'bar';
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(o);
        expect(tevt.set['sub.data']).toEqual('bar');
        let l = o.sub;
        o.sub = null;
        tevt = null;
        l.data = 'v2';
        expect(tevt).toBeFalsy();
        expect(l.data).toEqual('v2');
    });

    it('autogenerated fields can be specified for all changes to data', ()=>{
        class TAuto extends GizmoData {
            static { Schema.apply(this, 'sdata', { dflt: 1 }); };
            static { Schema.apply(this, 'adata', { autogen: true, generator: (o,x,v) => o.sdata*2 }); };
        };
        let gzd = new TAuto();
        expect(gzd.sdata).toEqual(1);
        expect(gzd.adata).toEqual(2);
        gzd.sdata = 4;
        expect(gzd.sdata).toEqual(4);
        expect(gzd.adata).toEqual(8);
    });

    it('autogenerated fields can be specified for all a specific field', ()=>{
        class TAuto extends GizmoData {
            static { Schema.apply(this, 'sdata1', { dflt: 1 }); };
            static { Schema.apply(this, 'sdata2', { dflt: 2 }); };
            static { Schema.apply(this, 'adata', { autogen: (k) => k === 'sdata1', generator: (o,x,v) => o.sdata1*o.sdata2 }); };
        };
        let gzd = new TAuto();
        expect(gzd.sdata1).toEqual(1);
        expect(gzd.sdata2).toEqual(2);
        expect(gzd.adata).toEqual(2);
        gzd.sdata1 = 4;
        expect(gzd.sdata1).toEqual(4);
        expect(gzd.sdata2).toEqual(2);
        expect(gzd.adata).toEqual(8);
        gzd.sdata2 = 3;
        expect(gzd.sdata1).toEqual(4);
        expect(gzd.sdata2).toEqual(3);
        expect(gzd.adata).toEqual(8);
    });

    it('autogenerated fields can be specified for sub data', ()=>{
        class TSub extends GizmoData {
            static { Schema.apply(this, 'sdata', { dflt: 1 }); };
        };
        class TAuto extends GizmoData {
            static { Schema.apply(this, 'sub', { link: true }); };
            static { Schema.apply(this, 'other', { dflt: 2 }); };
            static { Schema.apply(this, 'adata', { autogen: (k) => k === 'sub', generator: (o,x,v) => o.sub.sdata*o.other }); };
        };
        let gzd = new TAuto({ sub: new TSub() });
        expect(gzd.adata).toEqual(2);
        gzd.sub.sdata = 4;
        expect(gzd.adata).toEqual(8);
        gzd.other = 3;
        expect(gzd.adata).toEqual(8);
        gzd.sub.sdata = 5;
        expect(gzd.adata).toEqual(15);
    });

});

describe('a gizmo array', () => {
    class TRef extends GizmoData {
        static { 
            Schema.apply(this, 'items', { link: 'array', dflt: [] }); 
            //Schema.apply(this, 'auto', { autogen: (k) => k === 'items', setter: (o,x,v) => {
            //    return (o.items.length) ? `hello:there` : 'wait';
            //}}); 
            ExtEvtEmitter.apply(this)
        };
    };
    let gzd, receiver, tevt;
    beforeEach(() => {
        gzd = new TRef();
        receiver = ExtEvtReceiver.gen();
        EvtSystem.listen(gzd, receiver, 'gizmo.set', (evt) => tevt = evt);
    });

    it('causes gizmo events when k/v set', ()=>{
        gzd.items.push('foo');
        console.log(`tevt: ${Fmt.ofmt(tevt)}`);
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['items[0]']).toEqual('foo');
    });

/*
    it('causes gizmo events when k/v deleted', ()=>{
        gzd.items.push('foo');
        expect(tevt.set['items[0]']).toEqual('foo');
        expect(gzd.items.length).toEqual(1)
        gzd.items.pop();
        expect(tevt.set['items[0]']).toEqual(null);
        expect(gzd.items.length).toEqual(0)
    });

    it('triggers autogen', ()=>{
        expect(gzd.auto).toEqual('wait');
        gzd.items.push('foo');
        expect(gzd.auto).toEqual('hello:there');
        gzd.items.pop();
        expect(gzd.auto).toEqual('wait');
    });
    */

});

/*
describe('a gizmo map', () => {
    class TRef extends GizmoData {
        static { 
            Schema.apply(this, 'atts', { link: 'map' }); 
            Schema.apply(this, 'auto', { autogen: (k) => k === 'atts', setter: (o,x,v) => {
                return (o.atts.has('seeker')) ? `hello:${o.atts.get('seeker')}` : 'wait';
            }}); 
            ExtEvtEmitter.apply(this)
        };
    };
    let gzd, receiver, tevt;
    beforeEach(() => {
        gzd = new TRef();
        receiver = ExtEvtReceiver.gen();
        EvtSystem.listen(gzd, receiver, 'gizmo.set', (evt) => tevt = evt);
    });

    it('causes gizmo events when k/v set', ()=>{
        gzd.atts.set('foo', 'bar');
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['atts.foo']).toEqual('bar');
        gzd.atts.set('foo', 'baz');
        expect(tevt.set['atts.foo']).toEqual('baz');
    });

    it('causes gizmo events when k/v deleted', ()=>{
        gzd.atts.set('foo', 'bar');
        expect(tevt.set['atts.foo']).toEqual('bar');
        expect(gzd.atts.has('foo')).toBeTruthy()
        gzd.atts.delete('foo');
        expect(tevt.set['atts.foo']).toEqual(null);
        expect(gzd.atts.has('foo')).toBeFalsy()
    });

    it('triggers autogen', ()=>{
        expect(gzd.auto).toEqual('wait');
        gzd.atts.set('seeker', 'there');
        expect(gzd.auto).toEqual('hello:there');
        gzd.atts.delete('seeker');
        expect(gzd.auto).toEqual('wait');
    });

});
*/