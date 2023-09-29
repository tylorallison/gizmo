export { CtxMgr };

import { GameCtx } from './gameCtx.js';


class CtxMgr {

    constructor(spec={}) {
        this.$stack = [];
        this.$instance = null;
    }

    async advance(ctx) {
        let old = this.$instance;
        if (old) {
            old.suspend();
        }
        this.$stack.push(old);
        this.$instance = ctx;
        await ctx.advance();
        return Promise.resolve();
    }

    withdraw() {
        if (!this.$instance) {
            console.error(`${this} failed to withdraw - no instance`);
            return;
        }
        let old = this.$instance;
        old.withdraw();
        if (this.$stack.length) {
            this.$instance = this.$stack.pop();
            this.$instance.resume();
        } else {
            this.$instance = null;
        }
    }

    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }
}

class ConfigCtx {
    static hasForGdt(o, key) {
        GameCtx.fromGdt(o).config.hasForGdt(o, key);
    }
}

class Events {
    static trigger(emitter, tag, atts) {
        if (typeof emitter === 'number') {
            GameCtx.fromGid(emitter).events.trigger(emitter, tag, atts);
        } else {
            GameCtx.fromGdt(emitter).events.trigger(emitter, tag, atts);
        }
    }
    static listen(emitter, tag, fcn, receiver, opts={}) {
        this.$instance.listen(emitter, tag, fcn, receiver, opts);
    }
    static ignore(emitter, tag, fcn, receiver) {
        this.$instance.ignore(emitter, tag, fcn, receiver);
    }
    static clearFor(actor) {
        this.$instance.clearFor(actor);
    }
}
