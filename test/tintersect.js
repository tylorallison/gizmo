import { Bounds } from '../js/bounds.js';
import { Hex } from '../js/hex.js';
import { Contains, Overlaps } from '../js/intersect.js';
import { Segment } from '../js/segment.js';
import { Tri } from '../js/tri.js';
import { Vect } from '../js/vect.js';


describe('segment contains', () => {
    // segment contains
    for (const test of [
        { s: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:4, y:0})}), 
          p: new Vect({x:0,y:0}),
          inclusive: true,
          xrslt: true },
        { s: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:4, y:0})}), 
          p: new Vect({x:0,y:0}),
          inclusive: false,
          xrslt: false },
        { s: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:4, y:4})}), 
          p: new Vect({x:4,y:4}),
          inclusive: true,
          xrslt: true },
        { s: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:4, y:4})}), 
          p: new Vect({x:4,y:4}),
          inclusive: false,
          xrslt: false },
        { s: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:4, y:4})}), 
          p: new Vect({x:3,y:3}),
          inclusive: false,
          xrslt: true },
    ]) {
        it(`can test segment ${test.s} contains point ${test.p} inc:${test.inclusive}`, ()=>{
            const rslt = Contains.segment(test.s, test.p, test.inclusive);
            expect(rslt).toEqual(test.xrslt);
        });
    }
});

describe('bounds contains', () => {
    for (const test of [
        { b: new Bounds({x:0,y:0,width:2,height:2}),
          p: new Vect({x:1, y:1}),
          inclusive: true,
          xrslt: true, },
        { b: new Bounds({x:0,y:0,width:2,height:2}),
          p: new Vect({x:0, y:0}),
          inclusive: true,
          xrslt: true, },
        { b: new Bounds({x:0,y:0,width:2,height:2}),
          p: new Vect({x:0, y:0}),
          inclusive: false,
          xrslt: false, },
        { b: new Bounds({x:0,y:0,width:2,height:2}),
          p: new Vect({x:0, y:1}),
          inclusive: true,
          xrslt: true, },
        { b: new Bounds({x:0,y:0,width:2,height:2}),
          p: new Vect({x:0, y:1}),
          inclusive: false,
          xrslt: false, },
        { b: new Bounds({x:0,y:0,width:2,height:2}),
          p: new Vect({x:1, y:0}),
          inclusive: true,
          xrslt: true, },
        { b: new Bounds({x:0,y:0,width:2,height:2}),
          p: new Vect({x:1, y:0}),
          inclusive: false,
          xrslt: false, },
        { b: new Bounds({x:0,y:0,width:2,height:2}),
          p: new Vect({x:-1, y:0}),
          inclusive: true,
          xrslt: false, },
        { b: new Bounds({x:0,y:0,width:2,height:2}),
          p: new Vect({x:1, y:-1}),
          inclusive: true,
          xrslt: false, },
        { b: new Bounds({x:0,y:0,width:2,height:2}),
          p: new Vect({x:-1, y:-1}),
          inclusive: true,
          xrslt: false, },
        { b: new Bounds({x:0,y:0,width:2,height:2}),
          p: new Vect({x:3, y:3}),
          inclusive: true,
          xrslt: false, },
    ]) {
        it(`can test bounds ${test.b} contains point ${test.p}`, ()=>{
            const rslt = Contains.bounds(test.b, test.p, test.inclusive);
            expect(rslt).toEqual(test.xrslt);
        });
    }
});

describe('tri contains', () => {
    // tri contains
    for (const test of [
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:0, y:4}), p3: new Vect({x:4,y:0})}), 
          p: new Vect({x:0,y:0}), 
          inclusive: true,
          xrslt: true},
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:0, y:4}), p3: new Vect({x:4,y:0})}), 
          p: new Vect({x:0,y:4}), 
          inclusive: true,
          xrslt: true},
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:0, y:4}), p3: new Vect({x:4,y:0})}), 
          p: new Vect({x:4,y:0}), 
          inclusive: true,
          xrslt: true},
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:0, y:4}), p3: new Vect({x:4,y:0})}), 
          p: new Vect({x:4,y:4}), 
          inclusive: true,
          xrslt: false},
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:0, y:4}), p3: new Vect({x:4,y:0})}), 
          p: new Vect({x:1,y:1}), 
          inclusive: true,
          xrslt: true},
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:0, y:4}), p3: new Vect({x:4,y:0})}), 
          p: new Vect({x:0,y:0}), 
          inclusive: false,
          xrslt: false},
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:0, y:4}), p3: new Vect({x:4,y:0})}), 
          p: new Vect({x:1,y:1}), 
          inclusive: false,
          xrslt: true},
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:0, y:4}), p3: new Vect({x:4,y:0})}), 
          p: new Vect({x:1,y:0}), 
          inclusive: false,
          xrslt: false},
    ]) {
        it(`can test tri ${test.t} contains point ${test.p}`, ()=>{
            const rslt = Contains.tri(test.t, test.p, test.inclusive);
            expect(rslt).toEqual(test.xrslt);
        })
    }

});

