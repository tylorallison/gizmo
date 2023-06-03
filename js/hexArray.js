export { HexArray, HexBucketArray };

import { GridArray, GridBucketArray } from './gridArray.js';
import { Direction } from './direction.js';

class HexArray extends GridArray {
    static directions = [ Direction.northWest, Direction.northEast, Direction.east, Direction.southEast, Direction.southWest, Direction.west ];

    static _idxFromDir(idx, dir, dimx, dimy) {
        let ij = this._ijFromIdx(idx, dimx, dimy);
        let oi=0, oj=0;
        switch (dir) {
            case Direction.northWest:
                if (ij.y%2 === 0) oi = -1;
                oj = -1;
                break;
            case Direction.northEast:
                if (ij.y%2) oi = 1;
                oj = -1;
                break;
            case Direction.west:
                oi = -1;
                break;
            case Direction.east:
                oi = +1;
                break;
            case Direction.southWest:
                if (ij.y%2 === 0) oi = -1;
                oj = 1;
                break;
            case Direction.southEast:
                if (ij.y%2) oi = 1;
                oj = 1;
                break;
            default:
                return -1;
        }
        return this._idxFromIJ(ij.x+oi, ij.y+oj, dimx, dimy);
    }

}

class HexBucketArray extends GridBucketArray {
    static directions = [ Direction.northWest, Direction.northEast, Direction.east, Direction.southEast, Direction.southWest, Direction.west ];

    static _idxFromDir(idx, dir, dimx, dimy) {
        let ij = this._ijFromIdx(idx, dimx, dimy);
        let oi=0, oj=0;
        switch (dir) {
            case Direction.northWest:
                if (ij.y%2 === 0) oi = -1;
                oj = -1;
                break;
            case Direction.northEast:
                if (ij.y%2) oi = 1;
                oj = -1;
                break;
            case Direction.west:
                oi = -1;
                break;
            case Direction.east:
                oi = +1;
                break;
            case Direction.southWest:
                if (ij.y%2 === 0) oi = -1;
                oj = 1;
                break;
            case Direction.southEast:
                if (ij.y%2) oi = 1;
                oj = 1;
                break;
            default:
                return -1;
        }
        return this._idxFromIJ(ij.x+oi, ij.y+oj, dimx, dimy);
    }
}