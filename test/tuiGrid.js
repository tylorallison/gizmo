import { Bounds } from '../js/bounds.js';
import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { GizmoContext } from '../js/gizmoContext.js';
import { UiGrid } from '../js/uiGrid.js';
import { UiView } from '../js/uiView.js';
import { UpdateSystem } from '../js/updateSystem.js';
import { XForm } from '../js/xform.js';

describe('a UI grid', () => {

    let grid, gctx, sys, receiver, tevts;
    let g1, g2, g3, g4;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
        grid = new UiGrid({gctx: gctx, alignx: 0, cols: 2, rows: 2, aligny: 0, bounds: new Bounds(0,0,128,128), xform: new XForm({fixedWidth: 64, fixedHeight: 64, grip: .5})});
        sys = new UpdateSystem( { gctx: gctx });
        receiver = ExtEvtReceiver.gen();
        tevts = [];
        EvtSystem.listen(grid, receiver, 'gizmo.updated', (evt) => tevts.push(evt));
        g1 = new UiView({gctx: gctx, tag: 'g1', xform: new XForm({ grip: .5, fixedWidth: 4, fixedHeight: 4, x: 32, y: 32})});
        g2 = new UiView({gctx: gctx, tag: 'g2', xform: new XForm({ grip: .5, fixedWidth: 4, fixedHeight: 4, x: 96, y: 32})});
        g3 = new UiView({gctx: gctx, tag: 'g3', xform: new XForm({ grip: .5, fixedWidth: 4, fixedHeight: 4, x: 32, y: 96})});
        g4 = new UiView({gctx: gctx, tag: 'g4', xform: new XForm({ grip: .5, fixedWidth: 4, fixedHeight: 4, x: 64, y: 64})});
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
            [2, [g3,g4]],
            [3, [g4]],
        ]) {
            let gzos = Array.from(grid.findAtIdx(idx, (v) => true));
            expect(gzos).toEqual(rslt);
        }
    });

    it('first gzo can be found at grid index', ()=>{
        for (const g of [g1, g2, g3, g4]) grid.add(g);
        for (const [idx, rslt] of [
            [0, g1],
            [1, g2],
            [2, g3],
            [3, g4],
        ]) {
            let gzo = grid.firstAtIdx(idx, (v) => true);
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
            let gzos = Array.from(grid.findAtPos(x, y, (v) => true));
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
            let gzo = grid.firstAtPos(x, y, (v) => true);
            expect(gzo).toEqual(rslt);
        }
    });

    it('gzos can be found at bounds', ()=>{
        for (const g of [g1, g2, g3, g4]) grid.add(g);
        for (const [bounds, rslt] of [
            [new Bounds(30,30,4,4), [g1]],
            [new Bounds(92,30,4,4), [g2]],
            [new Bounds(30,92,4,4), [g3]],
            [new Bounds(92,92,4,4), []],
            [new Bounds(62,62,4,4), [g4]],
        ]) {
            let gzos = Array.from(grid.findAtBounds(bounds, (v) => true));
            expect(gzos).toEqual(rslt);
        }
    });

    it('first gzo can be found at bounds', ()=>{
        for (const g of [g1, g2, g3, g4]) grid.add(g);
        for (const [bounds, rslt] of [
            [new Bounds(30,30,4,4), g1],
            [new Bounds(92,30,4,4), g2],
            [new Bounds(30,92,4,4), g3],
            [new Bounds(92,92,4,4), null],
            [new Bounds(62,62,4,4), g4],
        ]) {
            let gzos = grid.firstAtBounds(bounds, (v) => true);
            expect(gzos).toEqual(rslt);
        }
    });

    it('grid tracks gzo movement', ()=>{
        grid.add(g1);
        grid.add(g2);
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        tevts.splice(0);
        expect(grid.idxof(g1)).toEqual([0]);
        expect(grid.idxof(g2)).toEqual([1]);
        g1.xform.x = 96;
        g2.xform.x = 32;
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(grid.idxof(g1)).toEqual([1]);
        expect(grid.idxof(g2)).toEqual([0]);
        expect(tevts.length).toEqual(1);
    });

    it('grid tracks gzo destroy', ()=>{
        grid.add(g1);
        grid.add(g2);
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        tevts.splice(0);
        expect(grid.idxof(g1)).toEqual([0]);
        expect(grid.idxof(g2)).toEqual([1]);
        g1.destroy();
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(grid.idxof(g1)).toEqual([]);
        expect(grid.idxof(g2)).toEqual([1]);
        expect(tevts.length).toEqual(1);
    });

});