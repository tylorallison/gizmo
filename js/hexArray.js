export { HexArray };

import { Array2D } from './array2d.js';
import { Direction } from './direction.js';

class HexArray extends Array2D {
    static directions = [ Direction.northWest, Direction.northEast, Direction.east, Direction.southEast, Direction.southWest, Direction.west ];

    static idxfromdir(idx, dir, cols, rows) {
        let i = this.ifromidx(idx, cols);
        let j = this.jfromidx(idx, cols);
        let oi=0, oj=0;
        switch (dir) {
            case Direction.northWest:
                oi = (j%2) ? i : i-1;
                oj = j-1;
                break;
            case Direction.northEast:
                oi = (j%2) ? i+1 : i;
                oj = j-1;
                break;
            case Direction.west:
                oi = i-1;
                oj = j;
                break;
            case Direction.east:
                oi = i+1;
                oj = j;
                break;
            case Direction.southWest:
                oi = (j%2) ? i : i-1;
                oj = j+1;
                break;
            case Direction.southEast:
                oi = (j%2) ? i+1 : i;
                oj = j+1;
                break;
            default:
                return -1;
        }
        return this.idxfromij(oi, oj, cols, rows);
    }

    idxfromdir(idx, dir) {
        return this.constructor.idxfromdir(idx, dir, this.cols, this.rows);
    }

}