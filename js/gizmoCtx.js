export { GizmoCtx };
import { Fmt } from './fmt.js';

class GizmoCtx {
    static get $ctx() {
        if (this.hasOwnProperty('_$ctx')) {
            return this._$ctx;
        }
        const ctx = {
            instance: null,
            gid: 1,
            stack: [],
        };
        Object.defineProperty(this, '_$ctx', {
            value: ctx,
            writable: false,
        });
        ctx.instance = new this();
        return ctx;
    }
    static get $instance() {
        let ctx = this.$ctx;
        if (!ctx.instance) {
            ctx.instance = new this();
            ctx.instance.advance();
        }
        return ctx.instance;
    }
    static set $instance(value) {
        let ctx = this.$ctx;
        ctx.instance = value;
    }
    static get $gid() {
        let ctx = this.$ctx;
        return ctx.gid++;
    }
    static get $stack() {
        let ctx = this.$ctx;
        return ctx.stack;
    }

    static async advance(ctx) {
        let old = this.$instance;
        old.suspend();
        this.$stack.push(old);
        this.$instance = ctx;
        await ctx.advance();
        return Promise.resolve();
    }

    static withdraw() {
        if (!this.$stack.length) {
            console.error(`${this} cannot withdraw root context`);
            return;
        }
        this.$instance.withdraw();
        this.$instance = this.$stack.pop();
        this.$instance.resume();
    }

    static doWith(ctx, fcn) {
        this.advance(ctx);
        fcn();
        this.withdraw();
    }

    constructor(spec={}) {
        this.gid = ('gid' in spec) ? spec.gid : this.constructor.$gid;
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
