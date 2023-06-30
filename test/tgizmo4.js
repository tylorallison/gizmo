
import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { Fmt } from '../js/fmt.js';
import { Gadget, Gizmo } from '../js/gizmo4.js';

describe('gizmo4', () => {

    it('playground', ()=>{
        class Test extends Gadget {
            static {
                this.schema('foo', {dflter: () => 3});
                this.schema('evtCounts', { link: false, serializable: false, parser: () =>  new Map() });
                this.schema('evtEmitterLinks', { link: false, serializable: false, parser: () => new Map() });
            }
            //cparse(foo) {
                //this.foo = foo;
            //}
        }
        class Sub extends Gadget {
            static {
                this.schema('value', {dflter: () => 'hello'});
                this.schema('gen', {generator: (o,dflt) => {
                    let v = `${o.value} there`;
                    console.log(`==> new v: ${v}`);
                    return v;
                }});
            }
        }
        let g = new Test({foo: 'hello world'});
        console.log(`g: ${Fmt.ofmt(g)}`);
        console.log(`g.foo: ${g.foo}`);
        console.log(`g.$dbg: ${g.$dbg}`);
        g.foo = 42;
        console.log(`g.foo: ${g.foo}`);
        console.log(`g.$dbg: ${g.$dbg}`);

        let s = new Sub();
        console.log(`s.value: ${s.value}`);
        console.log(`s.$dbg: ${s.$dbg}`);
        g.foo = s;
        console.log(`g.$dbg: ${g.$dbg}`);
        console.log(`s.$dbg: ${s.$dbg}`);

        let r = ExtEvtReceiver.gen();
        EvtSystem.listen(g, r, 'gizmo.set', (evt) => {
            console.log(`evt: ${Fmt.ofmt(evt)}`);
        });

        console.log(`s.gen: ${s.gen}`);
        s.value = 'there';
        console.log(`s.gen: ${s.gen}`);
        console.log(`s.gen: ${s.gen}`);

    });

    it('array', ()=>{
        class Root extends Gadget {
            static { this.schema('arr', {dflter: () => []}); };
        }
        class Elem extends Gadget {
            static { this.schema('val', {dflter: () => 1}); };
            toString() {
                return `{Elem:${this.val}}`;
            }
        }

        let el1 = new Elem({val: 1});
        let el2 = new Elem({val: 2});
        let el3 = new Elem({val: 3});
        let r = new Root({ arr: [el1, el2, el3]});
        console.log(`r: ${r} r.arr: ${r.arr}`);
        console.log(`r.arr.$proxy: ${r.arr.$proxy}`);
        console.log(`r.arr.$target: ${r.arr.$target}`);
        console.log(`r.arr[0]: ${r.arr[0]}`);
        //console.log(`r.arr[0].$dbg: ${r.arr[0].$dbg}`);
        let v = { foo: 'bar', hello: 'world'};
        for (const el of r.arr) {
            console.log(`el: ${el}`);
        }
    });

});