export { GizmoSingleton };

class GizmoSingleton {

    static get $ctx() {
        if (this.hasOwnProperty('_$ctx')) {
            return this._$ctx;
        }
        const ctx = {
            instance: null,
        };
        Object.defineProperty(this, '_$ctx', {
            value: ctx,
            writable: false,
        });
        return ctx;
    }
    static get $instance() {
        let ctx = this.$ctx;
        if (!ctx.instance) {
            ctx.instance = new this();
            ctx.instance.activate();
        }
        return ctx.instance;
    }
    static set $instance(value) {
        let ctx = this.$ctx;
        if (ctx.instance) ctx.instance.deactivate();
        ctx.instance = value;
        ctx.instance.activate();
    }

    activate() {
    }

    deactivate() {
    }

}