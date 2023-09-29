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
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
    }
    cpost(spec) {
        super.cpost(spec);
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
    }

    destroy() {
        super.destroy();
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp.bind);
    }

    onKeyDown(evt) {
        evt.preventDefault();
        if (!this.pressed.has(evt.key)) {
            if (this.dbg) console.log(`${this} evt.key down: ${evt.key}`);
            this.pressed.set(evt.key);
            Evts.trigger(this, 'key.down', { key:evt.key });
        }
    }

    onKeyUp(evt) {
        if (this.pressed.has(evt.key)) {
            if (this.dbg) console.log(`${this} evt.key up: ${evt.key}`);
            this.pressed.delete(evt.key);
            Evts.trigger(this, 'key.up', { key:evt.key });
        }
    }

    get(key) {
        return (this.pressed.has(key)) ? 1 : 0;
    }

}
