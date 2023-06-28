
import { Fmt } from '../js/fmt.js';
import { Gadget } from '../js/gizmo4.js';

describe('gizmo4', () => {

    it('playground', ()=>{
        class Test extends Gadget {
            static {
                this.schema('foo', {dflter: () => 3});
            }
            cparse(foo) {
                super.cparse();
                console.log(`test cparse`);
                this.constructor.kvparse(this, 'foo', foo);
            }
        }
        let g = new Test();
        console.log(`g: ${Fmt.ofmt(g)}`);
        console.log(`g.foo: ${g.foo}`);

    });
});