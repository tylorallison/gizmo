import { Fmt } from '../js/fmt.js';
//import { GizmoData } from '../js/gizmoData.js';
//import { Schema } from '../js/schema.js';

import { Gadget } from '../js/gizmo4.js';

class baseVect {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
}

class base {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
}
class subVect extends base {
}

class tVect1 extends Gadget { 
    static {
        this.schema('x', { dflter: () => 0 });
        this.schema('y', { dflter: () => 0 });
    }
    cparse(x, y) {
        //this.$values.x = x;
        //this.$values.y = y;
        //this.$values['x'] = x;
        //this.$values['y'] = y;
        //let key = 'x';
        //this.$values[key] = x;
        //key = 'y';
        //this.$values[key] = y;
        this.constructor.kvparse(this, 'x', x);
        this.constructor.kvparse(this, 'y', y);
    }
}

/*

class tVect3 {
    static {
        GizmoData.schema(this, 'x', { dflt: 0 });
        GizmoData.schema(this, 'y', { dflt: 0 });
    }
    static registry = {};
    static init() {
        if (!this.name in this.registry) {
            this.registry[this.name] = this;
        }
    }
    constructor(x,y) {
        this.constructor.init();
        GizmoData.parser(this, {x:x, y:y});
    }
}

function sapply(o,s,k,v) {
    let cls = o.constructor;
    if (!cls.hasOwnProperty('$schema')) cls.$schema = {};
    let schema = cls.$schema;
    schema[k] = s;
    o[k] = v;
}

class tVect4 {
    static registry = new Map();
    static init() {
        if (!this.registry.has(this.name)) this.registry.set(this.name, this);
    }

    constructor(x,y) {
        this.constructor.init();
        //sapply(this, 'x', { dflt: 0 });
                    //this.set(o, sentry.key, sentry.parser(o, spec));
        sapply(this, {}, 'x', x);
        sapply(this, {}, 'y', y);
        //this.x = x;
        //this.y = y;
    }
}

class tVect5 {
    static {
        Schema.apply(this, 'x', { dflt: 0 });
        Schema.apply(this, 'y', { dflt: 0 });
    }
    static registry = {};
    static init() {
        if (!this.name in this.registry) {
            this.registry[this.name] = this;
        }
    }
    constructor(x,y) {
        this.constructor.init();
        GizmoData.parser(this, {x:x, y:y});
        let proxy = new Proxy(this, {
            get(target, key, receiver) {
                const value = target[key];
                if (value instanceof Function) {
                    return function (...args) {
                        return value.apply(this === receiver ? target : this, args);
                    };
                }
                return value;
            },
            set(target, key, value) {
                target[key] = value;
                return true;
            }
        });
        return proxy;
    }
}
*/

class tVect6 {

    static defp(o,k) {
        Object.defineProperty(o, k, {
            enumerable: true,
            get() {
                return (this.#values) ? this.#values[k] : undefined;
            },
            set(v) {
                if (this.#values) this.#values[k] = v;
            },
        });
    }

    static registry = new Map();
    static init() {
        if (!this.registry.has(this.name)) this.registry.set(this.name, this);
    }
    static {
        //console.log(`static this.prototype: ${this.prototype}`);
        this.defp(this.prototype, 'x');
        this.defp(this.prototype, 'y');
    }
    #values = {};
    constructor(x,y) {
        this.$values = new Map();
        this.x = x;
        this.y = y;
    }
}

const clss = [
    baseVect,
    subVect,
    tVect1,
    subVect,
    baseVect,
    //tVect2,
    //tVect3,
    //tVect4,
    tVect6,
    //tVect5,
]

const iterations = 3000000;

describe('perf tests', () => {

    it('performance to construct a vector', ()=>{
        for (const cls of clss) {
            let tag = `constructor test:${cls.name}`;
            console.time(tag);
            for (var i = 0; i < iterations; i++) {
                let v = new cls(1,2);
            };
            console.timeEnd(tag)
        }
    });

    xit(`performance to get property`, ()=>{
        for (const cls of clss) {
            let tag = `get test:${cls.name}`;
            let v = new cls(1,2);
            console.time(tag);
            let x;
            for (var i = 0; i < iterations; i++) {
                x = v.x;
            };
            console.timeEnd(tag)
            expect(x).toEqual(1);
        }
    });

    xit('performance to set property', ()=>{
        for (const cls of clss) {
            let tag = `set test:${cls.name}`;
            let v = new cls(1,2);
            console.time(tag);
            for (var i = 0; i < iterations; i++) {
                v.x = i;
            };
            console.timeEnd(tag)
            expect(v.x).toEqual(iterations-1);
        }
    });

});