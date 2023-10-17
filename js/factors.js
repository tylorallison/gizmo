export { WeightedFactor, MultiFactor }

class WeightedFactor {
    constructor(value=0, weight=0) {
        this.sum = value*weight;
        this.weights = weight;
    }

    add(value, weight) {
        this.sum += value*weight;
        this.weights += weight;
    }

    get value() {
        return this.sum/this.weights;
    }
}

class MultiFactor {

    constructor(value=0, weight=0) {
        this._value = 1;
        if (weight) this.add(value, weight);
    }

    add(value, weight) {
        this._value *= (value + ((1/weight)-1))/(1/weight);
    }

    get value() {
        return this._value;
    }
}