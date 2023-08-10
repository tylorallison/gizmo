import { Config } from '../js/config.js';

describe('config', () => {
    it(`can access defined fields`, ()=>{
        // intersects
        let cfg = new Config({
            'test.a': 'hello',
            'test.b': 'there',
            'test.path.a': 'world',
        });
        expect(cfg.test.a).toEqual('hello');
        expect(cfg.test.b).toEqual('there');
        expect(cfg.test.path.a).toEqual('world');
    });

    it(`can get path`, ()=>{
        let cfg = new Config({
            'test.a': 'hello',
        });
        expect(cfg.get('test.a')).toEqual('hello');
        //expect(cfg.test.foo).toEqual(undefined);
        //expect(cfg.test.foo.bar).toEqual(undefined);
    });
})