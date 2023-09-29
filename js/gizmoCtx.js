export { GizmoCtx };
import { Fmt } from './fmt.js';

class Global {
    // event functions
    static trigger(emitter, tag, atts) {
        this.$instance.trigger(emitter, tag, atts);
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


class GizmoCtx {

    // static properties that allow unique inheritance
    static get $instance() {
        if (!this.hasOwnProperty('$$instance')) Object.defineProperty(this, '$$instance', { value: null });
        return this.$$instance;
    }
    static set $instance(value) {
        if (!this.hasOwnProperty('$$instance')) Object.defineProperty(this, '$$instance', { value: null });
        this.$$instance = value;
    }
    static get $gid() {
        if (!this.hasOwnProperty('$$gid')) Object.defineProperty(this, '$$gid', { value: 0 });
        return this.$$gid;
    }
    static set $gid(value) {
        if (!this.hasOwnProperty('$$gid')) Object.defineProperty(this, '$$gid', { value: 0 });
        return this.$$gid = value;
    }
    static get $stack() {
        if (!this.hasOwnProperty('$$stack')) Object.defineProperty(this, '$$stack', { value: [] });
        return this.$$stack;
    }
    static get $ctxs() {
        if (!this.hasOwnProperty('$$ctxs')) Object.defineProperty(this, '$$ctxs', { value: {} });
        return this.$$ctxs;
    }

    static forGid(gid) {
        return this.$ctxs[gid];
    }

    static forGdt(gdt) {
        if (!gdt) return null;
        return this.$ctxs[gdt.gid];
    }

    constructor(spec={}) {
        this.gid = ('gid' in spec) ? spec.gid : this.constructor.$gid;
        this.tag = ('tag' in spec) ? spec.tag : `${this.constructor.name}.${this.gid}`;
        this.$ctxs[this.gid] = this;
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

class CtxStack {

    constructor(spec={}) {
        this.$stack = [];
        this.$instance = null;
    }

    async advance(ctx) {
        let old = this.$instance;
        if (old) old.suspend();
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

class GameCtx extends GizmoCtx {

    constructor(spec={}) {
        super(spec);
        this.config = new CtxStack();
        this.event = new CtxStack();
        this.asset = new CtxStack();
    }

    async advance() {
    }

}

class Config extends GizmoCtx {
    static hasForGdt(gdt, key) {
        return this.$instance.hasForGdt(gdt, key);
    }
    static getForGdt(gdt, key, dflt) {
        return this.$instance.getForGdt(gdt, key, dflt);
    }
    static setForGdt(gdt, key, value) {
        return this.$instance.setForGdt(gdt, key, value);
    }
}