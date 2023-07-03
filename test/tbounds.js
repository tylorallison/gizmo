import { Bounds } from '../js/bounds.js';
import { Fmt } from '../js/fmt.js';
import { SerialData, Serializer } from '../js/serializer.js';
import { Vect } from '../js/vect.js';

describe('a bounds', () => {
    let b;
    beforeEach(() => {
        b = new Bounds({x:0, y:0, width:2, height:4});
    });

    it('can be serialized', ()=>{
        const rslt = Serializer.xify(new SerialData(), b);
        expect(rslt).toEqual({
            $gzx: true,
            cls: 'Bounds',
            args: [{
                x: 0,
                y: 0,
                width: 2,
                height: 4,
            }],
        });
    });

    it('has min property', ()=>{
        const rslt = b.min;
        expect(rslt.x).toBe(0);
        expect(rslt.y).toBe(0);
    });

    // extends
    let extendTests = [
        {orig: new Bounds({x:1,y:1, width:1, height:1}), other: new Bounds({x:1,y:1, width:1, height:1}), xrslt: new Bounds({x:1,y:1,width:1, height:1})},
        {orig: new Bounds({x:159,y:103, width:32, height:46}), other: new Bounds({x:160,y:103, width:32, height:46}), xrslt: new Bounds({x:159,y:103, width:33, height:46})},
    ]
    for (const test of extendTests) {
        it('can extend with ' + test.other, ()=>{
            const rslt = test.orig.extend(test.other);
            expect(rslt).toEqual(test.xrslt);
        });
    }

});