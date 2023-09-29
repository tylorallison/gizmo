export { ChainedMap };

class ChainedMap {
    constructor(values) {
        this.$entries = new Map(values);
        this.$stack = [];
    }

    get size() {
        let total = this.$entries.size;
        for (const entries of this.$stack) total += entries.size;
        return total;
    }

    advance(values) {
        if (this.$entries) {
            this.$stack.unshift(this.$entries);
        }
        this.$entries = new Map(values);
    }

    withdraw() {
        if (this.$stack) {
            this.$entries = this.$stack.shift();
        }
    }

    clear(all=false) {
        this.$entries.clear();
        if (all) {
            for (const entries of this.$stack) entries.clear();
        }
    }

    get(key) {
        if (this.$entries.has(key)) return this.$entries.get(key);
        for (const entries of this.$stack) {
            if (entries.has(key)) return entries.get(key);
        }
        return undefined;
    }

    has(key) {
        if (this.$entries.has(key)) return true;
        for (const entries of this.$stack) {
            if (entries.has(key)) return true;
        }
        return false;
    }

    delete(key) {
        if (this.$entries.has(key)) {
            this.$entries.delete(key);
        } else {
            for (const entries of this.$stack) {
                if (entries.has(key)) {
                    entries.delete(key);
                    break;
                }
            }
        }
    }

    set(key, value) {
        this.$entries.set(key, value);
        return this;
    }

    *entries() {
        yield *(this.$entries.entries());
        for (const entries of this.$stack) {
            yield *(entries.entries());
        }
    }

    *keys() {
        yield *(this.$entries.keys());
        for (const entries of this.$stack) {
            yield *(entries.keys());
        }
    }

    *values() {
        yield *(this.$entries.values());
        for (const entries of this.$stack) {
            yield *(entries.values());
        }
    }

    forEach(fcn) {
        this.$entries.forEach(fcn);
        for (const entries of this.$stack) {
            entries.forEach(fcn);
        }
    }


}