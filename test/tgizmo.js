import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { Gizmo } from '../js/gizmo.js';
import { Gadget } from '../js/gizmo4.js';
import { GizmoContext } from '../js/gizmoContext.js';

const gadgetClass = Gadget;
const gSetter = (o, k, v) => o[k] = v;

describe('gadgets', () => {

    it('can be registered', ()=>{
        let cls = class TRegister extends gadgetClass {};
        let o = new cls;
        expect(gadgetClass.$registry.has('TRegister')).toBeTruthy();
    });

    it('can have schema applied/redefined', ()=>{
        class TCls1 extends gadgetClass {
            static { this.schema('var1', { dflter: () => 'foo'} ); }
            static { this.schema('var2', { dflter: () => 'bar'} ); }
        };
        class TCls2 extends TCls1 {
            static { this.schema('var3', { dflter: () => 'hello', readonly: true} ); }
        };
        class TCls3 extends TCls1 {
            static { this.schema('var1', { dflter: () => 'there'} ); }
            static { this.prototype.$schema.clear('var2'); }
        };
        let o = new TCls1();
        let o2 = new TCls2();
        let o3 = new TCls3();
        expect(o.var1).toEqual('foo');
        expect(o.var2).toEqual('bar');
        expect(o.var3).toEqual(undefined);
        expect(o2.var1).toEqual('foo');
        expect(o2.var2).toEqual('bar');
        expect(o2.var3).toEqual('hello');
        expect(o3.var1).toEqual('there');
        expect(o3.var2).toEqual(undefined);
        expect(o3.var3).toEqual(undefined);
    });

    it('can be linked', ()=>{
        class TGizmoDataSub extends gadgetClass {
            static { this.schema('data'); };
        };
        class TGizmoData extends gadgetClass {
            static { this.schema('sub', { link: true }); };
        };
        let o = new TGizmoData({sub: new TGizmoDataSub({data: 'foo'})});
        expect(o.sub.data).toEqual('foo');
    });

    it('links cannot loop', ()=>{
        class TLeaf extends gadgetClass {
            static { this.schema('data'); };
        };
        class TRoot extends gadgetClass {
            static gid = 0;
            static { this.schema('sub', { link: true }); };
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
        class TLeaf extends gadgetClass {
            static { this.schema('el'); }
            static { this.schema('elu', { atUpdate: (o,k,ov,nv) => update = { o:o, k:k, ov:ov, nv:nv } }); }
        };
        let leaf = new TLeaf({el: 'hello', elu: 'really'});
        expect(update).toEqual({});
        gSetter(leaf, 'el', 'there');
        expect(update).toEqual({});
        gSetter(leaf, 'elu', 'yes');
        expect(update).toEqual({ o:leaf, k:'elu', ov:'really', nv:'yes'});
    });

    it('atUpdate atts trigger for leaf', ()=>{
        let subUpdate = {};
        let rootUpdate = {};
        class TLeaf extends gadgetClass {
            static { this.schema('el'); }
        };
        class TSub extends gadgetClass {
            static { this.schema('leaf', { link: true }); }
        };
        class TSubUpdate extends gadgetClass {
            static { this.schema('leaf', { atUpdate: (o,k,ov,nv) => subUpdate = { ov: ov, nv: nv }, link: true }); }
        };
        class TRoot extends gadgetClass {
            static { this.schema('sub', { atUpdate: (o,k,ov,nv) => rootUpdate = { ov: ov, nv: nv }, link: true }); }
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
        expect(rootUpdate).toEqual({ov: sub, nv: sub});
        rootUpdate = {};
        gSetter(subu, 'leaf', leaf);
        gSetter(leaf, 'el', 'leaf2');
        expect(subUpdate).toEqual({ov: leaf, nv: leaf});
        expect(rootUpdate).toEqual({});
        subUpdate = {};
        gSetter(root, 'sub', subu);
        gSetter(leaf, 'el', 'sub2');
        expect(subUpdate).toEqual({ov: leaf, nv: leaf});
        expect(rootUpdate).toEqual({ov: subu, nv: subu});
    });

    it('leaf atUpdate reset w/ new root', ()=>{
        let rootUpdate = {};
        class TLeaf extends gadgetClass {
            static { this.schema('el'); }
        };
        class TARoot extends gadgetClass {
            static { this.schema('sub', { atUpdate: (o,k,ov,nv) => rootUpdate = { ov: ov, nv: nv }, link: true }); }
        };
        class TBRoot extends gadgetClass {
            static { this.schema('sub' ); }
        };
        let leaf = new TLeaf({el: 'hello'});
        let roota = new TARoot();
        let rootb = new TBRoot();
        gSetter(roota, 'sub', leaf);
        gSetter(leaf, 'el', 'v1');
        expect(rootUpdate).toEqual({ov: leaf, nv: leaf});
        gSetter(roota, 'sub', null);
        rootUpdate = {};
        gSetter(leaf, 'el', 'v2');
        expect(rootUpdate).toEqual({});
        gSetter(roota, 'sub', leaf);
        gSetter(leaf, 'el', 'v3');
        expect(rootUpdate).toEqual({ov: leaf, nv: leaf});
        rootUpdate = {};
        gSetter(rootb, 'sub', leaf);
        gSetter(leaf, 'el', 'v4');
        expect(rootUpdate).toEqual({});
    });

});

describe('gizmos', () => {

    it('can trigger events', ()=>{
        let g = new Gizmo();
        let receiver = ExtEvtReceiver.gen();
        let counter = 0;
        let incr = () => counter++;
        EvtSystem.listen(g, receiver, 'test', incr);
        EvtSystem.trigger(g, 'test');
        expect(counter).toBe(1);
        expect(EvtSystem.getCount(g, 'test')).toBe(1);
    });

    it('triggers creation event when created', ()=>{
        let counter = 0;
        let incr = () => counter++;
        let receiver = ExtEvtReceiver.gen();
        Gizmo.listen(receiver, 'gizmo.created', incr)
        let g = new Gizmo();
        expect(counter).toBe(1);
    });

    it('can receive global gizmo events', ()=>{
        let g = new Gizmo();
        let receiver = ExtEvtReceiver.gen();
        let counter = 0;
        let incr = () => counter++;
        Gizmo.listen(receiver, 'test', incr)
        EvtSystem.trigger(g, 'test');
        expect(counter).toBe(1);
        expect(EvtSystem.getCount(g, 'test')).toBe(1);
    });

    it('can receive global/local gizmo events', ()=>{
        let g = new Gizmo();
        let receiver = ExtEvtReceiver.gen();
        let counter = 0;
        let incr = () => counter++;
        Gizmo.listen(receiver, 'test', incr);
        EvtSystem.listen(g, receiver, 'test', incr);
        EvtSystem.trigger(g, 'test');
        expect(counter).toBe(2);
        expect(EvtSystem.getCount(g, 'test')).toBe(1);
    });

    it('can listen/ignore global gizmo events', ()=>{
        let g = new Gizmo();
        let receiver = ExtEvtReceiver.gen();
        let counter = 0;
        let incr = () => counter++;
        Gizmo.listen(receiver, 'test', incr)
        EvtSystem.trigger(g, 'test');
        Gizmo.ignore(receiver, 'test');
        EvtSystem.trigger(g, 'test');
        expect(counter).toBe(1);
        expect(EvtSystem.getCount(g, 'test')).toBe(2);
    });

    it('can auto-release listeners', ()=>{
        let g = new Gizmo();
        let counter = 0;
        let incr = () => counter++;
        Gizmo.listen(g, 'test', incr)
        EvtSystem.trigger(g, 'test');
        g.destroy();
        EvtSystem.trigger(g, 'test');
        expect(counter).toBe(1);
        expect(EvtSystem.getCount(g, 'test')).toBe(2);
    });

    it('can adopt children during constructor', ()=>{
        let c1 = new Gizmo();
        let c2 = new Gizmo();
        let g = new Gizmo( { children: [c1, c2]});
        expect(g.children.includes(c1)).toBeTruthy();
        expect(g.children.includes(c2)).toBeTruthy();
        expect(c1.parent).toBe(g);
        expect(c2.parent).toBe(g);
    });

});