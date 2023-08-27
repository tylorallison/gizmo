export { GizmoCtx };
import { Fmt } from './fmt.js';

class GizmoCtx {
    static _instance;
    static _gid = 1;
    static $stack = [];
    static get instance() {
        if (!this._instance) this._instance = new this();
        this._instance.advance();
        return this._instance;
    }

    static advance(ctx) {
        this._instance.suspend();
        this.$stack.push(this._instance);
        this._instance = ctx;
        ctx.advance();
    }

    static withdraw() {
        if (!this.$stack.length) {
            console.error(`${this} cannot withdraw root context`);
            return;
        }
        this._instance.withdraw();
        this._instance = this.$stack.pop();
        this._instance.resume();
    }

    static doWith(ctx, fcn) {
        this.advance(ctx);
        fcn();
        this.withdraw();
    }

    constructor(spec={}) {
        this.gid = ('gid' in spec) ? spec.gid : (this.constructor.gid)++;
        this.tag = ('tag' in spec) ? spec.tag : `${this.constructor.name}_${this.gid}`;
    }

    advance() {}

    withdraw() {}

    suspend() {}

    resume() {}

    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }
}
