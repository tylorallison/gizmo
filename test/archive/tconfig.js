import { Config } from '../js/config.js';
import { Fmt } from '../js/fmt.js';
import { Gadget } from '../js/gizmo.js';
import { Util } from '../js/util.js';

class TConfig {
    static $values = {};

    static has(o,key) {
        let path = `${o.constructor.cfgpath}.${key}`;
        if (Util.haspath(this.$values, path)) {
            //console.log(`config has: ${path}`);
            return true;
        }
        return false;
    }

    static get(o,key,dflt) {
        let path = `${o.constructor.cfgpath}.${key}`;
        //console.log(`TConfig.get: ${o} key: ${key}`);
        if (Util.haspath(this.$values, path)) return Util.getpath(this.$values, path, dflt);
        return undefined;
    }

    static set(path, value) {
        //console.log(`setting: ${path} value: ${value}`)
        Util.setpath(this.$values, path, value);
    }
}

class TBase extends Gadget {
    static dflter(o,key,dflt) {
        //console.log(`p: ${p}`);
        if (TConfig.has(o, key)) {
            //console.log(`parser: ${o} key: ${key} config'd`);
            dflt = TConfig.get(o, key);
        }
        return dflt;
    }
    static { this.schema('dbg', { dflt: (o) => this.dflter(o,'dbg', false) }); }
    static { this.schema('var1', { dflt: (o) => this.dflter(o,'var1', 'hello')}); }
}

class TExt extends TBase {
    static { this.schema('var2', { dflt: (o) => this.dflter(o,'var2', 'there')}); }
}

describe('config', () => {
    it(`can access config values`, ()=>{
        let cfg = new Config({ values: {
            'test.a': 'hello',
            'test.b': 'there',
            'test.var.a': 'world',
        }});
        expect(cfg.values.test.a).toEqual('hello');
        expect(cfg.values.test.b).toEqual('there');
        expect(cfg.values.test.var.a).toEqual('world');
        let scope = cfg.scope('test');
        expect(scope.values.var.a).toEqual('world');
        scope = scope.scope('var');
        expect(scope.values.a).toEqual('world');
    });

    it(`can get path`, ()=>{
        let cfg = new Config({ values: {
            'test.a': 'hello',
            'test.sub.a': 'hello',
        }});
        expect(cfg.get('test.a')).toEqual('hello');
        expect(cfg.get('test.foo')).toEqual(undefined);
        expect(cfg.get('test.foo', 'bar')).toEqual('bar');
        expect(cfg.get('test.foo.bar')).toEqual(undefined);
        let scope = cfg.scope('test');
        expect(scope.get('sub.a')).toEqual('hello');
        scope = scope.scope('sub');
        expect(scope.get('a')).toEqual('hello');
    });
})

describe('tconfig', () => {
    it(`test`, ()=>{
        let b = new TBase();
        //console.log(`b: ${Fmt.ofmt(b.$store)}`);

        let e = new TExt();
        //console.log(`e: ${Fmt.ofmt(e.$store)}`);

        TConfig.set('tBase.dbg', 'yeah');
        let b2 = new TBase();
        //console.log(`b2: ${Fmt.ofmt(b2.$store)}`);
        

    });
});