import { Bounds } from '../js/bounds.js';
import { Fmt } from '../js/fmt.js';
import { HexGrid } from '../js/hexgrid.js';
import { Vect } from '../js/vect.js';

describe('hexgrid implementation', () => {
    for (const test of [
        { p: {x:32-15,y:40-15}, xrslt: {x:0,y:0} },
        { p: {x:32+15,y:40-15}, xrslt: {x:1,y:0} },
        { p: {x:32-17,y:40}, xrslt: {x:0,y:1} },
        { p: {x:32+17,y:40}, xrslt: {x:1,y:1} },
        { p: {x:32-15,y:40+15}, xrslt: {x:0,y:2} },
        { p: {x:32+15,y:40+15}, xrslt: {x:1,y:2} },

        { p: {x:48-15,y:64-15}, xrslt: {x:0,y:1} },
        { p: {x:48+15,y:64-15}, xrslt: {x:1,y:1} },
        { p: {x:48-17,y:64}, xrslt: {x:0,y:2} },
        { p: {x:48+17,y:64}, xrslt: {x:2,y:2} },
        { p: {x:48-15,y:64+15}, xrslt: {x:0,y:3} },
        { p: {x:48+15,y:64+15}, xrslt: {x:1,y:3} },

    ]) {
        it(`can find i,j from ${Fmt.ofmt(test.p)}`, ()=>{
            let rslt = HexGrid.ijFromPoint(test.p, {x:8, y:8}, {x:32, y:24});
            expect(rslt).toEqual(test.xrslt);
        });
    }

    for (const test of [
        { i:0, j:0, center:false, xrslt:{x:0,y:0} },
        { i:0, j:0, center:true, xrslt:{x:16,y:16} },
        { i:1, j:0, center:false, xrslt:{x:32,y:0} },
        { i:1, j:0, center:true, xrslt:{x:48,y:16} },
        { i:1, j:1, center:false, xrslt:{x:48,y:24} },
        { i:1, j:1, center:true, xrslt:{x:64,y:40} },
    ]) {
        it(`can find point from ${test.i},${test.j} c:${test.center}`, ()=>{
            let rslt = HexGrid.pointFromIJ({x:test.i,y:test.j}, {x:8, y:8}, {x:32, y:24}, test.center);
            expect(rslt).toEqual(test.xrslt);
        });
    }

    for (const test of [
        { b: new Bounds({x:16,y:24, width: 64, height: 32}), xrslt: [0, 1, 2, 8, 9, 16, 17, 18] },
        { b: new Bounds({x:16+2,y:24+2, width: 2, height: 2}), xrslt: [0] },
        { b: new Bounds({x:16+12,y:24+4, width: 2, height: 2}), xrslt: [8] },
        { b: new Bounds({x:48-4,y:24+2, width: 2, height: 2}), xrslt: [1] },
        { b: new Bounds({x:34,y:28, width: 2, height: 2}), xrslt: [8] },
        { b: new Bounds({x:17,y:52, width: 2, height: 2}), xrslt: [16] },
        { b: new Bounds({x:27,y:49, width: 2, height: 2}), xrslt: [8] },
        { b: new Bounds({x:34,y:49, width: 2, height: 2}), xrslt: [8] },
        { b: new Bounds({x:44,y:52, width: 2, height: 2}), xrslt: [17] },
        { b: new Bounds({x:0,y:0, width: 64, height: 32}), xrslt: [0, 1, 8, 9] },
        { b: new Bounds({x:0,y:8, width: 16, height: 8}), xrslt: [0] },
    ]) {
        it(`can find idx for bounds ${test.b}`, ()=>{
            let rslt = HexGrid.idxsFromBounds(test.b, {x:8, y:8}, {x:32, y:24});
            expect(rslt).toEqual(test.xrslt);
        });
    }
});