export { GizmoDataW };


class GizmoDataLink {
    constructor(trunk, sentry, node) {
        this.trunk = trunk;
        this.node = node
        this.sentry = sentry;
    }
}

class GizmoDataW {

    static get(target, key) {
        if (!target) return undefined;
        const sentry = (target.constructor.$schema) ? target.constructor.$schema.map[key] : null;
        if (sentry && sentry.getter) return sentry.getter(target);
        return target[key];
    }

    static link(trunk, target) {
    }

    static unlink(trunk, target) {
    }

    static set(target, key, value) {
        if (!target) return false;
        const sentry = (target.constructor.$schema) ? target.constructor.$schema.map[key] : null;
        if (sentry.getter) return false;
        let storedValue = target[key];
        if (sentry && sentry.generator) value = sentry.generator(target, value);
        if (Object.is(storedValue, value)) return true;
        if (typeof storedValue === 'object') this.unlink(target, storedValue);
        target[key] = value;
        if (typeof value === 'object') this.link(target, value);
        /*
        if (sentry) {
            if (sentry.link) {
                if (value && this.constructor.findInPath(this, (hdl) => hdl === value.$handle)) {
                    console.error(`hierarchy loop detected ${value} already in path: ${this.node}`);
                    return false;
                }
                //if (storedValue) storedValue.$handle.unlink();
                target[key] = value;
                //if (value) value.$handle.link(this, sentry);
            } else {
                target[key] = value;
            }
        } else {
        }
        */

        /*
        if (this.watchers) {
            for (const watcher of this.watchers) watcher.watcher(this, key, storedValue, value);
        }
        */

    }
}