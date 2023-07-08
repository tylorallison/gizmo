export { Mathf };

// =========================================================================
// handy math fcns

class Mathf {
    static approx(v1, v2) {
        return Math.abs(v1 - v2) < .00001;
    }

    static clamp(val, min, max) {
        return val > max ? max : val < min ? min : val;
    }

    static clampInt(val, min, max) {
        val = parseInt(val);
        return val > max ? max : val < min ? min : val;
    }

    static roundTo(val, base=1) {
        return Math.round(val/base)*base;
    }

    static floorTo(val, base=1) {
        return Math.floor(val/base)*base;
    }

    static round(val, places) {
        return +(Math.round(val + "e+" + places) + "e-" + places);
    }

    static angle(cx, cy, ex, ey, rad=true) {
        let dx = ex - cx;
        let dy = ey - cy;
        let theta = Math.atan2(dy, dx);     // range (-PI, PI]
        if (rad) return theta;
        theta *= 180 / Math.PI;             // rads to degs, range (-180, 180]
        //if (theta < 0) theta = 360 + theta; // range [0, 360)
        return theta;
    }

    static modulo(number, divisor) {
        if (number < 0) {
            return ((number % divisor) + divisor) % divisor;
        }
        return number % divisor;
    }

    /**
     * normalize the given angle expressed in radians or degrees to be either within -PI to PI (half)
     * or 0 to 2*PI
     * @param {float} angle 
     * @param {bool} [rad=true] - angle is expressed in radians (true) or degrees (false)
     * @param {float} [min=-Math.PI] - starting angle for normalization
     */
    static normalizeAngle(angle, min=-Math.PI, rad=true) {
        angle -= min;
        angle = this.modulo(angle, (rad) ? Math.PI*2 : 360);
        return angle + min;
    }

    static angleBetween(a, b, rad=true) {
        let d = a - b;
        if (rad) {
            d += (d > Math.PI) ? -Math.PI*2 : (d < -Math.PI) ? Math.PI*2 : 0;
        } else {
            d += (d > 180) ? -360 : (d < -180) ? 360 : 0;
        }
        return Math.abs(d);
    }

    static distance(x1, y1, x2, y2) {
        let dx = x2-x1;
        let dy = y2-y1;
        return Math.sqrt(dx*dx + dy*dy);
    }

    static lineDistance(p1x, p1y, p2x, p2y, p3x, p3y) {
        // special case ... vertical line
        if (p1x === p2x) {
            return Math.abs(p3x-p1x);
        // special case ... horizontal line
        } else if (p1y === p2y) {
            return Math.abs(p3y-p1y);
        } else {
            // standard line equation
            // y = mx+b
            // converted to ax + by + c = 0 form
            // mx - y + b = 0
            // distance formula w/ vars from a,b,c form
            // d = Math.abs(a*p3x + b*p3y + c)/Math.sqrt(a^2+b^2)
            // converted to use m/b (a=>m b=>-1 c=>b)
            // d = Math.abs(m*p3x - p3y + b)/Math.sqrt(m^2+1)
            let m = (p2y - p1y)/(p2x-p1x);
            let b = (p1y-m*p1x);
            let d = Math.abs(m*p3x - p3y + b)/Math.sqrt(m*m+1);
            return d;
        }
    }

    static rotatePoint(cx, cy, pX, pY, angle) {
        var dx = pX - cx;
        var dy = pY - cy;
        var mag = Math.sqrt(dx * dx + dy * dy);
        let rads = angle * Math.PI/180;
        let x = mag * Math.cos(rads);
        let y = mag * Math.sin(rads);
        return {x: cx+x, y: cy+y};
    }

    static lerp(min, max, minw, maxw, v) {
        if (max === min) return 0;
        return minw + (maxw-minw) * (v-min)/(max-min);
    }

    static addAvgTerm(terms, avg, newTerm) {
        return (terms*avg + newTerm)/(terms+1);
    }

    static towards(x1,y1, x2,y2, d) {
        if (x1 === x2 && y1 === y2 || d === 0) return [x1, y1];
        let md = this.distance(x1,y1, x2,y2);
        let k = d/md;
        return [x1+(x2-x1)*k, y1+(y2-y1)*k];
    }

    static checkIntersectRectSegment(rminx, rminy, rmaxx, rmaxy, p1x, p1y, p2x, p2y) {
        // Find min and max X for the segment
        let minX = p1x;
        let maxX = p2x;
        if (p1x > p2x) {
            minX = p2x;
            maxX = p1x;
        }
        // Find the intersection of the segment's and rectangle's x-projections
        if (maxX > rmaxx) maxX = rmaxx;
        if (minX < rminx) minX = rminx;
        // If their projections do not intersect return false
        if (minX > maxX) return false;
        // Find corresponding min and max Y for min and max X we found before
        let minY = p1y;
        let maxY = p2y;
        let dx = p2x - p1x;
        if (Math.abs(dx) > 0.0000001) {
            let a = (p2y - p1y)/dx;
            let b = p1y - a*p1x;
            minY = a*minX + b;
            maxY = a*maxX + b;
        }
        if (minY > maxY) {
            let tmp = maxY;
            maxY = minY;
            minY = tmp;
        }
        // Find the intersection of the segment's and rectangle's y-projections
        if (maxY > rmaxy) maxY = rmaxy;
        if (minY < rminy) minY = rminy;
        // If Y-projections do not intersect return false
        if (minY > maxY) return false;
        return true;
    }

    static overlap(min1, max1, min2, max2) {
        let min = min1;
        let max = max1;
        if (max>max2) max = Math.max(max2,min1);
        if (min<min2) min = Math.min(min2,max1);
        return max-min;
    }

    static projectSegment(min1, max1, min2, max2) {
        let min = min1;
        let max = max1;
        if (max>max2) max = Math.max(max2,min1);
        if (min<min2) min = Math.min(min2,max1);
        return [min, max];
    }

    static invProjectSegment(smin, smax, pmin, pmax) {
        if (pmin<smin) pmin=smin;
        if (pmax>smax) pmax=smax;
        if (pmin>smin && pmax<smax) {
            return [smin, pmin, pmax, smax];
        }
        let min = (pmin>smin) ? smin : pmax;
        let max = (pmax<smax) ? smax : pmin;
        return [min, max];
    }

    /**
     * A function to return a sample within a given range, where the sample roughly fits a standard bell curve for standard distribution.
     * Based on maths from https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
     * @param {*} min 
     * @param {*} mean 
     * @param {*} max 
     * @param {*} sdf - standard deviation factor.  Range between mean and min/max is divided by this to give approximation for standard deviation for curve.
     * @returns sample
     */
    static distSample(min, mean, max, sdf = 3) {
        let sample;
        let maxiters = 100;
        do {
            if (maxiters-- <= 0) break;
            var u = 1 - Math.random();
            var v = 1 - Math.random();
            let sd = Math.max(max - mean, mean - min) / sdf;
            sample = mean + Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * sd;

        } while (sample < min || sample > max);
        return sample;

    }

    static avg(...args) { 
        let sum = args.reduce((pv, cv) => pv+cv, 0);
        return sum/args.length;
    }

    static avgi(...args) { 
        let sum = args.reduce((pv, cv) => pv+cv, 0);
        return Math.round(sum/args.length);
    }

}