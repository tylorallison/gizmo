import { ConfigCtx, Configs } from '../js/config.js';
import { Gadget } from '../js/gizmo.js';

describe('a config context', () => {
    afterEach(() => {
        Configs.clear();
    });

    class tcfg extends Gadget {
        static { this.schema('value', { dflt: 'foo' }); }
    }
    class tcfgsub extends tcfg {
        static { this.schema('value2', { dflt: 'foo2' }); }
    }

    it(`context can be applied`, ()=>{
        let ctx = new ConfigCtx();
        ctx.apply('tcfg.value', 'hello');
        ctx.apply('tcfgsub.value2', 'there');
        let t1 = new tcfg();
        let t2 = new tcfgsub();
        expect(t1.value).toEqual('hello');
        expect(t2.value).toEqual('hello');
        expect(t2.value2).toEqual('there');
    });

    xit(`context set/delete key/value`, ()=>{
        let ctx = new ConfigCtx();
        expect(ctx.get('key')).toEqual(undefined);
        ctx.set('key', 'value');
        expect(ctx.get('key')).toEqual('value');
        ctx.delete('key');
        expect(ctx.get('key')).toEqual(undefined);
    });

    xit(`context cant set/delete values`, ()=>{
        let ctx = new ConfigCtx();
        expect(ctx.get('foo')).toEqual(undefined);
        expect(ctx.get('path.bar')).toEqual(undefined);
        ctx.setValues({
            foo: 'hello',
            'path.bar': 'there',
        });
        expect(ctx.get('foo')).toEqual('hello');
        expect(ctx.get('path.bar')).toEqual('there');
        ctx.deleteValues({
            foo: 'hello',
            'path.bar': 'there',
        });
        expect(ctx.get('foo')).toEqual(undefined);
        expect(ctx.get('path.bar')).toEqual(undefined);
    });

    xit(`config can override class defaults`, ()=>{
        class TBase extends Gadget {
            static { this.schema('value', { dflt: 'foo' }); }
        }
        let b = new TBase();
        expect(b.value).toEqual('foo');
        Configs.setValues({
            'tBase.value': 'bar',
        });
        b = new TBase();
        expect(b.value).toEqual('bar');
    });

    xit(`config can override subclass defaults`, ()=>{
        class TBase extends Gadget {
            static { this.schema('value', { dflt: 'foo' }); }
        }
        class TSub extends TBase {
            static { this.schema('value2', { dflt: 'hello' }); }
        }
        let gdt = new TSub();
        expect(gdt.value).toEqual('foo');
        expect(gdt.value2).toEqual('hello');
        Configs.setValues({
            'tBase.value': 'boo',
            'tBase.tSub.value': 'baz',
            'tBase.tSub.value2': 'there',
        });
        gdt = new TSub();
        expect(gdt.value).toEqual('baz');
        expect(gdt.value2).toEqual('there');
        gdt = new TBase();
        expect(gdt.value).toEqual('boo');
    });

});