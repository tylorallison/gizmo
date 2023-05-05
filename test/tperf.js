import { Fmt } from '../js/fmt.js';
import { GizmoData } from '../js/gizmoData.js';
import { Schema } from '../js/schema.js';

class tVect1 extends GizmoData { 
    static {
        GizmoData.schema(this, 'x', { dflt: 0 });
        GizmoData.schema(this, 'y', { dflt: 0 });
    }
    constructor(x,y) {
        super({x:x, y:y});
    }
}

class tVect2 {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
}

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

function defp(o,k) {
    Object.defineProperty(o, k, {
        enumerable: true,
        get() {
            return (this.$values) ? this.$values.get(k) : undefined;
        },
        set(v) {
            if (this.$values) this.$values.set(k,v);
        },
    });
}

class tVect6 {
    static registry = new Map();
    static init() {
        if (!this.registry.has(this.name)) this.registry.set(this.name, this);
    }
    static {
        //console.log(`static this.prototype: ${this.prototype}`);
        defp(this.prototype, 'x');
        defp(this.prototype, 'y');
    }
    constructor(x,y) {
        this.$values = new Map();
        this.x = x;
        this.y = y;
    }
}

const clss = [
    tVect1,
    //tVect2,
    //tVect3,
    //tVect4,
    tVect6,
    //tVect5,
]

//const iterations = 250000;
const iterations = 1000000;
//const iterations = 2;
//const iterations = 2500000;

describe('dp test', () => {
    it('is it functional', ()=>{
        let v = new tVect6(1,2);
        let v2 = new tVect6(3,4);
        v2.y = 55;
        //console.log(`v.constructor.x: ${v.constructor.x}`);
    });
});


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

    it(`performance to get property`, ()=>{
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

    it('performance to set property', ()=>{
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