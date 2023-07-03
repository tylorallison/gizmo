import { Vect } from '../js/vect.js';

describe('2d vectors', () => {

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

    // add
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [], xv: new Vect({x:1,y:2})},
        {v: new Vect({x:1,y:2}), args: [{x:1,y:2}], xv: new Vect({x:2,y:4})},
        {v: new Vect({x:1,y:2}), args: [{x:1,y:2}, {x:2,y:1}], xv: new Vect({x:4,y:5})},
    ]) {
        it(`can add ${test.v} and ${test.args}`, ()=>{
            let rslt = Vect.add(test.v, ...test.args);
            expect(rslt).toEqual(test.xv);
            rslt = test.v.add(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // scalar add
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [], xv: new Vect({x:1, y:2})},
        {v: new Vect({x:1,y:2}), args: [5], xv: new Vect({x:6, y:7})},
        {v: new Vect({x:1,y:2}), args: [5, 7], xv: new Vect({x:13, y:14})},
    ]) {
        it('can scalar add ' + test.args, ()=>{
            let rslt = Vect.sadd(test.v, ...test.args);
            expect(rslt).toEqual(test.xv);
            rslt = test.v.sadd(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // sub
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [], xv: new Vect({x:1,y:2})},
        {v: new Vect({x:1,y:2}), args: [{x:1,y:2}], xv: new Vect({x:0,y:0})},
        {v: new Vect({x:1,y:2}), args: [{x:1,y:2}, {x:2,y:1}], xv: new Vect({x:-2,y:-1})},
    ]) {
        it(`can sub ${test.v} and ${test.args}`, ()=>{
            let rslt = Vect.sub(test.v, ...test.args);
            expect(rslt).toEqual(test.xv);
            rslt = test.v.sub(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // scalar sub
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [], xv: new Vect({x:1, y:2})},
        {v: new Vect({x:1,y:2}), args: [5], xv: new Vect({x:-4, y:-3})},
        {v: new Vect({x:1,y:2}), args: [5, 7], xv: new Vect({x:-11, y:-10})},
    ]) {
        it('can scalar sub ' + test.args, ()=>{
            let rslt = Vect.ssub(test.v, ...test.args);
            expect(rslt).toEqual(test.xv);
            rslt = test.v.ssub(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // mult
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [], xv: new Vect({x:1,y:2})},
        {v: new Vect({x:1,y:2}), args: [{x:1,y:2}], xv: new Vect({x:1,y:4})},
        {v: new Vect({x:1,y:2}), args: [{x:1,y:2}, {x:2,y:1}], xv: new Vect({x:2,y:4})},
    ]) {
        it(`can mult ${test.v} and ${test.args}`, ()=>{
            let rslt = Vect.mult(test.v, ...test.args);
            expect(rslt).toEqual(test.xv);
            rslt = test.v.mult(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // scalar mult
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [], xv: new Vect({x:1, y:2})},
        {v: new Vect({x:1,y:2}), args: [5], xv: new Vect({x:5, y:10})},
        {v: new Vect({x:1,y:2}), args: [5, 7], xv: new Vect({x:35, y:70})},
    ]) {
        it('can scalar mult ' + test.args, ()=>{
            let rslt = Vect.smult(test.v, ...test.args);
            expect(rslt).toEqual(test.xv);
            rslt = test.v.smult(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // div
    for (const test of [
        {v: new Vect({x:35,y:70}), args: [], xv: new Vect({x:35,y:70})},
        {v: new Vect({x:35,y:70}), args: [{x:1,y:2}], xv: new Vect({x:35,y:35})},
        {v: new Vect({x:35,y:70}), args: [{x:1,y:2}, {x:2,y:1}], xv: new Vect({x:17.5,y:35})},
    ]) {
        it(`can div ${test.v} and ${test.args}`, ()=>{
            let rslt = Vect.div(test.v, ...test.args);
            expect(rslt).toEqual(test.xv);
            rslt = test.v.div(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // scalar div
    for (const test of [
        {v: new Vect({x:35,y:70}), args: [], xv: new Vect({x:35, y:70})},
        {v: new Vect({x:35,y:70}), args: [5], xv: new Vect({x:7, y:14})},
        {v: new Vect({x:35,y:70}), args: [5, 7], xv: new Vect({x:1, y:2})},
    ]) {
        it('can scalar div ' + test.args, ()=>{
            let rslt = Vect.sdiv(test.v, ...test.args);
            expect(rslt).toEqual(test.xv);
            rslt = test.v.sdiv(...test.args);
            expect(rslt).toEqual(test.xv);
            expect(test.v).toEqual(test.xv);
        })
    }

    // dot
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [{x:2,y:3}], xrslt: 8},
        {v: new Vect({x:1,y:2}), args: [new Vect({x:2,y:3})], xrslt: 8},
    ]) {
        it('can dot product ' + test.args, ()=>{
            let rslt = Vect.dot(test.v, ...test.args);
            expect(rslt).toBe(test.xrslt);
            rslt = test.v.dot(...test.args);
            expect(rslt).toBe(test.xrslt);
        })
    }

    // dist
    for (const test of [
        {v: new Vect({x:1,y:2}), args: [{x:4,y:6}], xrslt: 5},
        {v: new Vect({x:1,y:2}), args: [new Vect({x:4,y:6})], xrslt: 5},
    ]) {
        it('can compute distance to ' + test.args, ()=>{
            let rslt = Vect.dist(test.v, ...test.args);
            expect(rslt).toBe(test.xrslt);
            rslt = test.v.dist(...test.args);
            expect(rslt).toBe(test.xrslt);
        })
    }

    // normalize
    for (const test of [
        {v: new Vect({x:2,y:0}), xrslt: new Vect({x:1,y:0})},
        {v: new Vect({x:0,y:2}), xrslt: new Vect({x:0,y:1})},
    ]) {
        it('can normalize ' + test.args, ()=>{
            let rslt = Vect.normalize(test.v);
            expect(rslt).toEqual(test.xrslt);
            rslt = test.v.normalize();
            expect(rslt).toEqual(test.xrslt);
            expect(test.v).toEqual(test.xrslt);
        })
    }

    // heading
    for (const test of [
        {v: new Vect({x:1,y:0}), xrslt: 0},
        {v: new Vect({x:1,y:1}), xrslt: 45},
        {v: new Vect({x:0,y:1}), xrslt: 90},
        {v: new Vect({x:-1,y:1}), xrslt: 135},
        {v: new Vect({x:-1,y:0}), xrslt: 180},
        {v: new Vect({x:-1,y:-1}), xrslt: -135},
        {v: new Vect({x:0,y:-1}), xrslt: -90},
        {v: new Vect({x:1,y:-1}), xrslt: -45},
    ]) {
        it('can determine heading of ' + test.v, ()=>{
            let rslt = Vect.heading(test.v, false);
            expect(rslt).toBe(test.xrslt);
            rslt = test.v.heading(false);
            expect(rslt).toBe(test.xrslt);
        })
    }

    // rotate
    for (const test of [
        {v: new Vect({x:1,y:0}), a: 90, xX: 0, xY: 1},
        {v: new Vect({x:1,y:0}), a: -90, xX: 0, xY: -1},
        {v: new Vect({x:1,y:1}), a: 90, xX: -1, xY: 1},
    ]) {
        it('can rotate ' + test.v + ' by: ' + test.a, ()=>{
            let rslt = Vect.rotate(test.v, test.a, false);
            expect(rslt.x).toBeCloseTo(test.xX);
            expect(rslt.y).toBeCloseTo(test.xY);
            rslt = test.v.rotate(test.a, false);
            expect(rslt.x).toBeCloseTo(test.xX);
            expect(rslt.y).toBeCloseTo(test.xY);
        })
    }

    // angle
    for (const test of [
        {v1: new Vect({x:1,y:0}), v2: new Vect({x:1,y:1}), xrslt: 45},
        {v1: new Vect({x:1,y:-1}), v2: new Vect({x:1,y:1}), xrslt: 90},
        {v1: new Vect({x:1,y:1}), v2: new Vect({x:1,y:-1}), xrslt: -90},
        {v1: new Vect({x:-1,y:1}), v2: new Vect({x:-1,y:-1}), xrslt: 90},
        {v1: new Vect({x:-1,y:-1}), v2: new Vect({x:-1,y:1}), xrslt: -90},
    ]) {
        it('can compute angle between ' + test.v1 + ' and: ' + test.v2, ()=>{
            const rslt = test.v1.angle(test.v2, false);
            expect(rslt).toBeCloseTo(test.xrslt);
        })
    }

    // equals
    for (const test of [
        {v: new Vect({x:1, y:2}), args: [new Vect({x:1,y:2})], xrslt: true},
        {v: new Vect({x:1, y:2}), args: [{x:1,y:2}], xrslt: true},
    ]) {
        it('can test equality to ' + test.args, ()=>{
            let rslt = Vect.equals(test.v, ...test.args);
            expect(rslt).toBe(test.xrslt);
            rslt = test.v.equals(...test.args);
            expect(rslt).toBe(test.xrslt);
        })
    }

    // reflect
    for (const test of [
        {v: new Vect({x:1,y:1}), args: [new Vect({x:0,y:1})], xrslt: new Vect({x:-1,y:1})},
        {v: new Vect({x:-1,y:1}), args: [new Vect({x:0,y:1})], xrslt: new Vect({x:1,y:1})},
    ]) {
        it(`can test reflection of ${test.v} with ${test.args}`, ()=>{
            let rslt = Vect.reflect(test.v, ...test.args);
            expect(rslt).toEqual(test.xrslt);
            rslt = test.v.reflect(...test.args);
            expect(rslt).toEqual(test.xrslt);
            expect(test.v).toEqual(test.xrslt);
        });
    }

})