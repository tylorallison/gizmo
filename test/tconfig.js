import { Config } from '../js/config.js';

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