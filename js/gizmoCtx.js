export { GizmoCtx };
import { Fmt } from './fmt.js';

class GizmoCtx {

    // static properties that allow unique inheritance
    static get $gid() {
        if (!this.hasOwnProperty('$$gid')) Object.defineProperty(this, '$$gid', { value: 0, writable: true });
        return this.$$gid;
    }
    static set $gid(value) {
        if (!this.hasOwnProperty('$$gid')) Object.defineProperty(this, '$$gid', { value: 0, writable: true });
        return this.$$gid = value;
    }

    constructor(spec={}) {
        this.gid = ('gid' in spec) ? spec.gid : this.constructor.$gid++;
        this.tag = ('tag' in spec) ? spec.tag : `${this.constructor.name}.${this.gid}`;
    }

    async advance() {}

    withdraw() {}

    suspend() {}

    resume() {}

    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }
}