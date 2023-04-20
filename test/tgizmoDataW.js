import { EvtSystem, ExtEvtEmitter, ExtEvtReceiver } from '../js/event.js';
import { Fmt } from '../js/fmt.js';
import { GizmoArray, GizmoDataW } from '../js/gizmoDataW.js';
import { Schema } from '../js/schema.js';

const gClass = GizmoDataW;
const gSetter = (o, k, v) => gClass.set(o, k, v);

describe('gizmo data', () => {

    it('can be registered', ()=>{
        let cls = class TRegister extends gClass {};
        let o = new cls;
        expect(gClass.registry.has('TRegister')).toBeTruthy();
    });

    it('can be linked', ()=>{
        class TGizmoDataSub extends gClass {
            static { Schema.apply(this, 'data'); };
        };
        class TGizmoData extends gClass {
            static { Schema.apply(this, 'sub', { link: true }); };
        };
        let o = new TGizmoData({sub: new TGizmoDataSub({data: 'foo'})});
        expect(o.sub.data).toEqual('foo');
    });

    it('links cannot loop', ()=>{
        class TLeaf extends gClass {
            static { Schema.apply(this, 'data'); };
        };
        class TRoot extends gClass {
            static gid = 0;
            static { Schema.apply(this, 'sub', { link: true }); };
            constructor(spec={}) {
                super(spec);
                this.id = this.constructor.gid++;
            }
            toString() {
                return Fmt.toString(this.constructor.name, this.id);
            }
        };
        let n1 = new TRoot();
        let n2 = new TRoot();
        let n3 = new TRoot();
        let l = new TLeaf({data: 'leaf'});
        gSetter(n3, 'sub', l);
        expect(n3.sub.data).toEqual('leaf');
        expect(() => gSetter(n1, 'sub', n1)).toThrow();
        expect(n1.sub).toEqual(undefined);
        gSetter(n2, 'sub', n3);
        expect(n2.sub.sub.data).toEqual('leaf');
        expect(() => gSetter(n3, 'sub', n2)).toThrow();
        expect(n2.sub.sub.data).toEqual('leaf');
        gSetter(n1, 'sub', n2);
        expect(n1.sub.sub.sub.data).toEqual('leaf');
        expect(() => gSetter(n3, 'sub', n1)).toThrow();
        expect(n1.sub.sub.sub.data).toEqual('leaf');
    });

    it('atUpdate atts trigger for root object', ()=>{
        let update = {};
        class TLeaf extends gClass {
            static { Schema.apply(this, 'el'); }
            static { Schema.apply(this, 'elu', { atUpdate: (r,o,k,ov,nv) => update = { r:r, o:o, k:k, ov:ov, nv:nv } }); }
        };
        let leaf = new TLeaf({el: 'hello', elu: 'really'});
        expect(update).toEqual({});
        gSetter(leaf, 'el', 'there');
        expect(update).toEqual({});
        gSetter(leaf, 'elu', 'yes');
        expect(update).toEqual({ r:leaf, o:leaf, k:'elu', ov:'really', nv:'yes'});
    });

    it('atUpdate atts trigger for leaf', ()=>{
        let subUpdate = {};
        let rootUpdate = {};
        class TLeaf extends gClass {
            static { Schema.apply(this, 'el'); }
        };
        class TSub extends gClass {
            static { Schema.apply(this, 'leaf', { link: true }); }
        };
        class TSubUpdate extends gClass {
            static { Schema.apply(this, 'leaf', { atUpdate: (r,o,k,ov,nv) => subUpdate = { ov: ov, nv: nv }, link: true }); }
        };
        class TRoot extends gClass {
            static { Schema.apply(this, 'sub', { atUpdate: (r,o,k,ov,nv) => rootUpdate = { ov: ov, nv: nv }, link: true }); }
        };
        let leaf = new TLeaf({el: 'hello'});
        let sub = new TSub();
        let subu = new TSubUpdate();
        let root = new TRoot();
        gSetter(leaf, 'el', 'there');
        expect(subUpdate).toEqual({});
        expect(rootUpdate).toEqual({});
        gSetter(sub, 'leaf', leaf);
        gSetter(leaf, 'el', 'leaf1');
        expect(subUpdate).toEqual({});
        expect(rootUpdate).toEqual({});
        gSetter(root, 'sub', sub);
        gSetter(leaf, 'el', 'sub1');
        // root->sub->leaf->el
        expect(subUpdate).toEqual({});
        expect(rootUpdate).toEqual({ov: 'leaf1', nv: 'sub1'});
        rootUpdate = {};
        gSetter(subu, 'leaf', leaf);
        gSetter(leaf, 'el', 'leaf2');
        expect(subUpdate).toEqual({ov: 'sub1', nv: 'leaf2'});
        expect(rootUpdate).toEqual({});
        subUpdate = {};
        gSetter(root, 'sub', subu);
        gSetter(leaf, 'el', 'sub2');
        expect(subUpdate).toEqual({ov: 'leaf2', nv: 'sub2'});
        expect(rootUpdate).toEqual({ov: 'leaf2', nv: 'sub2'});
    });

    it('leaf atUpdate reset w/ new root', ()=>{
        let rootUpdate = {};
        class TLeaf extends gClass {
            static { Schema.apply(this, 'el'); }
        };
        class TARoot extends gClass {
            static { Schema.apply(this, 'sub', { atUpdate: (r,o,k,ov,nv) => rootUpdate = { ov: ov, nv: nv }, link: true }); }
        };
        class TBRoot extends gClass {
            static { Schema.apply(this, 'sub' ); }
        };
        let leaf = new TLeaf({el: 'hello'});
        let roota = new TARoot();
        let rootb = new TBRoot();
        gSetter(roota, 'sub', leaf);
        gSetter(leaf, 'el', 'v1');
        expect(rootUpdate).toEqual({ov: 'hello', nv: 'v1'});
        gSetter(roota, 'sub', null);
        rootUpdate = {};
        gSetter(leaf, 'el', 'v2');
        expect(rootUpdate).toEqual({});
        gSetter(roota, 'sub', leaf);
        gSetter(leaf, 'el', 'v3');
        expect(rootUpdate).toEqual({ov: 'v2', nv: 'v3'});
        rootUpdate = {};
        gSetter(rootb, 'sub', leaf);
        gSetter(leaf, 'el', 'v4');
        expect(rootUpdate).toEqual({});
    });

    it('autogenerated fields can be specified for all changes to data', ()=>{
        class TAuto extends gClass {
            static { Schema.apply(this, 'sdata', { dflt: 1 }); };
            static { Schema.apply(this, 'adata', { autogen: true, generator: (o,x,v) => o.sdata*2 }); };
        };
        let gzd = new TAuto();
        expect(gzd.sdata).toEqual(1);
        expect(gzd.adata).toEqual(2);
        gSetter(gzd, 'sdata', 4);
        expect(gzd.sdata).toEqual(4);
        expect(gzd.adata).toEqual(8);
    });

    it('autogenerated fields can be specified for all a specific field', ()=>{
        class TAuto extends gClass {
            static { Schema.apply(this, 'sdata1', { dflt: 1 }); };
            static { Schema.apply(this, 'sdata2', { dflt: 2 }); };
            static { Schema.apply(this, 'adata', { autogen: (k) => k === 'sdata1', generator: (o,x,v) => o.sdata1*o.sdata2 }); };
        };
        let gzd = new TAuto();
        expect(gzd.sdata1).toEqual(1);
        expect(gzd.sdata2).toEqual(2);
        expect(gzd.adata).toEqual(2);
        gSetter(gzd, 'sdata1', 4);
        expect(gzd.sdata1).toEqual(4);
        expect(gzd.sdata2).toEqual(2);
        expect(gzd.adata).toEqual(8);
        gSetter(gzd, 'sdata2', 3);
        expect(gzd.sdata1).toEqual(4);
        expect(gzd.sdata2).toEqual(3);
        expect(gzd.adata).toEqual(8);
    });

    it('autogenerated fields can be specified for sub data', ()=>{
        class TSub extends gClass {
            static { Schema.apply(this, 'sdata', { dflt: 1 }); };
        };
        class TAuto extends gClass {
            static { Schema.apply(this, 'sub', { link: true }); };
            static { Schema.apply(this, 'other', { dflt: 2 }); };
            static { Schema.apply(this, 'adata', { autogen: (k) => k === 'sub', generator: (o,x,v) => o.sub.sdata*o.other }); };
        };
        let gzd = new TAuto({ sub: new TSub() });
        expect(gzd.adata).toEqual(2);
        gSetter(gzd.sub, 'sdata', 4);
        expect(gzd.adata).toEqual(8);
        gSetter(gzd, 'other', 3);
        expect(gzd.adata).toEqual(8);
        gSetter(gzd.sub, 'sdata', 5);
        expect(gzd.adata).toEqual(15);
    });

    it('root changes trigger events', ()=>{
        class TLeaf extends gClass {
            static { Schema.apply(this, 'data'); }
            static { Schema.apply(this, 'ndata', { eventable: false }); }
            static { ExtEvtEmitter.apply(this) }
        };
        let o = new TLeaf({data: 'foo', ndata: 'ok'});
        expect(o.data).toEqual('foo');
        let receiver = ExtEvtReceiver.gen();
        let tevt;
        EvtSystem.listen(o, receiver, 'gizmo.set', (evt) => tevt = evt);
        gSetter(o, 'data', 'bar');
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(o);
        expect(tevt.set['data']).toEqual('bar');
        tevt = undefined;
        gSetter(o, 'ndata', 'bar');
        expect(tevt).toBeFalsy();
        expect(o.ndata).toEqual('bar');
    });

    it('leaf changes trigger events', ()=>{
        class TLeaf extends gClass {
            static { Schema.apply(this, 'data'); };
            static { Schema.apply(this, 'ndata', { eventable: false }); };
        };
        class TRoot extends gClass {
            static { Schema.apply(this, 'sub', { link: true }); }
            static { Schema.apply(this, 'nsub', { link: true, eventable: false }); }
            static { ExtEvtEmitter.apply(this); }
        };
        let o = new TRoot({sub: new TLeaf({data: 'foo', ndata: 'nfoo'}), nsub: new TLeaf({data: 'nfoo'})});
        expect(o.sub.data).toEqual('foo');
        expect(o.sub.ndata).toEqual('nfoo');
        let receiver = ExtEvtReceiver.gen();
        let tevt = {};
        EvtSystem.listen(o, receiver, 'gizmo.set', (evt) => tevt = evt);
        gSetter(o.sub, 'data', 'bar');
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(o);
        expect(tevt.set['sub.data']).toEqual('bar');
        tevt = {};
        gSetter(o.sub, 'ndata', 'bar');
        expect(tevt).toEqual({});
        gSetter(o.nsub, 'data', 'nv2');
        expect(tevt).toEqual({});
        let l = o.sub;
        gSetter(o, 'sub', null);
        tevt = {};
        l.data = 'v2';
        gSetter(l, 'data', 'v2');
        expect(tevt).toEqual({});
        expect(l.data).toEqual('v2');
    });

});

