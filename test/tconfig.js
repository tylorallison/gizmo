import { Config } from '../js/config.js';

describe('config', () => {
    // intersects
    let cfg = new Config({
        'test.a': 'hello',
        'test.b': 'there',
        'test.path.a': 'world',
    });
    expect(cfg['test.a']).toEqual('hello');
});