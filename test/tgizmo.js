import { EvtSystem, ExtEvtReceiver } from '../js/event.js';
import { Gizmo } from '../js/gizmo.js';

describe('gizmos', () => {

    it('can trigger events', ()=>{
        let g = new Gizmo();
        let receiver = ExtEvtReceiver.gen();
        let counter = 0;
        let incr = () => counter++;
        EvtSystem.listen(g, receiver, 'test', incr);
        EvtSystem.trigger(g, 'test');
        expect(counter).toBe(1);
        expect(EvtSystem.getCount(g, 'test')).toBe(1);
    });

    it('triggers creation event when created', ()=>{
        let counter = 0;
        let incr = () => counter++;
        let receiver = ExtEvtReceiver.gen();
        Gizmo.listen(receiver, 'gizmo.created', incr)
        let g = new Gizmo();
        expect(counter).toBe(1);
    });

    it('can receive global gizmo events', ()=>{
        let g = new Gizmo();
        let receiver = ExtEvtReceiver.gen();
        let counter = 0;
        let incr = () => counter++;
        Gizmo.listen(receiver, 'test', incr)
        EvtSystem.trigger(g, 'test');
        expect(counter).toBe(1);
        expect(EvtSystem.getCount(g, 'test')).toBe(1);
    });

    it('can receive global/local gizmo events', ()=>{
        let g = new Gizmo();
        let receiver = ExtEvtReceiver.gen();
        let counter = 0;
        let incr = () => counter++;
        Gizmo.listen(receiver, 'test', incr);
        EvtSystem.listen(g, receiver, 'test', incr);
        EvtSystem.trigger(g, 'test');
        expect(counter).toBe(2);
        expect(EvtSystem.getCount(g, 'test')).toBe(1);
    });

    it('can listen/ignore global gizmo events', ()=>{
        let g = new Gizmo();
        let receiver = ExtEvtReceiver.gen();
        let counter = 0;
        let incr = () => counter++;
        Gizmo.listen(receiver, 'test', incr)
        EvtSystem.trigger(g, 'test');
        Gizmo.ignore(receiver, 'test');
        EvtSystem.trigger(g, 'test');
        expect(counter).toBe(1);
        expect(EvtSystem.getCount(g, 'test')).toBe(2);
    });

    it('can auto-release listeners', ()=>{
        let g = new Gizmo();
        let counter = 0;
        let incr = () => counter++;
        Gizmo.listen(g, 'test', incr)
        EvtSystem.trigger(g, 'test');
        g.destroy();
        EvtSystem.trigger(g, 'test');
        expect(counter).toBe(1);
        expect(EvtSystem.getCount(g, 'test')).toBe(2);
    });

    it('can adopt children during constructor', ()=>{
        let c1 = new Gizmo();
        let c2 = new Gizmo();
        let g = new Gizmo( { children: [c1, c2]});
        expect(g.children.includes(c1)).toBeTruthy();
        expect(g.children.includes(c2)).toBeTruthy();
        expect(c1.parent).toBe(g);
        expect(c2.parent).toBe(g);
    });

});