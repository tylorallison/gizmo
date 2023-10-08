import { Evts } from '../js/evt.js';
import { Gizmo } from '../js/gizmo.js';
import { WaitAction } from '../js/wait.js';

describe('a wait action', () => {
    let tevt = {};
    beforeEach(() => {
        tevt = {};
    });
    afterEach(() => {
        Evts.clear();
    });

    it('is completed at ttl', async ()=>{
        let actor = new Gizmo();
        let action = new WaitAction({ttl: 100});
        Evts.listen(actor, 'ActionDone', (evt) => tevt = evt);
        action.perform(actor);
        Evts.trigger(null, 'GameTock', { elapsed: 50 });
        expect(action.done).toBeFalsy();
        Evts.trigger(null, 'GameTock', { elapsed: 50 });
        expect(action.done).toBeTruthy();
        expect(tevt.tag).toEqual('ActionDone');
        expect(Evts.findLinksForEvt(null, 'GameTock')).toEqual([]);
    });

    it('can be early terminated', async ()=>{
        let actor = new Gizmo();
        let action = new WaitAction({ttl: 100});
        Evts.listen(actor, 'ActionDone', (evt) => tevt = evt);
        action.perform(actor);
        Evts.trigger(null, 'GameTock', { elapsed: 50 });
        expect(action.done).toBeFalsy();
        action.finish(false);
        expect(action.ok).toBeFalsy();
        expect(tevt.tag).toEqual('ActionDone');
        expect(Evts.findLinksForEvt(null, 'GameTock')).toEqual([]);
    });

})