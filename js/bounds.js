export { Bounds };

import { Vect } from './vect.js';
import { Fmt } from './fmt.js';
import { Stats } from './stats.js';
import { GizmoData } from './gizmoData.js';

// =========================================================================
class Bounds extends GizmoData {
    // SCHEMA --------------------------------------------------------------
    static {
        this.schema(this, 'x', { dflt: 0 });
        this.schema(this, 'y', { dflt: 0 });
        this.schema(this, 'width', { dflt: 0 });
        this.schema(this, 'height', { dflt: 0 });
    }

    // STATIC METHODS ------------------------------------------------------
    static iBounds(obj) {
        return obj && ('minx' in obj) && ('miny' in obj) && ('maxx' in obj) && ('maxy' in obj);
    }

    static _intersects(minx1, miny1, maxx1, maxy1, minx2, miny2, maxx2, maxy2, inclusive=false) {
        Stats.count('Bounds.intersects');
        let minx = Math.max(minx1, minx2);
        let maxx = Math.min(maxx1, maxx2);
        let miny = Math.max(miny1, miny2);
        let maxy = Math.min(maxy1, maxy2);
        let width = maxx-minx;
        let height = maxy-miny;
        if (inclusive && width >= 0 && height >= 0) {
            return new Bounds({x:minx, y:miny, width:width, height:height});
        } else if (!inclusive && width > 0 && height > 0) {
            return new Bounds({x:minx, y:miny, width:width, height:height});
        }  else {
            return false;
        }
    }

    static _overlaps(minx1, miny1, maxx1, maxy1, minx2, miny2, maxx2, maxy2, inclusive=false) {
        Stats.count('Bounds.overlaps');
        let minx = Math.max(minx1, minx2);
        let maxx = Math.min(maxx1, maxx2);
        let miny = Math.max(miny1, miny2);
        let maxy = Math.min(maxy1, maxy2);
        if (inclusive) {
            return maxx >= minx && maxy >= miny;
        } else {
            return maxx > minx && maxy > miny;
        }
    }

    static _contains(minx, miny, maxx, maxy, x, y, inclusive=false) {
        if (inclusive) {
            return x >= minx && x <= maxx &&
                y >= miny && y <= maxy;
        } else {
            return x > minx && x < maxx &&
                y > miny && y < maxy;
        }
    }

    static intersects(obj1, obj2, inclusive=false) {
        return this._intersects(
            obj1.minx,
            obj1.miny,
            obj1.maxx,
            obj1.maxy,
            obj2.minx,
            obj2.miny,
            obj2.maxx,
            obj2.maxy,
            inclusive,
        );
    }

    static overlaps(obj1, obj2, inclusive=false) {
        if (('minx' in obj1) && ('miny' in obj1) && ('maxx' in obj1) && ('maxy' in obj1)) {
            if (('minx' in obj2) && ('miny' in obj2) && ('maxx' in obj2) && ('maxy' in obj2)) {
                return this._overlaps(
                    obj1.minx,
                    obj1.miny,
                    obj1.maxx,
                    obj1.maxy,
                    obj2.minx,
                    obj2.miny,
                    obj2.maxx,
                    obj2.maxy,
                    inclusive,
                );
            } else if (('x' in obj2) && ('y' in obj2)) {
                return this._contains(
                    obj1.minx,
                    obj1.miny,
                    obj1.maxx,
                    obj1.maxy,
                    obj2.x,
                    obj2.y,
                    inclusive,
                );
            }
        } else if (('x' in obj1) && ('y' in obj1)) {
            if (('minx' in obj2) && ('miny' in obj2) && ('maxx' in obj2) && ('maxy' in obj2)) {
                return this._contains(
                    obj2.minx,
                    obj2.miny,
                    obj2.maxx,
                    obj2.maxy,
                    obj1.x,
                    obj1.y,
                    inclusive,
                );
            } else if (inclusive && ('x' in obj2) && ('y' in obj2)) {
                return obj1.x === obj2.x && obj1.y === obj2.y;
            }
        }
        return false;
    }

