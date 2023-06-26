export { Prng };

/**
 * PRNG and related utility functions
 * Original seed/randint/randfloat functions from: Blixt @ https://gist.github.com/blixt/f17b47c62508be59987b
 */
class Prng {

    // STATIC VARIABLES ----------------------------------------------------
    static main = new Prng();

    // STATIC METHODS ------------------------------------------------------
    static seed(v) {
        return this.main.seed(v);
    }
    static mix(v) {
        return this.main.mix(v);
    }
    static random() {
        return this.main.random();
    }
    static randomInt() {
        return this.main.randomInt();
    }
    static rangeInt(min, max) {
        return this.main.rangeInt(min, max);
    }
    static jitter(base, pct) {
        return this.main.jitter(base, pct);
    }
    static range(min, max) {
        return this.main.range(min, max);
    }
    static choose(arr) {
        return this.main.choose(arr);
    }
    static flip(pct=.5) {
        return this.main.flip(pct);
    }
    static shuffle(iter) {
        return this.main.shuffle(iter);
    }
    static chooseWeightedOption(arr) {
        return this.main.chooseWeightedOption(arr);
    }

    // CONSTRUCTOR ---------------------------------------------------------
    constructor(seed=1) {
        this.state = seed;
    }

    /**
     * Creates a pseudo-random value generator. The seed must be an integer.
     *
     * Uses an optimized version of the Park-Miller PRNG.
     * http://www.firstpr.com.au/dsp/rand31/
     */
    seed(v) {
        const last = this.state;
        this.state = v % 2147483647;
        if (this.state <= 0) this.state += 2147483646;
        return last;
    }

    /**
     * Mix in a seed value to the current PRNG state
     * @param {*} v 
     * @returns 
     */
    mix(v) {
        const last = this.state;
        this.state = (this.state + v) % 2147483647;
        if (this.state <= 0) this.state += 2147483646;
        return last;
    }

    /**
     * Returns a pseudo-random value between 1 and 2^32 - 2.
     */
    randomInt() {
        return this.state = this.state * 16807 % 2147483647;
    }

    rangeInt(min, max) {
        let v = this.randomInt();
        v %= (Math.abs(max-min)+1);
        return v+Math.min(min,max);
    }

    jitter(base, pct) {
        let v = base * pct * this.random();
        return (this.random() > .5) ? base + v : base - v;
    }

    range(min, max) {
        if (max <= min) return min;
        let v = this.random();
        v *= (max-min);
        return v+min;
    }

    choose(arr) {
        if (!arr || !arr.length) return undefined;
        if (arr.length === 1) return arr[0];
        let choice = this.rangeInt(0,arr.length-1);
        return arr[choice];
    }

    flip(pct=.5) {
        return this.random() < pct;
    }

    shuffle(iter) {
        let shuffled = [];
        let choices = Array.from(iter);
        while (choices.length) {
            let i = this.rangeInt(0, choices.length-1);
            shuffled.push(choices[i]);
            choices.splice(i, 1);
        }
        return shuffled;
    }

    chooseWeightedOption(arr) {
        // count weights
        if (!arr || !arr.length) return null;
        if (arr.length === 1) return arr[0];
        let weights = arr.reduce((pv, cv) => pv+(cv.weight||1), 0);
        let choice = this.random() * weights;
        for (let i=0, t=0; i<arr.length; i++) {
            let w = arr[i].weight || 1;
            if (choice >= t && choice < t+w) {
                return arr[i];
            }
            t += w;
        }
        return arr[arr.length-1];
    }

    /**
     * Returns a pseudo-random floating point number in range [0, 1).
     */
    random() {
        // We know that result of next() will be 1 to 2147483646 (inclusive).
        return (this.randomInt() - 1) / 2147483646;
    };

}