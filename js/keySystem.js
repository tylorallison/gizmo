export { KeySystem }

import { Evts } from './evt.js';
import { System } from './system.js';

class KeySystem extends System {

    static {
        this.schema('pressed', { link: false, readonly: true, parser: () => new Map()});
    }

    cpre(spec) {
        if (!spec.hasOwnProperty('tag')) spec.tag = 'keys';
        super.cpre(spec);
        this.sysKeyDown = this.sysKeyDown.bind(this);
        this.sysKeyUp = this.sysKeyUp.bind(this);
    }
    cpost(spec) {
        super.cpost(spec);
        document.addEventListener('keydown', this.sysKeyDown);
        document.addEventListener('keyup', this.sysKeyUp);
    }

    destroy() {
        super.destroy();
        document.removeEventListener('keydown', this.sysKeyDown);
        document.removeEventListener('keyup', this.sysKeyUp.bind);
    }

    sysKeyDown(evt) {
        evt.preventDefault();
        if (!this.pressed.has(evt.key)) {
            if (this.dbg) console.log(`${this} evt.key down: ${evt.key}`);
            this.pressed.set(evt.key);
            Evts.trigger(this, 'KeyDown', { key:evt.key });
        }
    }

    sysKeyUp(evt) {
        if (this.pressed.has(evt.key)) {
            if (this.dbg) console.log(`${this} evt.key up: ${evt.key}`);
            this.pressed.delete(evt.key);
            Evts.trigger(this, 'KeyUp', { key:evt.key });
        }
    }

    get(key) {
        return (this.pressed.has(key)) ? 1 : 0;
    }

}
