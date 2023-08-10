export { WeightedFactor }

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