import { Bounds } from '../js/bounds.js';
import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { Fmt } from '../js/fmt.js';
import { GizmoContext } from '../js/gizmo.js';
import { Helpers } from '../js/helpers.js';
import { UiGrid } from '../js/uiGrid.js';
import { UiView } from '../js/uiView.js';
import { UpdateSystem } from '../js/updateSystem.js';
import { XForm } from '../js/xform.js';

describe('a UI grid', () => {

    let grid, gctx, sys, receiver, tevts;
    let g1, g2, g3, g4;
    beforeEach(() => {
        gctx = new GizmoContext({tag: 'test'});
        grid = new UiGrid({gctx: gctx, alignx: 0, cols: 2, rows: 2, aligny: 0, xform: new XForm({fixedWidth: 128, fixedHeight: 128, grip: .5})});
        sys = new UpdateSystem( { gctx: gctx, dbg: false });
        receiver = Helpers.genEvtReceiver();
        tevts = [];
        EvtSystem.listen(grid, receiver, 'gizmo.updated', (evt) => {
            //console.log(`-- received evt: ${Fmt.ofmt(evt)}`);
            tevts.push(evt);
        });
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
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        tevts.splice(0);
        expect(grid.idxof(g1)).toEqual([0]);
        expect(grid.idxof(g2)).toEqual([1]);
        g1.xform.x = 96;
        g2.xform.x = 32;
        //console.log(`-- before game tock 2`);
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        //console.log(`-- before game tock 3`);
        EvtSystem.trigger(gctx, 'game.tock', { deltaTime: 100 });
        expect(grid.idxof(g1)).toEqual([1]);
        expect(grid.idxof(g2)).toEqual([0]);
        expect(tevts.length).toEqual(2);
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
