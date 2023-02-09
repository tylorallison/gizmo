import { Bounds } from "../js/bounds.js";
import { Vect } from "../js/vect.js";

describe("a bounds", () => {
    let b;
    beforeEach(() => {
        b = new Bounds(0, 0, 2, 4);
    });

    it("has min property", ()=>{
        const rslt = b.pos;
        expect(rslt.x).toBe(0);
        expect(rslt.y).toBe(0);
    });

    // intersects
    let intersectTests = [
        {args: [0, 0, 2, 2, 1, 1, 3, 3], xrslt: new Bounds(1,1,1,1)},
        {args: [0, 0, 2, 2, -1, -1, 1, 1], xrslt: new Bounds(0,0,1,1)},
        {args: [0, 0, 2, 2, 3, 3, 5, 5], xrslt: false},
        {args: [0, 0, 2, 2, 0, 0, 2, 2], xrslt: new Bounds(0,0,2,2)},
        {args: [0, 0, 2, 2, 1, 1, 1, 1], xrslt: false},
        {args: [0, 0, 2, 2, 1, 1, 1, 1, true], xrslt: new Bounds(1,1,0,0)},
    ]
    for (const test of intersectTests) {
        it("can check intersects " + test.args, ()=>{
            const rslt = Bounds._intersects(...test.args);
            expect(rslt).toEqual(test.xrslt);
        });
        it("can check bounds intersects " + test.args, ()=>{
            let b1 = new Bounds(test.args[0],test.args[1],test.args[2]-test.args[0],test.args[3]-test.args[1]);
            let b2 = new Bounds(test.args[4],test.args[5],test.args[6]-test.args[4],test.args[7]-test.args[5]);
            const rslt = Bounds.intersects(b1, b2, test.args[8]);
            expect(rslt).toEqual(test.xrslt);
        });
        it("can check bounds method intersects " + test.args, ()=>{
            let b1 = new Bounds(test.args[0],test.args[1],test.args[2]-test.args[0],test.args[3]-test.args[1]);
            let b2 = new Bounds(test.args[4],test.args[5],test.args[6]-test.args[4],test.args[7]-test.args[5]);
            const rslt = b1.intersects(b2, test.args[8]);
            expect(rslt).toEqual(test.xrslt);
        });
    }

    // overlaps
    for (const test of intersectTests) {
        it("can check overlaps " + test.args, ()=>{
            const rslt = Bounds._overlaps(...test.args);
            expect(rslt).toBe((test.xrslt) ? true : false);
        });
        it("can check bounds overlaps " + test.args, ()=>{
            let b1 = new Bounds(test.args[0],test.args[1],test.args[2]-test.args[0],test.args[3]-test.args[1]);
            let b2 = new Bounds(test.args[4],test.args[5],test.args[6]-test.args[4],test.args[7]-test.args[5]);
            const rslt = Bounds.overlaps(b1, b2, test.args[8]);
            expect(rslt).toBe((test.xrslt) ? true : false);
        });
        it("can check bounds method overlaps " + test.args, ()=>{
            let b1 = new Bounds(test.args[0],test.args[1],test.args[2]-test.args[0],test.args[3]-test.args[1]);
            let b2 = new Bounds(test.args[4],test.args[5],test.args[6]-test.args[4],test.args[7]-test.args[5]);
            const rslt = b1.overlaps(b2, test.args[8]);
            expect(rslt).toBe((test.xrslt) ? true : false);
        });

    }

    // contains
    let containsTests = [
        {args: [0, 0, 2, 2, 1, 1], xrslt: true},
        {args: [0, 0, 2, 2, 0, 0], xrslt: false},
        {args: [0, 0, 2, 2, 0, 0, true], xrslt: true},
        {args: [0, 0, 2, 2, 0, 1], xrslt: false},
        {args: [0, 0, 2, 2, 0, 1, true], xrslt: true},
        {args: [0, 0, 2, 2, 1, 0], xrslt: false},
        {args: [0, 0, 2, 2, 1, 0, true], xrslt: true},
        {args: [0, 0, 2, 2, 1, 1], xrslt: true},
        {args: [0, 0, 2, 2, -1, 1], xrslt: false},
        {args: [0, 0, 2, 2, 1, -1], xrslt: false},
        {args: [0, 0, 2, 2, -1, -1], xrslt: false},
        {args: [0, 0, 2, 2, 3, 3], xrslt: false},
    ]
    for (const test of containsTests) {
        it("can check contains " + test.args, ()=>{
            const rslt = Bounds._contains(...test.args);
            expect(rslt).toBe(test.xrslt);
        });
        it("can check bounds contains vect" + test.args, ()=>{
            let b1 = new Bounds(test.args[0],test.args[1],test.args[2]-test.args[0],test.args[3]-test.args[1]);
            let p = new Vect(test.args[4], test.args[5]);
            const rslt = Bounds.contains(b1, p, test.args[6]);
            expect(rslt).toBe(test.xrslt);
        });
        it("can check bounds contains point" + test.args, ()=>{
            let b1 = new Bounds(test.args[0],test.args[1],test.args[2]-test.args[0],test.args[3]-test.args[1]);
            const rslt = Bounds.containsXY(b1, test.args[4], test.args[5], test.args[6]);
            expect(rslt).toBe(test.xrslt);
        });

    }

    // extends
    let extendTests = [
        {orig: new Bounds(1,1, 1, 1), other: new Bounds(1,1, 1, 1), xrslt: new Bounds(1,1, 1, 1)},
        {orig: new Bounds(159,103, 32, 46), other: new Bounds(160,103, 32, 46), xrslt: new Bounds(159,103, 33, 46)},
    ]
    for (const test of extendTests) {
        it("can extend with " + test.other, ()=>{
            const rslt = test.orig.extend(test.other);
            expect(rslt).toEqual(test.xrslt);
        });
    }

});