describe('a gizmo array', () => {
    class TRef extends gClass {
        static { 
            Schema.apply(this, 'items', { link: 'array', parser: () => new GizmoArray() }); 
            Schema.apply(this, 'auto', { autogen: (k) => k === 'items', generator: (o,x,v) => {
                return (o.items.length) ? 'hello:there' : 'wait';
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

    it('causes gizmo events when items pushed', ()=>{
        gzd.items.push('foo');
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['items.0']).toEqual('foo');
        expect(gzd.items[0]).toEqual('foo');
        gzd.items.push('bar', 'baz');
        expect(tevt.set['items.2']).toEqual('baz');
    });

    it('causes gizmo events when items unshifted', ()=>{
        gzd.items.unshift('foo');
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['items.0']).toEqual('foo');
        expect(gzd.items[0]).toEqual('foo');
        gzd.items.unshift('bar', 'baz');
        expect(tevt.set['items.1']).toEqual('baz');
        expect(gzd.items[0]).toEqual('bar');
        expect(gzd.items[1]).toEqual('baz');
        expect(gzd.items[2]).toEqual('foo');
        expect(gzd.items.length).toEqual(3);
    });

    it('causes gizmo events when items popped', ()=>{
        gzd.items.push('foo', 'bar', 'baz');
        let v = gzd.items.pop();
        expect(v).toEqual('baz');
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['items.2']).toEqual(undefined);
        expect(gzd.items.length).toEqual(2);
        expect(gzd.items[0]).toEqual('foo');
        expect(gzd.items[1]).toEqual('bar');
        v = gzd.items.pop();
        expect(v).toEqual('bar');
        expect(gzd.items.length).toEqual(1);
    });

    it('causes gizmo events when items shifted', ()=>{
        gzd.items.push('foo', 'bar', 'baz');
        let v = gzd.items.shift();
        expect(v).toEqual('foo');
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['items.0']).toEqual(undefined);
        expect(gzd.items.length).toEqual(2);
        expect(gzd.items[0]).toEqual('bar');
        expect(gzd.items[1]).toEqual('baz');
        v = gzd.items.shift();
        expect(v).toEqual('bar');
        expect(gzd.items.length).toEqual(1);
    });

    it('causes gizmo events when items spliced', ()=>{
        gzd.items.push('foo', 'bar', 'baz');
        let v = gzd.items.splice(1, 1);
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['items.1']).toEqual(undefined);
        expect(v).toEqual(['bar']);
        expect(gzd.items[0]).toEqual('foo');
        expect(gzd.items[1]).toEqual('baz');
        expect(gzd.items.length).toEqual(2);
        v = gzd.items.splice(1, 0, 'hello', 'there');
        expect(v).toEqual([]);
        expect(gzd.items[0]).toEqual('foo');
        expect(gzd.items[1]).toEqual('hello');
        expect(gzd.items[2]).toEqual('there');
        expect(gzd.items[3]).toEqual('baz');
        expect(tevt.set['items.2']).toEqual('there');
        expect(gzd.items.length).toEqual(4);
        v = gzd.items.splice(1, 1, 'nihao');
        expect(v).toEqual(['hello']);
        expect(gzd.items.length).toEqual(4);
        expect(gzd.items[1]).toEqual('nihao');
        expect(tevt.set['items.1']).toEqual('nihao');
        v = gzd.items.splice(1, 2, 'hola');
        expect(v).toEqual(['nihao', 'there']);
        expect(gzd.items.length).toEqual(3);
        expect(tevt.set['items.2']).toEqual(undefined);
        expect(gzd.items[0]).toEqual('foo');
        expect(gzd.items[1]).toEqual('hola');
        expect(gzd.items[2]).toEqual('baz');
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
    */

        /*
    it('triggers autogen', ()=>{
        expect(gzd.auto).toEqual('wait');
        gSetter(gzd.items, 0, 'foo');
        //gzd.items.push('foo');
        expect(gzd.auto).toEqual('hello:there');
        gzd.items.pop();
        expect(gzd.auto).toEqual('wait');
    });
        */

});

describe('a gizmo map', () => {
    class TRef extends gClass {
        static { 
            Schema.apply(this, 'atts', { link: 'map', parser: () => { return {} }}); 
            /*
            Schema.apply(this, 'auto', { autogen: (k) => k === 'atts', setter: (o,x,v) => {
                return (o.atts.has('seeker')) ? `hello:${o.atts.get('seeker')}` : 'wait';
            }}); 
            */
            ExtEvtEmitter.apply(this)
        };
    };
    let gzd, receiver, tevt = {};
    beforeEach(() => {
        gzd = new TRef();
        receiver = ExtEvtReceiver.gen();
        EvtSystem.listen(gzd, receiver, 'gizmo.set', (evt) => tevt = evt);
    });

    it('causes gizmo events when k/v set', ()=>{
        gSetter(gzd.atts, 'foo', 'bar');
        //gzd.atts.set('foo', 'bar');
        expect(tevt.tag).toEqual('gizmo.set');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['atts.foo']).toEqual('bar');
        //gzd.atts.set('foo', 'baz');
        //expect(tevt.set['atts.foo']).toEqual('baz');
    });

/*
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
*/

});