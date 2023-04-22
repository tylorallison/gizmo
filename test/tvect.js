import { Vect } from '../js/vect.js';

describe('a 2d vector', () => {

    // set
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [{y:1}], xX: 1, xY: 1},
        {v: new Vect({x:1,y:2}), args: [{x:2,y:1}], xX: 2, xY: 1},
        {v: new Vect({x:1,y:2}), args: [new Vect({x:2,y:1})], xX: 2, xY: 1},
    ]) {
        it('can set ' + test.args, ()=>{
            const rslt = test.v.set(...test.args);
            expect(rslt.x).toBe(test.xX);
            expect(rslt.y).toBe(test.xY);
        })
    }

    // static add
    for (const test of [
        {args: [], xv: new Vect({x:0,y:0})},
        {args: [{x:5,y:10}], xv: new Vect({x:5,y:10})},
        {args: [{x:5,y:10}, {x:7,y:8}], xv: new Vect({x:12,y:18})},
        {args: [{x:5,y:10}, {x:7,y:8}, {x:1,y:1}], xv: new Vect({x:13,y:19})},
    ]) {
        it('can static add ' + test.args, ()=>{
            const rslt = Vect.add(...test.args);
            expect(rslt).toEqual(test.xv);
        })
    }

    // method add
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [], xv: new Vect({x:1,y:2})},
        {v: new Vect({x:1,y:2}), args: [{x:1,y:2}], xv: new Vect({x:2,y:4})},
        {v: new Vect({x:1,y:2}), args: [{x:1,y:2}, {x:2,y:1}], xv: new Vect({x:4,y:5})},
    ]) {
        it(`can add ${test.v} and ${test.args}`, ()=>{
            const rslt = test.v.add(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // static scalar add
    for (const test of [
        {args: [], xv: new Vect({x:0, y:0})},
        {args: [{x: 1, y: 2}], xv: new Vect({x:1, y:2})},
        {args: [{x: 1, y: 2}, 5], xv: new Vect({x:6, y:7})},
        {args: [{x: 1, y: 2}, 5, 7], xv: new Vect({x:13, y:14})},
    ]) {
        it('can statically scalar add ' + test.args, ()=>{
            const rslt = Vect.sadd(...test.args);
            expect(rslt).toEqual(test.xv);
        })
    }

    // scalar add
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [], xv: new Vect({x:1, y:2})},
        {v: new Vect({x:1,y:2}), args: [5], xv: new Vect({x:6, y:7})},
        {v: new Vect({x:1,y:2}), args: [5, 7], xv: new Vect({x:13, y:14})},
    ]) {
        it('can scalar add ' + test.args, ()=>{
            const rslt = test.v.sadd(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // static sub
    for (const test of [
        {args: [], xv: new Vect({x:0,y:0})},
        {args: [{x:5,y:10}], xv: new Vect({x:5,y:10})},
        {args: [{x:5,y:10}, {x:7,y:8}], xv: new Vect({x:-2,y:2})},
        {args: [{x:5,y:10}, {x:7,y:8}, {x:1,y:1}], xv: new Vect({x:-3,y:1})},
    ]) {
        it('can static sub ' + test.args, ()=>{
            const rslt = Vect.sub(...test.args);
            expect(rslt).toEqual(test.xv);
        })
    }

    // method sub
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [], xv: new Vect({x:1,y:2})},
        {v: new Vect({x:1,y:2}), args: [{x:1,y:2}], xv: new Vect({x:0,y:0})},
        {v: new Vect({x:1,y:2}), args: [{x:1,y:2}, {x:2,y:1}], xv: new Vect({x:-2,y:-1})},
    ]) {
        it(`can sub ${test.v} and ${test.args}`, ()=>{
            const rslt = test.v.sub(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // static scalar sub
    for (const test of [
        {args: [], xv: new Vect({x:0, y:0})},
        {args: [{x: 1, y: 2}], xv: new Vect({x:1, y:2})},
        {args: [{x: 1, y: 2}, 5], xv: new Vect({x:-4, y:-3})},
        {args: [{x: 1, y: 2}, 5, 7], xv: new Vect({x:-11, y:-10})},
    ]) {
        it('can statically scalar sub ' + test.args, ()=>{
            const rslt = Vect.ssub(...test.args);
            expect(rslt).toEqual(test.xv);
        })
    }

    // scalar sub
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [], xv: new Vect({x:1, y:2})},
        {v: new Vect({x:1,y:2}), args: [5], xv: new Vect({x:-4, y:-3})},
        {v: new Vect({x:1,y:2}), args: [5, 7], xv: new Vect({x:-11, y:-10})},
    ]) {
        it('can scalar sub ' + test.args, ()=>{
            const rslt = test.v.ssub(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    /*

    // mult
    let multTests = [
        {args: [2], xX: 2, xY: 4},
        {args: [2,3], xX: 2, xY: 6},
        {args: [new Vect(2,3)], xX: 2, xY: 6},
    ]
    for (const test of multTests) {
        it('can multiply ' + test.args, ()=>{
            const rslt = v.mult(...test.args);
            expect(rslt.x).toBe(test.xX);
            expect(rslt.y).toBe(test.xY);
        })
    }

    // div
    let divTests = [
        {args: [2], xX: .5, xY: 1},
        {args: [2,8], xX: .5, xY: .25},
        {args: [new Vect(2,8)], xX: .5, xY: .25},
    ]
    for (const test of divTests) {
        it('can divide ' + test.args, ()=>{
            const rslt = v.div(...test.args);
            expect(rslt.x).toBe(test.xX);
            expect(rslt.y).toBe(test.xY);
        })
    }

    // dot
    let dotTests = [
        {args: [2,3], xRslt: 8},
        {args: [new Vect(2,3)], xRslt: 8},
    ]
    for (const test of dotTests) {
        it('can dot product ' + test.args, ()=>{
            const rslt = v.dot(...test.args);
            expect(rslt).toBe(test.xRslt);
        })
    }

    // dist
    let distTests = [
        {args: [4,6], xRslt: 5},
        {args: [new Vect(4,6)], xRslt: 5},
    ]
    for (const test of distTests) {
        it('can compute distance to ' + test.args, ()=>{
            const rslt = v.dist(...test.args);
            expect(rslt).toBe(test.xRslt);
        })
    }

    // normalize
    let normalizeTests = [
        {args: [new Vect(2,0)], xX: 1, xY: 0},
        {args: [new Vect(0,2)], xX: 0, xY: 1},
    ]
    for (const test of normalizeTests) {
        it('can normalize ' + test.args, ()=>{
            v.set(...test.args);
            const rslt = v.normalize();
            expect(rslt.x).toBe(test.xX);
            expect(rslt.y).toBe(test.xY);
        })
    }

    // heading
    let headingTests = [
        {args: [new Vect(1,0)], xRslt: 0},
        {args: [new Vect(1,1)], xRslt: 45},
        {args: [new Vect(0,1)], xRslt: 90},
        {args: [new Vect(-1,1)], xRslt: 135},
        {args: [new Vect(-1,0)], xRslt: 180},
        {args: [new Vect(-1,-1)], xRslt: -135},
        {args: [new Vect(0,-1)], xRslt: -90},
        {args: [new Vect(1,-1)], xRslt: -45},
    ]
    for (const test of headingTests) {
        it('can determine heading of ' + test.args, ()=>{
            v.set(...test.args);
            const rslt = v.heading();
            expect(rslt).toBe(test.xRslt);
        })
    }

    // rotate
    let rotateTests = [
        {v: new Vect(1,0), a: 90, xX: 0, xY: 1},
        {v: new Vect(1,0), a: -90, xX: 0, xY: -1},
        {v: new Vect(1,1), a: 90, xX: -1, xY: 1},
    ]
    for (const test of rotateTests) {
        it('can rotate ' + test.v + ' by: ' + test.a, ()=>{
            v.set(test.v);
            const rslt = v.rotate(test.a);
            expect(rslt.x).toBeCloseTo(test.xX);
            expect(rslt.y).toBeCloseTo(test.xY);
        })
    }

    // angle
    let angleTests = [
        {v1: new Vect(1,0), v2: new Vect(1,1), xRslt: 45},
        {v1: new Vect(1,-1), v2: new Vect(1,1), xRslt: 90},
        {v1: new Vect(1,1), v2: new Vect(1,-1), xRslt: -90},
        {v1: new Vect(-1,1), v2: new Vect(-1,-1), xRslt: 90},
        {v1: new Vect(-1,-1), v2: new Vect(-1,1), xRslt: -90},
    ]
    for (const test of angleTests) {
        it('can compute angle between ' + test.v1 + ' and: ' + test.v2, ()=>{
            v.set(test.v1);
            const rslt = v.angle(test.v2);
            expect(rslt).toBeCloseTo(test.xRslt);
        })
    }

    // equals
    let equalsTests = [
        {args: [new Vect(1,2)], xRslt: true},
        {args: [1,2], xRslt: true},
    ]
    for (const test of equalsTests) {
        it('can test equality to ' + test.args, ()=>{
            const rslt = v.equals(...test.args);
            expect(rslt).toBe(test.xRslt);
        })
    }

    // static reflect
    for (const test of [
        {args: [new Vect(1,1), new Vect(0,1)], xRslt: new Vect(-1,1)},
        {args: [new Vect(-1,1), new Vect(0,1)], xRslt: new Vect(1,1)},
    ]) {
        it("can test static reflection of " + test.args, ()=>{
            const rslt = Vect.reflect(...test.args);
            expect(rslt).toEqual(test.xRslt);
        });
    }

    // reflect
    for (const test of [
        {v: new Vect(1,1), args: [new Vect(0,1)], xRslt: new Vect(-1,1)},
        {v: new Vect(-1,1), args: [new Vect(0,1)], xRslt: new Vect(1,1)},
    ]) {
        it(`can test reflection of ${test.v} with ${test.args}`, ()=>{
            const rslt = test.v.reflect(...test.args);
            expect(rslt).toEqual(test.xRslt);
        });
    }
    */

})