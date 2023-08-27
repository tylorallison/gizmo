import { ConfigCtx } from '../js/configCtx.js';
import { Gadget, Gizmo } from '../js/gizmo.js';


describe('a config context', () => {

    it(`has a base/default context`, ()=>{
        let ctx = ConfigCtx.instance;
        expect(ctx).toBeTruthy();
    });

    it(`context can be advanced and withdrawn`, ()=>{
        expect(ConfigCtx.get('foo')).toEqual(undefined);
        ConfigCtx.advance(new ConfigCtx({ values: {
            'foo': 'bar',
        }}));
        expect(ConfigCtx.get('foo')).toEqual('bar');
        ConfigCtx.withdraw();
        expect(ConfigCtx.get('foo')).toEqual(undefined);
    });

    it(`config can override class defaults`, ()=>{
        class TBase extends Gadget {
            static { this.schema('value', { dflt: 'foo' }); }
        }
        let b = new TBase();
        expect(b.value).toEqual('foo');
        ConfigCtx.doWith( new ConfigCtx({ values: {
            'tBase.value': 'bar',
        }}), () => {
            let b = new TBase();
            expect(b.value).toEqual('bar');
        });
    });

    it(`config can override subclass defaults`, ()=>{
        class TBase extends Gadget {
            static { this.schema('value', { dflt: 'foo' }); }
        }
        class TSub extends TBase {
            static { this.schema('value2', { dflt: 'hello' }); }
        }
        let gdt = new TSub();
        expect(gdt.value).toEqual('foo');
        expect(gdt.value2).toEqual('hello');
        ConfigCtx.doWith( new ConfigCtx({ values: {
            'tBase.value': 'boo',
            'tBase.tSub.value': 'baz',
            'tBase.tSub.value2': 'there',
        }}), () => {
            let gdt = new TSub();
            expect(gdt.value).toEqual('baz');
            expect(gdt.value2).toEqual('there');
            gdt = new TBase();
            expect(gdt.value).toEqual('boo');
        });
    });

});