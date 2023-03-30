import { Schema } from '../js/schema.js';
import { Vect } from '../js/vect.js';

class tdata {
    static registry = {};
    static init() {
        if (!this.name in this.registry) {
            this.registry[this.name] = this;
        }
    }
    constructor(spec={}, applySchema=true) {
        this.constructor.init();
    }
}

class tproxy {
    static registry = {};
    static init() {
        if (!this.name in this.registry) {
            this.registry[this.name] = this;
        }
    }
    static get schema() {
        if (!this.hasOwnProperty('_schema')) this._schema = Object.assign({}, Object.getPrototypeOf(this)._schema);
        return this._schema;
    }
    constructor(spec={}) {
        this.constructor.init();
        //for (const schema of Object.values(this.constructor.schema)) {
        for (const key in this.constructor.schema) {
            let schema = this.constructor.schema[key];
            //let value = 
            this[schema.key] = schema.parser(this, spec);
        }
        return new Proxy(this, {
            get(target, prop, receiver) {
                return target[prop];
            },
            set(target, key, value) {
                target[key] = value;
                return true;
            },
        });
    }
}

class tVect1 extends Vect { }

class tVect2 {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
}

class tVect3 {
    static registry = {};
    static init() {
        if (!this.name in this.registry) {
            this.registry[this.name] = this;
        }
    }
    constructor(x,y) {
        this.constructor.init();
        this.x = x;
        this.y = y;
    }
}

class tVect4 extends tdata {
    constructor(x,y) {
        super();
        Object.defineProperty(this, 'x', {
            enumerable: true,
            get: () => x,
            set: (v) => x = v,
        });
        Object.defineProperty(this, 'y', {
            enumerable: true,
            get: () => y,
            set: (v) => y = v,
        });
    }
}

class tVect5 extends tproxy {
    static {
        Schema.apply(this, 'x', { dflt: 0 });
        Schema.apply(this, 'y', { dflt: 0 });
    }
    constructor(x=0,y=0) {
        super({x:x, y:y})
        return new Proxy(this, {
            get(target, prop, receiver) {
                return target[prop];
            },
            set(target, key, value) {
                target[key] = value;
                return true;
            },
        });
    }
}

describe('perf tests', () => {

    it('performance to construct a vector', ()=>{
        let iterations = 1000000;
        for (const cls of [
            tVect1,
            tVect2,
            tVect3,
            tVect4,
            tVect5,
        ]) {
            let tag = `test:${cls.name}`;
            console.time(tag);
            for (var i = 0; i < iterations; i++) {
                let v = new cls(1,2);
            };
            console.timeEnd(tag)
        }
    });

    /*
    it('performance to access property', ()=>{
        let iterations = 500000;
        let v = new Vect(1,2);
        console.time('get x from vect');
        let x;
        for (var i = 0; i < iterations; i++) {
            x = v.x;
        };
        console.timeEnd('get x from vect')
        expect(x).toEqual(1);
        v = new tVect(1,2);
        console.time('get x from tvect');
        for (var i = 0; i < iterations; i++) {
            x = v.x;
        };
        console.timeEnd('get x from tvect')
        expect(x).toEqual(1);
        v = new tVect2(1,2);
        console.time('get x from tvect2');
        for (var i = 0; i < iterations; i++) {
            x = v.x;
        };
        console.timeEnd('get x from tvect2')
        expect(x).toEqual(1);
        v = new tVect3(1,2);
        console.time('get x from tvect3');
        for (var i = 0; i < iterations; i++) {
            x = v.x;
        };
        console.timeEnd('get x from tvect3')
        expect(x).toEqual(1);
    });

    it('performance to set property', ()=>{
        let iterations = 500000;
        let v = new Vect(1,2);
        console.time('set x from vect');
        for (var i = 0; i < iterations; i++) v.x = 3;
        console.timeEnd('set x from vect')
        expect(v.x).toEqual(3);
        v = new tVect(1,2);
        console.time('set x from tvect');
        for (var i = 0; i < iterations; i++) v.x = 3;
        console.timeEnd('set x from tvect')
        expect(v.x).toEqual(3);
        v = new tVect2(1,2);
        console.time('set x from tvect2');
        for (var i = 0; i < iterations; i++) v.x = 3;
        console.timeEnd('set x from tvect2')
        expect(v.x).toEqual(3);
        v = new tVect3(1,2);
        console.time('set x from tvect3');
        for (var i = 0; i < iterations; i++) v.x = 3;
        console.timeEnd('set x from tvect3')
        expect(v.x).toEqual(3);
    });
    */

});
