import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { Fmt } from '../js/fmt.js';
import { Gizmo } from '../js/gizmo.js';
import { Hierarchy } from '../js/hierarchy.js';
import { XForm } from '../js/xform.js';
import { Vect } from '../js/vect.js';
import { Schema } from '../js/schema.js';

class TXFormRoot extends Gizmo {
    static {
        Schema.apply(this, 'xform', { link: true });
    }
}

describe('xforms', () => {

    let root, receiver, tevts;
    beforeEach(() => {
        root = new TXFormRoot({ xform: new XForm()});
        receiver = ExtEvtReceiver.gen();
        tevts = [];
        EvtSystem.listen(root, receiver, 'gizmo.set', (evt) => tevts.push(evt));
    });

    it('updates triggered to bound gizmo', ()=>{
        root.xform.gripOffsetLeft = 5;
        expect(tevts.length).toEqual(2);
        let tevt = tevts.pop() || {};
        expect(tevt.tag).toEqual('gizmo.set'); 
        expect(tevt.actor).toEqual(root); 
        expect(tevt.set).toEqual( { 'xform.gripOffsetLeft':  5 } );
    });

    it('gizmo cleared from xform on gizmo destroy', ()=>{
        let x = root.xform;
        expect(x.$trunk).toBe(root);
        root.destroy();
        expect(x.$trunk).toBe(null);
    });

    it('data can be set on init', ()=>{
        let x = new XForm({ left: .1, right: .2 });
        expect(x.left).toEqual(.1);
        expect(x.right).toEqual(.2);
    });

    for (const test of [
        { d: 'root xform has valid properties', specs: [{fixedWidth: 100, fixedHeight: 200}], 
          xrslt: {minx: -50, maxx: 50, miny: -100, maxy: 100, width: 100, height: 200, deltax: 0, deltay: 0}},
        { d: 'root xform has valid properties - tl origin', specs: [{origx: 0, origy: 0, fixedWidth: 100, fixedHeight: 200}], 
          xrslt: {minx: -0, maxx: 100, miny: -0, maxy: 200, width: 100, height: 200, deltax: 0, deltay: 0}},
        { d: 'root xform has valid properties - br origin', specs: [{origx: 1, origy: 1, x: 100, y: 200, fixedWidth: 100, fixedHeight: 200}], 
          xrslt: {minx: -100, maxx: 0, miny: -200, maxy: 0, width: 100, height: 200, deltax: 100, deltay: 200}},
        { d: 'default child has same dimensions as parent', specs: [{fixedWidth: 100, fixedHeight: 200, x: 50, y: 100}, {}], 
          xrslt: {minx: -50, maxx: 50, miny: -100, maxy: 100, width: 100, height: 200, deltax: 0, deltay: 0}},
          // FIXME
        /*
        { d: 'stretched child mid origin', specs: [{fixedWidth: 100, fixedHeight: 200, x: 50, y: 100}, {grip:0}], 
          xrslt: {minx: -50, maxx: 50, miny: -100, maxy: 100, width: 100, height: 200, deltax: 0, deltay: 0}},
        { d: 'stretched child tl origin', specs: [{fixedWidth: 100, fixedHeight: 200, x: 50, y: 100}, {grip:0, origx: 0, origy:0}], 
          xrslt: {minx: 0, maxx: 100, miny: 0, maxy: 200, width: 100, height: 200, deltax: -50, deltay: -100}},
        { d: 'stretched child br origin', specs: [{fixedWidth: 100, fixedHeight: 200, x: 50, y: 100}, {grip:0, origx: 1, origy:1}], 
          xrslt: {minx: -100, maxx: 0, miny: -200, maxy: 0, width: 100, height: 200, deltax: 50, deltay: 100}},
          */
    ]) {
        it(test.d, ()=>{
            let parent, node;
            for (const spec of test.specs) {
                node = new TXFormRoot({xform: new XForm(spec)});
                if (!parent) {
                    parent = node;
                } else {
                    Hierarchy.adopt(parent, node);
                    parent = node;
                }
            }
            for (const [k,v] of Object.entries(test.xrslt)) {
                expect(node.xform[k]).toEqual(v);
            }
        });
    }

    for (const test of [
        { origx: .5, origy: .5, scalex: 1, scaley: 1, angle: 0, wp: new Vect(0,0), xlp: new Vect(-50,-50) },
        { origx: .5, origy: .5, scalex: 1, scaley: 1, angle: 0, wp: new Vect(50,50), xlp: new Vect(0,0) },
        { origx: .5, origy: .5, scalex: 1, scaley: 1, angle: 0, wp: new Vect(100,100), xlp: new Vect(50,50) },
        { origx: .5, origy: .5, scalex: 2, scaley: 1, angle: 0, wp: new Vect(50,50), xlp: new Vect(0,0) },
        { origx: .5, origy: .5, scalex: 2, scaley: 1, angle: 0, wp: new Vect(0,0), xlp: new Vect(-25,-50) },
        { origx: .5, origy: .5, scalex: 2, scaley: 1, angle: 0, wp: new Vect(100,100), xlp: new Vect(25,50) },
        { origx: 0, origy: .5, scalex: 2, scaley: 1, angle: 0, wp: new Vect(100,100), xlp: new Vect(50,50) },
        { origx: .5, origy: .5, scalex: 1, scaley: 1, angle: Math.PI/2, wp: new Vect(50,50), xlp: new Vect(0,0) },
        { origx: .5, origy: .5, scalex: 1, scaley: 1, angle: Math.PI/2, wp: new Vect(0,0), xlp: new Vect(-50,50) },
        { origx: .5, origy: .5, scalex: 1, scaley: 1, angle: Math.PI/2, wp: new Vect(100,100), xlp: new Vect(50,-50) },
    ]) {
        let desc = `world to local to world translations: ${Fmt.ofmt(test)}`;
        it(desc, ()=>{
            let pg = new TXFormRoot({xform: new XForm({ fixedWidth: 100, fixedHeight: 100, x: 50, y: 50, origx: .5, origy: .5}) });
            let cg = new TXFormRoot({xform: new XForm({ grip: 0, origx: test.origx, origy: test.origy, scalex: test.scalex, scaley: test.scaley, angle: test.angle}) });
            let cxf = cg.xform;
            Hierarchy.adopt(pg, cg);
            let lp = cxf.getLocal(test.wp);
            // workaround strange issue w/ jasmine treating -0 !== 0 which doesn't align w/ the rest of javascript
            if (Object.is(lp.x, -0)) lp.x = 0;
            if (Object.is(lp.y, -0)) lp.y = 0;
            expect(lp).toEqual(test.xlp)
            let nwp = cxf.getWorld(lp);
            // workaround strange issue w/ jasmine treating -0 !== 0 which doesn't align w/ the rest of javascript
            if (Object.is(nwp.x, -0)) nwp.x = 0;
            if (Object.is(nwp.y, -0)) nwp.y = 0;
            expect(nwp).toEqual(test.wp)
        });
    }

});