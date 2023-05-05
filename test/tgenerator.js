import { Generator } from '../js/generator.js';
import { GizmoData } from '../js/gizmoData.js';

describe('a generator', () => {
    class TGen extends GizmoData {
        static {
            GizmoData.schema(this, 'field1', { dflt: 5 });
        }
    }
    class TBase extends GizmoData {
        static {
            GizmoData.schema(this, 'field2', { dflt: 5 });
            GizmoData.schema(this, 'tgen', { link: true });
        }
    }

    let g;
    beforeEach(() => {
        g = new Generator();
    });

    it('can create simple gizmos from specifications', ()=>{
        let gzd = g.generate( TGen.xspec({ field1: 10}));
        expect(gzd.field1).toEqual(10);
        expect(gzd instanceof TGen).toBeTruthy();
    });

    it('can create gizmos with nested dependencies', ()=>{
        let spec = TBase.xspec({ 
            field2: 'hello',
            tgen: TGen.xspec({
                field1: 'there',
            }),
        });
        let gzd = g.generate(spec);
        expect(gzd instanceof TBase).toBeTruthy();
        expect(gzd.field2).toEqual('hello');
        expect(gzd.tgen instanceof TGen).toBeTruthy();
        expect(gzd.tgen.field1).toEqual('there');
        expect(spec.tgen instanceof TGen).toBeFalsy();
    });

});