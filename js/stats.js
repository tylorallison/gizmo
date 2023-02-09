export { Stats };

import { Fmt } from './fmt.js';

class Stats {
    static kvs = {};
    static elapsed = 0;
    static interval = 1000;
    static last = {};
    static enabled = false;
    static perUpdate = false;
    static updates = 0;

    static count(key) {
        if (!this.enabled) return;
        if (!this.kvs.hasOwnProperty(key)) this.kvs[key] = 0;
        this.kvs[key]++;
    }

    static get(key) {
        return this.last[key];
    }

    static report() {
        if (this.perUpdate) {
            let plast = {};
            for (const key of Object.keys(this.last)) {
                plast[key] = Math.round(this.last[key]/this.updates);
            }
            console.log(Fmt.ofmt(plast));
        } else {
            console.log(Fmt.ofmt(this.last));
        }
    }

    static update(ctx) {
        //if (!this.enabled) return;
        this.elapsed += ctx.deltaTime;
        this.updates++;
        if (this.elapsed >= this.interval) {
            this.last = this.kvs;
            this.kvs = {};
            this.report();
            this.elapsed = 0;
            this.updates = 0;
        }
    }

}