import { System } from '../js/system.js';
import { SystemMgr } from '../js/systemMgr.js';


describe('a system manager', () => {

    it('can watch for new systems', ()=>{
        let mgr = new SystemMgr();
        let sys = new System({ tag: 'test'});
        expect(mgr.get('test')).toBe(sys);
    });

    it('can watch for destroyed systems', ()=>{
        let mgr = new SystemMgr();
        let sys = new System({ tag: 'test'});
        expect(mgr.get('test')).toBe(sys);
        sys.destroy();
        expect(mgr.get('test')).toBeFalsy();
    });

});