describe('segment overlap', () => {

    // segment overlaps
    for (const test of [
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:4, y:0})}), 
          s2: new Segment({p1: new Vect({x:2,y:2}), p2: new Vect({x:2, y:-2})}), 
          xrslt: true, },
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:4, y:0})}), 
          s2: new Segment({p1: new Vect({x:4,y:2}), p2: new Vect({x:4, y:-2})}), 
          xrslt: true, },
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:4, y:0})}), 
          s2: new Segment({p1: new Vect({x:0,y:2}), p2: new Vect({x:0, y:-2})}), 
          xrslt: true, },
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:4, y:0})}), 
          s2: new Segment({p1: new Vect({x:-1,y:2}), p2: new Vect({x:-1, y:-2})}), 
          xrslt: false, },
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:4, y:0})}), 
          s2: new Segment({p1: new Vect({x:5,y:2}), p2: new Vect({x:5, y:-2})}), 
          xrslt: false, },
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:1, y:0})}), 
          s2: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:1, y:1})}), 
          xrslt: true, },
        { s1: new Segment({p1: new Vect({x:1,y:0}), p2: new Vect({x:2, y:1})}), 
          s2: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:1, y:1})}), 
          xrslt: false, },
        { s1: new Segment({p1: new Vect({x:0,y:1}), p2: new Vect({x:1, y:0})}), 
          s2: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:1, y:1})}), 
          xrslt: true, },
        // -- colinear
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2})}), 
          s2: new Segment({p1: new Vect({x:-2,y:-2}), p2: new Vect({x:-1, y:-1})}), 
          xrslt: false, },
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2})}), 
          s2: new Segment({p1: new Vect({x:-1,y:-1}), p2: new Vect({x:0, y:0})}), 
          xrslt: true, },
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2})}), 
          s2: new Segment({p1: new Vect({x:-1,y:-1}), p2: new Vect({x:1, y:1})}), 
          xrslt: true, },
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2})}), 
          s2: new Segment({p1: new Vect({x:.5,y:.5}), p2: new Vect({x:1, y:1})}), 
          xrslt: true},
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2})}), 
          s2: new Segment({p1: new Vect({x:1,y:1}), p2: new Vect({x:3, y:3})}), 
          xrslt: true, },
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2})}), 
          s2: new Segment({p1: new Vect({x:2,y:2}), p2: new Vect({x:3, y:3})}), 
          xrslt: true, },
        { s1: new Segment({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2})}), 
          s2: new Segment({p1: new Vect({x:3,y:3}), p2: new Vect({x:4, y:4})}), 
          xrslt: false, },
    ]) {
        it(`can test overlap of segments ${test.s1} and ${test.s2}`, ()=>{
            const rslt = Overlaps.segments(test.s1, test.s2);
            expect(rslt).toEqual(test.xrslt);
        })
    }
});

