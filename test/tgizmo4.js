
import { Fmt } from '../js/fmt.js';
import { Gizmo } from '../js/gizmo4.js';

describe('gizmo4', () => {

    it('playground', ()=>{
        class Test extends Gizmo {
            static {
                this.schema('foo', {dflter: () => 3});
            }
            cparse(foo) {
                super.cparse();
                console.log(`test cparse`);
                this.constructor.xparse(this, 'foo', foo);
            }
        }
        let g = new Test();
        console.log(`g: ${Fmt.ofmt(g)}`);
        console.log(`g.foo: ${g.foo}`);

    });
});