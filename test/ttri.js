import { Tri } from '../js/tri.js';
import { Vect } from '../js/vect.js';

describe('a triangle', () => {

    it('a tri has min/max autogenerated', ()=>{
        let t = new Tri({p1: new Vect({x:1,y:1}), p2: new Vect({x:2, y: 3}), p3: new Vect({x:4, y:2})});
        expect(t.min).toEqual(new Vect({x:1,y:1}));
        expect(t.max).toEqual(new Vect({x:4,y:3}));
        t.p1 = new Vect({x:10,y:1});
        expect(t.min).toEqual(new Vect({x:2,y:1}));
        expect(t.max).toEqual(new Vect({x:10,y:3}));
    });

});