    static contains(obj1, obj2, inclusive=false) {
        if (('minx' in obj1) && ('miny' in obj1) && ('maxx' in obj1) && ('maxy' in obj1)) {
            if (('x' in obj2) && ('y' in obj2)) {
                return this._contains(
                    obj1.minx,
                    obj1.miny,
                    obj1.maxx,
                    obj1.maxy,
                    obj2.x,
                    obj2.y,
                    inclusive,
                );
            }
        } else if (('x' in obj1) && ('y' in obj1)) {
            if (inclusive && ('x' in obj2) && ('y' in obj2)) {
                return obj1.x === obj2.x && obj1.y === obj2.y;
            }
        }
        return false;
    }

    static containsXY(obj, x, y, inclusive=false) {
        if (('minx' in obj) && ('miny' in obj) && ('maxx' in obj) && ('maxy' in obj)) {
            return this._contains(
                obj.minx,
                obj.miny,
                obj.maxx,
                obj.maxy,
                x,
                y,
                inclusive,
            );
        } else if (('x' in obj) && ('y' in obj)) {
            return inclusive && obj.x === x && obj.y === y;
        }
    }

    // STATIC PROPERTIES ---------------------------------------------------
    static get zero() {
        return new Bounds();
    }

    // STATIC FUNCTIONS ----------------------------------------------------
    static fromMinMax(minx, miny, maxx, maxy) {
        return new Bounds({x:minx, y:miny, width:maxx-minx, height:maxy-miny});
    }

    // PROPERTIES ----------------------------------------------------------
    get minx() {
        return this.x;
    }
    get miny() {
        return this.y;
    }
    get min() {
        return new Vect({x:this.x, y:this.y});
    }

    get maxx() {
        return this.x + this.width;
    }
    get maxy() {
        return this.y + this.height;
    }
    get max() {
        return new Vect({x:this.x + this.width, y:this.y + this.height});
    }

    get midx() {
        return this.x + (this.width * .5);
    }
    get midy() {
        return this.y + (this.height * .5);
    }
    get mid() {
        return new Vect({x:this.x + (this.width * .5), y:this.y + (this.height * .5)});
    }

    // STATIC FUNCTIONS ----------------------------------------------------
    static newOrExtend(ob, nb) {
        if (!ob) return nb;
        ob.extend(nb);
        return ob;
    }

    // METHODS -------------------------------------------------------------
    /**
     * make a copy of the current bounds and return
     */
    copy() {
        return new Bounds(this);
    }

    /**
     * determine if the given position (in world space) is within the current bounds
     * @param {Vect} pos - position to check
     */
    contains(pos, inclusive=false) {
        return Bounds.contains(this, pos, inclusive);
    }

    /**
     * determine if the given position (in world space) is within the current bounds
     */
    containsXY(x, y, inclusive=false) {
        return Bounds.containsXY(this, x, y, inclusive);
    }

    /**
     * determine if given bounds overlaps current bounds
     * @param {Bounds} other - other bounds to evaluate
     */
    overlaps(other, inclusive=false) {
        return Bounds.overlaps(this, other, inclusive);
    }

    /**
     * determine if given bounds intersects current bounds
     * @param {Bounds} other - other bounds to evaluate
     */
    intersects(other, inclusive=false) {
        return Bounds.intersects(this, other, inclusive);
    }

    /**
     * Extend the current bounds to include the extend of given bounds
     * @param {*} other 
     */
    extend(other) {
        if (!other) return this;
        if (other.minx < this.minx) {
            let delta = this.minx - other.minx;
            this.width += delta;
            this.x = other.minx;
        }
        if (other.maxx > this.maxx) {
            let delta = other.maxx - this.maxx;
            this.width += delta;
        }
        if (other.miny < this.miny) {
            let delta = this.miny - other.miny;
            this.height += delta;
            this.y = other.minx;
        }
        if (other.maxy > this.maxy) {
            let delta = other.maxy - this.maxy;
            this.height += delta;
        }
        return this;
    }

    equals(other) {
        if (!other) return this;
        if (this.x !== other.x) return false;
        if (this.y !== other.y) return false;
        if (this.width !== other.width) return false;
        if (this.height !== other.height) return false;
        return true;
    }

    toString() {
        return Fmt.toString('Bounds', this.x, this.y, this.maxx, this.maxy, this.width, this.height);
    }
}
