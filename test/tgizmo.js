import { Evts } from '../js/evt.js';
import { Fmt } from '../js/fmt.js';
import { Gizmo, Gadget } from '../js/gizmo.js';

const gadgetClass = Gadget;
const gSetter = (o, k, v) => o[k] = v;

describe('gadgets', () => {
    afterEach(() => {
        Evts.clear();
    });

    it('can be registered', ()=>{
        let cls = class TRegister extends gadgetClass {};
        let o = new cls;
        expect(gadgetClass.$registry.has('TRegister')).toBeTruthy();
    });

    it('can have schema applied/redefined', ()=>{
        class TCls1 extends gadgetClass {
            static { this.schema('var1', { dflt: 'foo'} ); }
            static { this.schema('var2', { dflt: 'bar'} ); }
        };
        class TCls2 extends TCls1 {
            static { this.schema('var3', { dflt: 'hello', readonly: true} ); }
        };
        class TCls3 extends TCls1 {
            static { this.schema('var1', { dflt: 'there'} ); }
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

    it('can have ordered schema', ()=>{
        class tBase extends gadgetClass {
            static { this.schema('var2', { dflt: 'bar', order: 2} ); }
            static { this.schema('var1', { dflt: 'bar', order: 1} ); }
            static { this.schema('var0', { dflt: 'foo', order: 0} ); }
        }
        expect(tBase.prototype.$schema._entries[0].key).toEqual('var0');
        expect(tBase.prototype.$schema._entries[1].key).toEqual('var1');
        expect(tBase.prototype.$schema._entries[2].key).toEqual('var2');
    });

    it('subclass schema can be reordered', ()=>{
        class tBase extends gadgetClass {
            static { this.schema('var2', { dflt: 'bar', order: 2} ); }
            static { this.schema('var1', { dflt: 'bar', order: 1} ); }
            static { this.schema('var0', { dflt: 'foo', order: 0} ); }
        }
        class tSub extends tBase {
            static { this.schema('var2', { dflt: 'bar', order: -1} ); }
        }
        expect(tBase.prototype.$schema._entries[0].key).toEqual('var0');
        expect(tBase.prototype.$schema._entries[1].key).toEqual('var1');
        expect(tBase.prototype.$schema._entries[2].key).toEqual('var2');
        expect(tSub.prototype.$schema._entries[0].key).toEqual('var2');
        expect(tSub.prototype.$schema._entries[1].key).toEqual('var0');
        expect(tSub.prototype.$schema._entries[2].key).toEqual('var1');
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
            static { this.schema('leaf', { atUpdate: (o,k,ov,nv) => {
                subUpdate = { ov: ov, nv: nv };
            }, link: true }); }
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
            static { this.schema('sub', { link: true } ); }
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

    it('base generator updates on gadget change', ()=>{
        class TBase extends gadgetClass {
            static { this.schema('el'); }
            static { this.schema('g', { dflt: 1, generator: (o,ov) => ov*2}); }
        };
        let b = new TBase();
        expect(b.g).toEqual(2);
        expect(b.g).toEqual(2);
        b.el = 'v1';
        expect(b.g).toEqual(4);
        expect(b.g).toEqual(4);
        b.el = 'v2';
        expect(b.g).toEqual(8);
        expect(b.g).toEqual(8);
        b.el = 'v2';
        expect(b.g).toEqual(8);
    });

    it('root generator updates on leaf change', ()=>{
        class TLeaf extends gadgetClass {
            static { this.schema('el'); }
        };
        class TBase extends gadgetClass {
            static { this.schema('el', { link: true }); }
            static { this.schema('g', { dflt: 1, generator: (o,ov) => ov*2}); }
        };
        let b = new TBase({el: new TLeaf()});
        expect(b.g).toEqual(2);
        expect(b.g).toEqual(2);
        b.el.el = 'v1';
        expect(b.g).toEqual(4);
        expect(b.g).toEqual(4);
        b.el.el = 'v2';
        expect(b.g).toEqual(8);
        expect(b.g).toEqual(8);
        b.el.el = 'v2';
        expect(b.g).toEqual(8);
    });

    it('leaf generator updates on link change', ()=>{
        class TLeaf extends gadgetClass {
            static { this.schema('el'); }
            static { this.schema('g', { dflt: 1, generator: (o,ov) => ov*2}); }
        };
        class TBase extends gadgetClass {
            static { this.schema('el', { link: true }); }
        };
        let b = new TBase();
        let l = new TLeaf();
        expect(l.g).toEqual(2);
        b.el = l;
        expect(l.g).toEqual(4);
        b.el = null;
        expect(l.g).toEqual(8);
    });

    it('root changes trigger events', ()=>{
        var gid = 0;
        class TRoot extends gadgetClass {
            static { this.prototype.$emitter = true}
            static { this.schema('data'); }
            static { this.schema('ndata', { eventable: false }); }
            static { this.schema('gid', { dflt: () => gid++ }); }
        };
        let o = new TRoot({data: 'foo', ndata: 'ok'});
        expect(o.data).toEqual('foo');
        let tevt;
        Evts.listen(o, 'GizmoSet', (evt) => tevt = evt);
        gSetter(o, 'data', 'bar');
        expect(tevt.tag).toEqual('GizmoSet');
        expect(tevt.actor).toBe(o);
        expect(tevt.set['data']).toEqual('bar');
        tevt = undefined;
        gSetter(o, 'ndata', 'bar');
        expect(tevt).toBeFalsy();
        expect(o.ndata).toEqual('bar');
    });

    it('leaf changes trigger events', ()=>{
        var gid = 0;
        class TLeaf extends gadgetClass {
            static { this.schema('data'); };
            static { this.schema('ndata', { eventable: false }); };
        };
        class TRoot extends gadgetClass {
            static { this.prototype.$emitter = true}
            static { this.schema('sub', { link: true }); }
            static { this.schema('nsub', { link: true, eventable: false }); }
            static { this.schema('gid', { dflt: () => gid++ }); }
        };
        let o = new TRoot({sub: new TLeaf({data: 'foo', ndata: 'nfoo'}), nsub: new TLeaf({data: 'nfoo'})});
        expect(o.sub.data).toEqual('foo');
        expect(o.sub.ndata).toEqual('nfoo');
        let tevt = {};
        Evts.listen(o, 'GizmoSet', (evt) => tevt = evt);
        gSetter(o.sub, 'data', 'bar');
        expect(tevt.tag).toEqual('GizmoSet');
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

describe('gizmos', () => {
    var counter;
    beforeEach(() => {
        counter = 0;
    });
    afterEach(() => {
        Evts.clear();
    });

    it('can trigger events', ()=>{
        let g = new Gizmo();
        Evts.listen(g, 'test', () => counter++);
        Evts.trigger(g, 'test');
        expect(counter).toBe(1);
    });

    it('triggers creation event when created', ()=>{
        Evts.listen(null, 'GizmoCreated', () => counter++);
        let g = new Gizmo();
        expect(counter).toBe(1);
    });

    it('can receive global gizmo events', ()=>{
        let g = new Gizmo();
        Evts.listen(null, 'test', () => counter++);
        Evts.trigger(g, 'test');
        expect(counter).toBe(1);
        Evts.ignore(null, 'test');
        Evts.trigger(g, 'test');
        expect(counter).toBe(1);
    });

    it('can receive global/local gizmo events', ()=>{
        let g = new Gizmo();
        Evts.listen(null, 'test', () => counter++);
        Evts.listen(g, 'test', () => counter++);
        Evts.trigger(g, 'test');
        expect(counter).toBe(2);
        Evts.ignore(null, 'test');
        Evts.ignore(g, 'test');
        Evts.trigger(g, 'test');
        expect(counter).toBe(2);
    });

    it('can auto-release listeners', ()=>{
        let g = new Gizmo();
        Evts.listen(g, 'test', () => counter++);
        Evts.trigger(g, 'test');
        g.destroy();
        Evts.trigger(g, 'test');
        expect(counter).toBe(1);
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

describe('gadget arrays', () => {

    var gid = 0;
    class TRef extends gadgetClass {
        static { this.prototype.$emitter = true}
        static { 
            this.schema('items', { link: true, dflt: () => [] }); 
            this.schema('auto', { generator: (o,v) => {
                return (o.items.length) ? 'hello:there' : 'wait';
            }}); 
        };
        static { this.schema('gid', { dflt: () => gid++ }); }
    };
    let gzd, tevt;
    beforeEach(() => {
        gzd = new TRef();
        Evts.listen(gzd, 'GizmoSet', (evt) => tevt = evt);
    });
    afterEach(() => {
        Evts.clear();
    })

    it('causes gizmo events when k/v set', ()=>{
        gzd.items[0] = 'foo';
        expect(tevt.tag).toEqual('GizmoSet');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['items.0']).toEqual('foo');
        expect(gzd.items[0]).toEqual('foo');
    });

    it('causes gizmo events when items pushed', ()=>{
        gzd.items.push('foo');
        expect(tevt.tag).toEqual('GizmoSet');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['items.0']).toEqual('foo');
        expect(gzd.items[0]).toEqual('foo');
        gzd.items.push('bar', 'baz');
        expect(tevt.set['items.2']).toEqual('baz');
    });

    it('causes gizmo events when items unshifted', ()=>{
        gzd.items.unshift('foo');
        expect(tevt.tag).toEqual('GizmoSet');
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
        expect(tevt.tag).toEqual('GizmoSet');
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
        expect(tevt.tag).toEqual('GizmoSet');
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
        expect(tevt.tag).toEqual('GizmoSet');
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

});

describe('gadget objects', () => {
    var gid = 0;
    class TRef extends gadgetClass {
        static { this.prototype.$emitter = true}
        static { this.schema('atts', { dflt: () => ({}), link: true }); };
        static { this.schema('gid', { dflt: () => gid++ }); }
    };
    let gzd, tevt = {};
    beforeEach(() => {
        gzd = new TRef();
        Evts.listen(gzd, 'GizmoSet', (evt) => tevt = evt);
        Evts.listen(gzd, 'GizmoDelete', (evt) => tevt = evt);
    });
    afterEach(() => {
        Evts.clear();
    });

    it('causes gizmo events when k/v set', ()=>{
        gzd.atts['foo'] = 'bar';
        expect(tevt.tag).toEqual('GizmoSet');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['atts.foo']).toEqual('bar');
    });

    it('causes gizmo events when k deleted', ()=>{
        gzd.atts['foo'] = 'bar';
        delete gzd.atts['foo'];
        expect(tevt.tag).toEqual('GizmoSet');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['atts.foo']).toEqual(undefined);
        expect(gzd.atts.foo).toBeFalsy();
    });

    it('can use gizmodata.set', ()=>{
        gSetter(gzd.atts, 'foo', 'bar');
        expect(gzd.atts.foo).toBeTruthy();
        expect(tevt.tag).toEqual('GizmoSet');
        expect(tevt.actor).toBe(gzd);
        expect(tevt.set['atts.foo']).toEqual('bar');
    });

});