describe('tri overlap', () => {
    // tri overlaps
    for (const test of [
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:1,y:0}), p2: new Vect({x:3, y:2}), p3: new Vect({x:5, y:0})}), 
          inclusive: true,
          xrslt: true, },
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:5,y:0}), p2: new Vect({x:7, y:2}), p3: new Vect({x:9, y:0})}), 
          inclusive: true,
          xrslt: false, },
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:-3,y:1}), p2: new Vect({x:-1, y:3}), p3: new Vect({x:1, y:1})}), 
          inclusive: true,
          xrslt: true, },
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:-3,y:1}), p2: new Vect({x:-1, y:3}), p3: new Vect({x:.5, y:1})}), 
          inclusive: true,
          xrslt: false, },
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:3,y:1}), p2: new Vect({x:5, y:3}), p3: new Vect({x:7, y:1})}), 
          inclusive: false,
          xrslt: false, },
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:3,y:1}), p2: new Vect({x:5, y:3}), p3: new Vect({x:7, y:1})}), 
          inclusive: true,
          xrslt: true, },
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:3.5,y:1}), p2: new Vect({x:5, y:3}), p3: new Vect({x:7, y:1})}), 
          inclusive: true,
          xrslt: false, },
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:0,y:-2}), p2: new Vect({x:2, y:0}), p3: new Vect({x:4, y:-2})}), 
          inclusive: true,
          xrslt: true, },
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:0,y:-2}), p2: new Vect({x:2, y:0}), p3: new Vect({x:4, y:-2})}), 
          inclusive: false,
          xrslt: false, },
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:1,y:1}), p2: new Vect({x:2, y:1}), p3: new Vect({x:3, y:1})}), 
          inclusive: true,
          xrslt: true, },
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:-1,y:-1}), p2: new Vect({x:2, y:3}), p3: new Vect({x:5, y:-1})}), 
          inclusive: true,
          xrslt: true, },
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:4,y:0}), p2: new Vect({x:6, y:2}), p3: new Vect({x:8, y:0})}), 
          inclusive: true,
          xrslt: true, },
        { t1: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          t2: new Tri({p1: new Vect({x:4,y:0}), p2: new Vect({x:6, y:2}), p3: new Vect({x:8, y:0})}), 
          inclusive: false,
          xrslt: false, },
    ]) {
        it(`can test overlap of tris ${test.t1} and ${test.t2}`, ()=>{
            const rslt = Overlaps.tris(test.t1, test.t2, test.inclusive);
            expect(rslt).toEqual(test.xrslt);
        })
    }
});

describe('tri/bounds overlap', () => {
    // tri/bounds overlaps
    for (const test of [
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          b: new Bounds({x:0,y:0,width:2,height:2}),
          inclusive: true,
          xrslt: true, },
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          b: new Bounds({x:-1,y:1,width:2,height:2}),
          inclusive: true,
          xrslt: true, },
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          b: new Bounds({x:-1,y:1,width:2,height:2}),
          inclusive: false,
          xrslt: false, },
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          b: new Bounds({x:3,y:1,width:2,height:2}),
          inclusive: true,
          xrslt: true, },
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          b: new Bounds({x:3,y:1,width:2,height:2}),
          inclusive: false,
          xrslt: false, },
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          b: new Bounds({x:1,y:-2,width:2,height:2}),
          inclusive: true,
          xrslt: true, },
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          b: new Bounds({x:1,y:-2,width:2,height:2}),
          inclusive: false,
          xrslt: false, },
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:6}), p3: new Vect({x:4, y:0})}), 
          b: new Bounds({x:0,y:2,width:4,height:1}),
          inclusive: true,
          xrslt: true, },
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          b: new Bounds({x:-1,y:-1,width:6,height:4}),
          inclusive: true,
          xrslt: true, },
        { t: new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y:2}), p3: new Vect({x:4, y:0})}), 
          b: new Bounds({x:1.5,y:.5,width:1,height:.5}),
          inclusive: true,
          xrslt: true, },
    ]) {
        it(`can test overlap of tri ${test.t} and bounds ${test.b}`, ()=>{
            const rslt = Overlaps.triBounds(test.t, test.b, test.inclusive);
            expect(rslt).toEqual(test.xrslt);
        })
    }
});

describe('hex overlap', () => {

    // hex overlaps
    for (const test of [
        { h1: new Hex({p: new Vect({x:16,y:16}), size: 32 }),
          h2: new Hex({p: new Vect({x:48,y:16}), size: 32 }),
          inclusive: true,
          xrslt: true, },
        { h1: new Hex({p: new Vect({x:16,y:16}), size: 32 }),
          h2: new Hex({p: new Vect({x:48,y:16}), size: 32 }),
          inclusive: false,
          xrslt: false, },
        { h1: new Hex({p: new Vect({x:16,y:16}), size: 32 }),
          h2: new Hex({p: new Vect({x:16,y:48}), size: 32 }),
          inclusive: true,
          xrslt: true, },
        { h1: new Hex({p: new Vect({x:16,y:16}), size: 32 }),
          h2: new Hex({p: new Vect({x:16,y:46}), size: 32 }),
          inclusive: false,
          xrslt: true, },
    ]) {
        it(`can test overlap of hex ${test.h1} and hex ${test.h2}`, ()=>{
            const rslt = Overlaps.hexs(test.h1, test.h2, test.inclusive);
            expect(rslt).toEqual(test.xrslt);
        })
    }

});