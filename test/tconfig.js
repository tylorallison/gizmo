import { Configs } from '../js/config.js';
import { Gadget } from '../js/gizmo.js';

describe('a config context', () => {
    afterEach(() => {
        Configs.clear();
    });

    class tcfg extends Gadget {
        static { this.schema('value1', { dflt: 'foo1' }); }
        static { this.schema('value2', { dflt: 'foo2' }); }
    }
    class tcfgsub extends tcfg {
        static { this.schema('value2', { dflt: 'FOO2' }); }
        static { this.schema('value3', { dflt: 'FOO3' }); }
    }

    it(`config can override class defaults`, ()=>{
        let b = new tcfg();
        expect(b.value1).toEqual('foo1');
        Configs.setValues({
            'tcfg.value1': 'bar',
        });
        b = new tcfg();
        expect(b.value1).toEqual('bar');
        Configs.clear();
        b = new tcfg();
        expect(b.value1).toEqual('foo1');
    });

    it(`config can override subclass defaults`, ()=>{
        let gdt = new tcfgsub();
        expect(gdt.value1).toEqual('foo1');
        expect(gdt.value2).toEqual('FOO2');
        expect(gdt.value3).toEqual('FOO3');
        Configs.setValues({
            'tcfg.value1': 'boo',
            'tcfgsub.value2': 'baz',
            'tcfgsub.value3': 'there',
        });
        gdt = new tcfgsub();
        expect(gdt.value1).toEqual('boo');
        expect(gdt.value2).toEqual('baz');
        expect(gdt.value3).toEqual('there');
        gdt = new tcfg();
        expect(gdt.value1).toEqual('boo');
        expect(gdt.value2).toEqual('foo2');
        Configs.clear();
        gdt = new tcfgsub();
        expect(gdt.value1).toEqual('foo1');
        expect(gdt.value2).toEqual('FOO2');
        expect(gdt.value3).toEqual('FOO3');
        gdt = new tcfg();
        expect(gdt.value1).toEqual('foo1');
        expect(gdt.value2).toEqual('foo2');
    });

});