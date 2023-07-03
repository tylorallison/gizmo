import { Vect } from "../js/vect.js";
import { Vect3 } from "../js/vect3.js";

describe("3d vectors", () => {

    // set
    for (const test of [
        {v: new Vect3({x:1,y:2,z:3}), args: [{x:2,y:1,z:0}], xrslt:new Vect3({x:2,y:1,z:0})},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect({x:2,y:1})], xrslt:new Vect3({x:2,y:1,z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect3({x:2,y:1,z:0})], xrslt:new Vect3({x:2,y:1,z:0})},
    ]) {
        it("can set " + test.args, ()=>{
            const rslt = test.v.set(...test.args);
            expect(rslt).toEqual(test.xrslt);
        })
    }

    // add
    for (const test of [
        {v: new Vect3({x:1,y:2,z:3}), args: [], xrslt: new Vect3({x:1,y:2,z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [{x:1,y:2}], xrslt: new Vect3({x:2,y:4,z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [{x:1,y:2,z:3}], xrslt: new Vect3({x:2,y:4,z:6})},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect({x:1,y:2})], xrslt: new Vect3({x:2,y:4,z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect3({x:1,y:2,z:3})], xrslt: new Vect3({x:2,y:4,z:6})},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect3({x:1,y:2,z:3}), new Vect3({x:-2,y:-4,z:-6})], xrslt: new Vect3({x:0,y:0,z:0})},
    ]) {
        it(`can add ${test.v} and ${test.args}`, ()=>{
            let rslt = Vect3.add(test.v, ...test.args);
            expect(rslt).toEqual(test.xrslt);
            rslt = test.v.add(...test.args);
            expect(rslt).toEqual(test.xrslt);
            expect(test.v).toEqual(test.xrslt);
        })
    }

    // scalar add
    for (const test of [
        {v: new Vect3({x:1,y:2,z:3}), args: [], xv: new Vect3({x:1, y:2, z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [5], xv: new Vect3({x:6, y:7, z:8})},
        {v: new Vect3({x:1,y:2,z:3}), args: [5, 7], xv: new Vect3({x:13, y:14, z:15})},
    ]) {
        it('can scalar add ' + test.args, ()=>{
            let rslt = Vect3.sadd(test.v, ...test.args);
            expect(rslt).toEqual(test.xv);
            rslt = test.v.sadd(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // sub
    for (const test of [
        {v: new Vect3({x:1,y:2,z:3}), args: [], xrslt: new Vect3({x:1,y:2,z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [{x:1,y:2}], xrslt: new Vect3({x:0,y:0,z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [{x:1,y:2,z:3}], xrslt: new Vect3({x:0,y:0,z:0})},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect({x:1,y:2})], xrslt: new Vect3({x:0,y:0,z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect3({x:1,y:2,z:3})], xrslt: new Vect3({x:0,y:0,z:0})},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect3({x:1,y:2,z:3}), new Vect3({x:-2,y:-4,z:-6})], xrslt: new Vect3({x:2,y:4,z:6})},
    ]) {
        it(`can sub ${test.v} and ${test.args}`, ()=>{
            let rslt = Vect3.sub(test.v, ...test.args);
            expect(rslt).toEqual(test.xrslt);
            rslt = test.v.sub(...test.args);
            expect(rslt).toEqual(test.xrslt);
            expect(test.v).toEqual(test.xrslt);
        })
    }

    // scalar sub
    for (const test of [
        {v: new Vect3({x:1,y:2,z:3}), args: [], xv: new Vect3({x:1, y:2, z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [5], xv: new Vect3({x:-4, y:-3, z:-2})},
        {v: new Vect3({x:1,y:2,z:3}), args: [5, 7], xv: new Vect3({x:-11, y:-10, z:-9})},
    ]) {
        it('can scalar sub ' + test.args, ()=>{
            let rslt = Vect3.ssub(test.v, ...test.args);
            expect(rslt).toEqual(test.xv);
            rslt = test.v.ssub(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // mult
    for (const test of [
        {v: new Vect3({x:1,y:2,z:3}), args: [], xrslt: new Vect3({x:1,y:2,z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [{x:1,y:2}], xrslt: new Vect3({x:1,y:4,z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [{x:1,y:2,z:3}], xrslt: new Vect3({x:1,y:4,z:9})},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect({x:1,y:2})], xrslt: new Vect3({x:1,y:4,z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect3({x:1,y:2,z:3})], xrslt: new Vect3({x:1,y:4,z:9})},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect3({x:1,y:2,z:3}), new Vect3({x:-2,y:-4,z:-6})], xrslt: new Vect3({x:-2,y:-16,z:-54})},
    ]) {
        it(`can mult ${test.v} and ${test.args}`, ()=>{
            let rslt = Vect3.mult(test.v, ...test.args);
            expect(rslt).toEqual(test.xrslt);
            rslt = test.v.mult(...test.args);
            expect(rslt).toEqual(test.xrslt);
            expect(test.v).toEqual(test.xrslt);
        })
    }

    // scalar mult
    for (const test of [
        {v: new Vect3({x:1,y:2,z:3}), args: [], xv: new Vect3({x:1, y:2, z:3})},
        {v: new Vect3({x:1,y:2,z:3}), args: [5], xv: new Vect3({x:5, y:10, z:15})},
        {v: new Vect3({x:1,y:2,z:3}), args: [5, 7], xv: new Vect3({x:35, y:70, z:105})},
    ]) {
        it('can scalar mult ' + test.args, ()=>{
            let rslt = Vect3.smult(test.v, ...test.args);
            expect(rslt).toEqual(test.xv);
            rslt = test.v.smult(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // div
    for (const test of [
        {v: new Vect3({x:2,y:16,z:54}), args: [], xrslt: new Vect3({x:2,y:16,z:54})},
        {v: new Vect3({x:2,y:16,z:54}), args: [{x:1,y:2}], xrslt: new Vect3({x:2,y:8,z:54})},
        {v: new Vect3({x:2,y:16,z:54}), args: [{x:1,y:2,z:3}], xrslt: new Vect3({x:2,y:8,z:18})},
        {v: new Vect3({x:2,y:16,z:54}), args: [new Vect({x:1,y:2})], xrslt: new Vect3({x:2,y:8,z:54})},
        {v: new Vect3({x:2,y:16,z:54}), args: [new Vect3({x:1,y:2,z:3})], xrslt: new Vect3({x:2,y:8,z:18})},
        {v: new Vect3({x:2,y:16,z:54}), args: [new Vect3({x:1,y:2,z:3}), new Vect3({x:-2,y:-4,z:-6})], xrslt: new Vect3({x:-1,y:-2,z:-3})},
    ]) {
        it(`can div ${test.v} and ${test.args}`, ()=>{
            let rslt = Vect3.div(test.v, ...test.args);
            expect(rslt).toEqual(test.xrslt);
            rslt = test.v.div(...test.args);
            expect(rslt).toEqual(test.xrslt);
            expect(test.v).toEqual(test.xrslt);
        })
    }

    // scalar div
    for (const test of [
        {v: new Vect3({x:35,y:70,z:105}), args: [], xv: new Vect3({x:35, y:70, z:105})},
        {v: new Vect3({x:35,y:70,z:105}), args: [5], xv: new Vect3({x:7, y:14, z:21})},
        {v: new Vect3({x:35,y:70,z:105}), args: [5, 7], xv: new Vect3({x:1, y:2, z:3})},
    ]) {
        it('can scalar div ' + test.args, ()=>{
            let rslt = Vect3.sdiv(test.v, ...test.args);
            expect(rslt).toEqual(test.xv);
            rslt = test.v.sdiv(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // dot
    for (const test of [
        {v: new Vect3({x:1,y:2,z:3}), args: [{x:2,y:3}], xrslt: 8},
        {v: new Vect3({x:1,y:2,z:3}), args: [{x:2,y:3,z:4}], xrslt: 20},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect({x:2,y:3})], xrslt: 8},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect3({x:2,y:3,z:4})], xrslt: 20},
    ]) {
        it("can dot product " + test.args, ()=>{
            let rslt = Vect3.dot(test.v, ...test.args);
            expect(rslt).toBe(test.xrslt);
            rslt = test.v.dot(...test.args);
            expect(rslt).toBe(test.xrslt);
        })
    }

    // dist
    for (const test of [
        {v: new Vect3({x:1,y:2,z:3}), args: [{x:4,y:6,z:3}], xrslt: 5},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect3({x:4,y:6,z:3})], xrslt: 5},
    ]) {
        it("can compute distance to " + test.args, ()=>{
            let rslt = Vect3.dist(test.v, ...test.args);
            expect(rslt).toBe(test.xrslt);
            rslt = test.v.dist(...test.args);
            expect(rslt).toBe(test.xrslt);
        })
    }

    // normalize
    for (const test of [
        {v: new Vect3({x:2,y:0,z:0}), xrslt: new Vect3({x:1,y:0,z:0})},
        {v: new Vect3({x:0,y:4,z:0}), xrslt: new Vect3({x:0,y:1,z:0})},
        {v: new Vect3({x:0,y:0,z:8.1}), xrslt: new Vect3({x:0,y:0,z:1})},
    ]) {
        it("can normalize " + test.args, ()=>{
            let rslt = Vect3.normalize(test.v);
            expect(rslt).toEqual(test.xrslt);
            rslt = test.v.normalize();
            expect(rslt).toEqual(test.xrslt);
            expect(test.v).toEqual(test.xrslt);
        })
    }

    /*
    // heading
    let headingTests = [
        {args: [new Vect(1,0)], xrslt: 0},
        {args: [new Vect(1,1)], xrslt: 45},
        {args: [new Vect(0,1)], xrslt: 90},
        {args: [new Vect(-1,1)], xrslt: 135},
        {args: [new Vect(-1,0)], xrslt: 180},
        {args: [new Vect(-1,-1)], xrslt: -135},
        {args: [new Vect(0,-1)], xrslt: -90},
        {args: [new Vect(1,-1)], xrslt: -45},
    ]
    for (const test of headingTests) {
        it("can determine heading of " + test.args, ()=>{
            v.set(...test.args);
            const rslt = v.heading();
            expect(rslt).toBe(test.xrslt);
        })
    }

    // rotate
    let rotateTests = [
        {v: new Vect(1,0), a: 90, xX: 0, xY: 1},
        {v: new Vect(1,0), a: -90, xX: 0, xY: -1},
        {v: new Vect(1,1), a: 90, xX: -1, xY: 1},
    ]
    for (const test of rotateTests) {
        it("can rotate " + test.v + " by: " + test.a, ()=>{
            v.set(test.v);
            const rslt = v.rotate(test.a);
            expect(rslt.x).toBeCloseTo(test.xX);
            expect(rslt.y).toBeCloseTo(test.xY);
        })
    }

    // angle
    let angleTests = [
        {v1: new Vect(1,0), v2: new Vect(1,1), xrslt: 45},
        {v1: new Vect(1,-1), v2: new Vect(1,1), xrslt: 90},
        {v1: new Vect(1,1), v2: new Vect(1,-1), xrslt: -90},
        {v1: new Vect(-1,1), v2: new Vect(-1,-1), xrslt: 90},
        {v1: new Vect(-1,-1), v2: new Vect(-1,1), xrslt: -90},
    ]
    for (const test of angleTests) {
        it("can compute angle between " + test.v1 + " and: " + test.v2, ()=>{
            v.set(test.v1);
            const rslt = v.angle(test.v2);
            expect(rslt).toBeCloseTo(test.xrslt);
        })
    }
    */

    // equals
    let equalsTests = [
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect({x:1,y:2})], xrslt: false},
        {v: new Vect3({x:1,y:2,z:3}), args: [new Vect3({x:1,y:2,z:3})], xrslt: true},
        {v: new Vect3({x:1,y:2,z:3}), args: [{x:1,y:2}], xrslt: false},
        {v: new Vect3({x:1,y:2,z:3}), args: [{x:1,y:2,z:3}], xrslt: true},
    ]
    for (const test of equalsTests) {
        it("can test equality to " + test.args, ()=>{
            let rslt = Vect3.equals(test.v, ...test.args);
            expect(rslt).toBe(test.xrslt);
            rslt = test.v.equals(...test.args);
            expect(rslt).toBe(test.xrslt);
        })
    }

    // reflect
    for (const test of [
        {v: new Vect3({x:1,y:0,z:1}), args: [new Vect3({x:0,y:0,z:1})], xrslt: new Vect3({x:-1,y:0,z:1})},
        {v: new Vect3({x:0,y:1,z:1}), args: [new Vect3({x:0,y:0,z:1})], xrslt: new Vect3({x:0,y:-1,z:1})},
        {v: new Vect3({x:1,y:0,z:1}), args: [new Vect3({x:0,y:0,z:-1})], xrslt: new Vect3({x:-1,y:-0,z:1})},
        {v: new Vect3({x:-1,y:0,z:1}), args: [new Vect3({x:0,y:0,z:1})], xrslt: new Vect3({x:1,y:0,z:1})},
    ]) {
        it("can test static reflection of " + test.args, ()=>{
            let rslt = Vect3.reflect(test.v, ...test.args);
            expect(rslt).toEqual(test.xrslt);
            rslt = test.v.reflect(...test.args);
            expect(rslt).toEqual(test.xrslt);
            expect(test.v).toEqual(test.xrslt);
        });
    }

})
