import { Bounds } from '../js/bounds.js';
import { HexGrid } from '../js/hexgrid.js';
import { Vect } from '../js/vect.js';

describe('hexgrid implementation', () => {
    for (const test of [
        { p: new Vect({x:32-15,y:40-15}), xrslt: new Vect({x:0,y:0}) },
        { p: new Vect({x:32+15,y:40-15}), xrslt: new Vect({x:1,y:0}) },
        { p: new Vect({x:32-17,y:40}), xrslt: new Vect({x:-1,y:1}) },
        { p: new Vect({x:32+17,y:40}), xrslt: new Vect({x:1,y:1}) },
        { p: new Vect({x:32-15,y:40+15}), xrslt: new Vect({x:0,y:2}) },
        { p: new Vect({x:32+15,y:40+15}), xrslt: new Vect({x:1,y:2}) },

        { p: new Vect({x:48-15,y:64-15}), xrslt: new Vect({x:0,y:1}) },
        { p: new Vect({x:48+15,y:64-15}), xrslt: new Vect({x:1,y:1}) },
        { p: new Vect({x:48-17,y:64}), xrslt: new Vect({x:0,y:2}) },
        { p: new Vect({x:48+17,y:64}), xrslt: new Vect({x:2,y:2}) },
        { p: new Vect({x:48-15,y:64+15}), xrslt: new Vect({x:0,y:3}) },
        { p: new Vect({x:48+15,y:64+15}), xrslt: new Vect({x:1,y:3}) },

    ]) {
        it(`can find i,j from ${test.p}`, ()=>{
            let rslt = HexGrid.ijfromp(test.p, 32, 0, 0);
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
            let rslt = HexGrid.getgidx(test.b, new Bounds({x:0,y:0, width: 32*8, height: 32*8}), 32, 8, 8);
            expect(rslt).toEqual(test.xrslt);
        });
    }
});