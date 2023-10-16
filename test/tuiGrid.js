import { Bounds } from '../js/bounds.js';
import { Evts } from '../js/evt.js';
import { Fmt } from '../js/fmt.js';
import { Gizmo } from '../js/gizmo.js';
import { UiGrid } from '../js/uiGrid.js';
import { UiView } from '../js/uiView.js';
import { UpdateSystem } from '../js/updateSystem.js';
import { XForm } from '../js/xform.js';

describe('a UI grid override functions', () => {
    class tgzo extends Gizmo {
        static { this.schema('xform', { link: true }); }
    }

    for (const test of [
        { 
            grid: new UiGrid({cols: 4, rows: 4, xform: new XForm({fixedWidth: 100, fixedHeight: 100, grip: .5, orig: .5})}),
            point: {x:0,y:0},
            ij: {x:2,y:2},
            idx: 10,
            gzo: new tgzo({ xform: new XForm({ orig: 0, fixedWidth: 4, fixedHeight: 4, x: 0, y: 0})}),
        },
        { 
            grid: new UiGrid({cols: 4, rows: 4, xform: new XForm({fixedWidth: 100, fixedHeight: 100, grip: .5, orig: .5})}),
            point: {x:-50,y:-50},
            ij: {x:0,y:0},
            idx: 0,
            gzo: new tgzo({ xform: new XForm({ orig: 0, fixedWidth: 4, fixedHeight: 4, x: -50, y: -50})}),
        },
        { 
            grid: new UiGrid({cols: 4, rows: 4, xform: new XForm({fixedWidth: 100, fixedHeight: 100, grip: .5, orig: .5})}),
            point: {x:25,y:25},
            ij: {x:3,y:3},
            idx: 15,
            gzo: new tgzo({ xform: new XForm({ orig: 0, fixedWidth: 4, fixedHeight: 4, x: 25, y: 25})}),
        },
        { 
            grid: new UiGrid({cols: 4, rows: 4, xform: new XForm({fixedWidth: 100, fixedHeight: 100, grip: .5, orig: 0})}),
            point: {x:0,y:0},
            ij: {x:0,y:0},
            idx: 0,
            gzo: new tgzo({ xform: new XForm({ orig: 0, fixedWidth: 4, fixedHeight: 4, x: 0, y: 0})}),
        },
    ]) {
        it(`ij from point ${test.point} with grid: ${test.grid.xform}`, ()=>{
            let rslt = test.grid.ijFromPoint(test.point);
            expect(rslt).toEqual(test.ij);
        });
        it(`ij from idx ${test.idx} with grid: ${test.grid.xform}`, ()=>{
            let rslt = test.grid.ijFromIdx(test.idx);
            expect(rslt).toEqual(test.ij);
        });
        it(`idx from point ${test.point} with grid: ${test.grid.xform}`, ()=>{
            let rslt = test.grid.idxFromPoint(test.point);
            expect(rslt).toEqual(test.idx);
        });
        it(`idx from ij ${test.ij} with grid: ${test.grid.xform}`, ()=>{
            let rslt = test.grid.idxFromIJ(test.ij);
            expect(rslt).toEqual(test.idx);
        });
        it(`point from idx ${test.idx} with grid: ${test.grid.xform}`, ()=>{
            let rslt = test.grid.pointFromIdx(test.idx);
            expect(rslt).toEqual(test.point);
        });
        it(`point from ij ${test.ij} with grid: ${test.grid.xform}`, ()=>{
            let rslt = test.grid.pointFromIJ(test.ij);
            expect(rslt).toEqual(test.point);
        });
        it(`idxs from gzo ${test.gzo.xform} with grid: ${test.grid.xform}`, ()=>{
            let rslt = test.grid.idxsFromGzo(test.gzo);
            expect(rslt.length).toEqual(1);
            expect(rslt[0]).toEqual(test.idx);
        });
    };

});

