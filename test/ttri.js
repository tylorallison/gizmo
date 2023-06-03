import { Tri } from '../js/tri.js';
import { Vect } from '../js/vect.js';

describe('a triangle', () => {

    it('a tri has edge properties', ()=>{
        let t = new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y: 2}), p3: new Vect({x:4, y:0})});
        expect(t.edge1).toEqual({p1: {x:0, y:0}, p2: {x:2, y:2}});
        expect(t.edge2).toEqual({p1: {x:2, y:2}, p2: {x:4, y:0}});
        expect(t.edge3).toEqual({p1: {x:4, y:0}, p2: {x:0, y:0}});
    });

    it('a tri has min/max properties', ()=>{
        let t = new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y: 2}), p3: new Vect({x:4, y:0})});
        expect(t.min).toEqual({x:0, y:0});
        expect(t.max).toEqual({x:4, y:2});
    });

    it('a tri has a bounds property', ()=>{
        let t = new Tri({p1: new Vect({x:0,y:0}), p2: new Vect({x:2, y: 2}), p3: new Vect({x:4, y:0})});
        expect(t.bounds).toEqual({minx:0,miny:0, maxx:4, maxy:2});
    });

});
