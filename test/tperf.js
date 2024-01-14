import { Fmt } from '../js/fmt.js';
//import { GizmoData } from '../js/gizmoData.js';
//import { Schema } from '../js/schema.js';

import { Gadget, GadgetObject } from '../js/gizmo.js';
import { Gadget as Gadget2 } from '../../gizmo2/js/gadget.js';

class baseVect {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
}

class gadgetVect extends Gadget { 
    static {
        this.schema('x', { dflt: 0 });
        this.schema('y', { dflt: 0 });
    }
    cparse(x, y) {
        this.x = x;
        this.y = y;
    }
}

class gadget2Vect extends Gadget2 { 
    static {
        this.$schema('x', { dflt: 0 });
        this.$schema('y', { dflt: 0 });
    }
    $cparse(x, y) {
        this.x = x;
        this.y = y;
    }
}

class staticPropertyVect {
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
        this.defp(this.prototype, 'x');
        this.defp(this.prototype, 'y');
    }
    #values = {};
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
}

class dynamicPropertyVect {
    constructor(x,y) {
        Object.defineProperty(this, 'x', {
            value: x,
            writable: true,
            enumerable: true,
        });
        Object.defineProperty(this, 'y', {
            value: y,
            writable: true,
            enumerable: true,
        });
    }
}

class proxyVect {

    static $registry = new Map();
    static $register() {
        if (!Object.hasOwn(this.prototype, '$registered')) {
            let clsproto = this.prototype;
            // registration
            clsproto.$registered = true;
            this.$registry.set(this.name, this);
        }
    }

    constructor(x,y) {
        this.constructor.$register();
        this.x = x;
        this.y = y;
        const proxy = new Proxy(this, {
            get(target, key, receiver) {
                return target[key];
            },
            set(target, key, value) {
                target[key] = value;
                return true;
            }
        });
        return proxy;
    }
}

const clss = [
    //baseVect,
    //tVect6,
    //dynamicPropertyVect,
    proxyVect,
    gadgetVect,
    gadget2Vect,
]

const timeout = 100;

function looper(fcn, timeout=250) {
    var iterations = 0;
    let start = performance.now();
    while (performance.now()-start<timeout ) {
        fcn();
        iterations++;
    }
    return iterations;
}

describe('constructor tests', () => {
    for (const cls of clss) {
        let v;
        let iterations = looper(() => {
            v = new cls(1,2);
        }, timeout);
        it(`performance using ${cls.name} iterations: ${iterations} ips: ${iterations/(timeout/1000)}`, ()=>{
            expect(v.x).toEqual(1);
            expect(v.y).toEqual(2);
            expect('x' in v).toBeTruthy();
            //expect(Object.keys(v).includes('x')).toBeTruthy();
            console.log(`${cls.name} keys: ${Object.keys(v)}`);
        });
    }
});

/*
xdescribe('add tests', () => {
    for (const cls of clss) {
        let v1 = new cls(1,2);
        let v2 = new cls(3,4);
        let iterations = looper(() => {
            let xs = v1.x+v2.x;
            let ys = v1.y+v2.y;
        }, timeout);
        it(`performance using ${cls.name} iterations: ${iterations} ips: ${iterations/(timeout/1000)}`, ()=>{
            expect(iterations>0).toBeTruthy();
        });
    }
});

xdescribe('get tests', () => {
    for (const cls of clss) {
        let v1 = new cls(1,2);
        let iterations = looper(() => {
            let x = v1.x;
            let y = v1.y;
        }, timeout);
        it(`performance using ${cls.name} iterations: ${iterations} ips: ${iterations/(timeout/1000)}`, ()=>{
            expect(iterations>0).toBeTruthy();
        });
    }
});

xdescribe('set tests', () => {
    for (const cls of clss) {
        let v1 = new cls(1,2);
        let iterations = looper(() => {
            v1.x = 1.1;
            v1.y = 2.1;
        }, timeout);
        it(`performance using ${cls.name} iterations: ${iterations} ips: ${iterations/(timeout/1000)}`, ()=>{
            expect(iterations>0).toBeTruthy();
        });
    }
});
*/