describe('a UI grid', () => {

    let grid, sys, tevts;
    let g1, g2, g3, g4;
    beforeEach(() => {
        grid = new UiGrid({cols: 2, rows: 2, xform: new XForm({orig: 0, fixedWidth: 128, fixedHeight: 128, grip: .5})});
        sys = new UpdateSystem( { dbg: false });
        tevts = [];
        Evts.listen(grid, 'GizmoUpdated', (evt) => {
            //console.log(`-- received evt: ${Fmt.ofmt(evt)}`);
            tevts.push(evt);
        });
        g1 = new UiView({tag: 'g1', xform: new XForm({ left: 0, right: 1, top: 0, bottom: 1, fixedWidth: 4, fixedHeight: 4, x: 32, y: 32})});
        g2 = new UiView({tag: 'g2', xform: new XForm({ left: 0, right: 1, top: 0, bottom: 1, fixedWidth: 4, fixedHeight: 4, x: 96, y: 32})});
        g3 = new UiView({tag: 'g3', xform: new XForm({ left: 0, right: 1, top: 0, bottom: 1, fixedWidth: 4, fixedHeight: 4, x: 32, y: 96})});
        g4 = new UiView({tag: 'g4', xform: new XForm({ left: 0, right: 1, top: 0, bottom: 1, fixedWidth: 4, fixedHeight: 4, x: 64, y: 64})});
    });
    afterEach(() => {
        Evts.clear();
    });

    it('gzos can be iterating from grid', ()=>{
        for (const g of [g1, g2, g3, g4]) grid.add(g);
        let gs = Array.from(grid);
        expect(gs).toEqual([g1,g4,g2,g3]);
    });

    it('gzo can be found across grid', ()=>{
        for (const g of [g1, g2, g3, g4]) grid.add(g);
        for (const tag of ['g1', 'g2', 'g3', 'g4']) {
            let gzos = Array.from(grid.find((v) => v.tag === tag));
            expect(gzos.length).toEqual(1);
            expect(gzos[0].tag).toEqual(tag);
        }
    });

    it('first gzo can be found across grid', ()=>{
        for (const g of [g1, g2, g3, g4]) grid.add(g);
        for (const tag of ['g1', 'g2', 'g3', 'g4']) {
            let gzo = grid.first((v) => v.tag === tag);
            expect(gzo.tag).toEqual(tag);
        }
    });

    it('gzos can be found at grid index', ()=>{
        for (const g of [g1, g2, g3, g4]) grid.add(g);
        for (const [idx, rslt] of [
            [0, [g1,g4]],
            [1, [g2,g4]],
            [2, [g4,g3]],
            [3, [g4]],
        ]) {
            let gzos = Array.from(grid.findForIdx(idx, (v) => true));
            expect(gzos).toEqual(rslt);
        }
    });

    it('first gzo can be found at grid index', ()=>{
        for (const g of [g1, g2, g3, g4]) grid.add(g);
        for (const [idx, rslt] of [
            [0, g1],
            [1, g2],
            [2, g4],
            [3, g4],
        ]) {
            let gzo = grid.firstForIdx(idx, (v) => true);
            expect(gzo).toEqual(rslt);
        }
    });

    it('gzos can be found at position', ()=>{
        for (const g of [g1, g2, g3, g4]) grid.add(g);
        for (const [x, y, rslt] of [
            [32, 32, [g1]],
            [96, 32, [g2]],
            [32, 96, [g3]],
            [96, 96, []],
            [64, 64, [g4]],
        ]) {
            let gzos = Array.from(grid._findForPoint(x, y, (v) => true));
            expect(gzos).toEqual(rslt);
        }
    });

    it('first gzo can be found at position', ()=>{
        for (const g of [g1, g2, g3, g4]) grid.add(g);
        for (const [x, y, rslt] of [
            [32, 32, g1],
            [96, 32, g2],
            [32, 96, g3],
            [96, 96, null],
            [64, 64, g4],
        ]) {
            let gzo = grid._firstForPoint(x, y, (v) => true);
            expect(gzo).toEqual(rslt);
        }
    });

    it('gzos can be found at bounds', ()=>{
        for (const g of [g1, g2, g3, g4]) grid.add(g);
        for (const [bounds, rslt] of [
            [new Bounds({x:30,y:30,width:4,height:4}), [g1]],
            [new Bounds({x:92,y:30,width:4,height:4}), [g2]],
            [new Bounds({x:30,y:92,width:4,height:4}), [g3]],
            [new Bounds({x:92,y:92,width:4,height:4}), []],
            [new Bounds({x:62,y:62,width:4,height:4}), [g4]],
        ]) {
            let gzos = Array.from(grid.findForBounds(bounds, (v) => true));
            expect(gzos).toEqual(rslt);
        }
    });

    it('first gzo can be found at bounds', ()=>{
        for (const g of [g1, g2, g3, g4]) grid.add(g);
        for (const [bounds, rslt] of [
            [new Bounds({x:30,y:30,width:4,height:4}), g1],
            [new Bounds({x:92,y:30,width:4,height:4}), g2],
            [new Bounds({x:30,y:92,width:4,height:4}), g3],
            [new Bounds({x:92,y:92,width:4,height:4}), null],
            [new Bounds({x:62,y:62,width:4,height:4}), g4],
        ]) {
            let gzos = grid.firstForBounds(bounds, (v) => true);
            expect(gzos).toEqual(rslt);
        }
    });

    it('grid tracks gzo movement', ()=>{
        grid.add(g1);
        grid.add(g2);
        //console.log(`-- before game tock 1`);
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        tevts.splice(0);
        expect(grid.idxof(g1)).toEqual([0]);
        expect(grid.idxof(g2)).toEqual([1]);
        g1.xform.x = 96;
        g2.xform.x = 32;
        //console.log(`-- before game tock 2`);
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        //console.log(`-- before game tock 3`);
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        expect(grid.idxof(g1)).toEqual([1]);
        expect(grid.idxof(g2)).toEqual([0]);
        expect(tevts.length).toEqual(2);
    });

    it('grid tracks gzo destroy', ()=>{
        grid.add(g1);
        grid.add(g2);
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        tevts.splice(0);
        expect(grid.idxof(g1)).toEqual([0]);
        expect(grid.idxof(g2)).toEqual([1]);
        g1.destroy();
        Evts.trigger(null, 'GameTock', { elapsed: 100 });
        expect(grid.idxof(g1)).toEqual([]);
        expect(grid.idxof(g2)).toEqual([1]);
        expect(tevts.length).toEqual(1);
    });

});
