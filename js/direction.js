export { Direction };

class Direction {
    static none =           0;
    static north =          1;
    static northEast =      2;
    static east =           4;
    static southEast =      8;
    static south =          16;
    static southWest =      32;
    static west =           64;
    static northWest =      128;
    static cardinal =       Direction.north|Direction.south|Direction.east|Direction.west;
    static diagonal =       Direction.northWest|Direction.southWest|Direction.northEast|Direction.southEast;
    static any =            Direction.cardinal|Direction.diagonal;

    static all = [
        this.northWest,
        this.north,
        this.northEast,
        this.east,
        this.southEast,
        this.south,
        this.southWest,
        this.west,
    ]
    static strMap = {
        [this.north]:       'north',
        [this.northEast]:   'northEast',
        [this.east]:        'east',
        [this.southEast]:   'southEast',
        [this.south]:       'south',
        [this.southWest]:   'southWest',
        [this.west]:        'west',
        [this.northWest]:   'northWest',
    };
    static abbrevMap = {
        [this.north]:       'n',
        [this.northEast]:   'ne',
        [this.east]:        'e',
        [this.southEast]:   'se',
        [this.south]:       's',
        [this.southWest]:   'sw',
        [this.west]:        'w',
        [this.northWest]:   'nw',
    };

    static cardinals = [
        this.north,
        this.east,
        this.south,
        this.west,
    ];

    static diagonals = [
        this.northEast,
        this.southEast,
        this.southWest,
        this.northWest,
    ];

    static composites = {
        [this.northWest]: this.north|this.west,
        [this.northEast]: this.north|this.east,
        [this.southWest]: this.south|this.west,
        [this.southEast]: this.south|this.east,
    };

    static toString(dir) {
        return this.strMap[dir] || 'invalid';
    }

    static toAbbrev(dir) {
        return this.abbrevMap[dir] || 'X';
    }

    static maskToString(dir) {
        return Array.from(this.all.filter((v) => dir&v).map((v)=>this.toString(v))).join('|');
    }

    // kinds should be cardinals, diagonals, or all
    static nextInRotation(kinds, current, clockwise=true) {
        let idx = kinds.indexOf(current);
        if (idx === -1) return current;
        if (clockwise) {
            idx = (idx+1)%kinds.length;
            return kinds[idx];
        } else {
            idx = (kinds.length + idx - 1) % kinds.length;
            return kinds[idx];
        }
    }

    static westerly(dir) {
        return dir & (Direction.northWest|Direction.west|Direction.southWest);
    }

    static easterly(dir) {
        return dir & (Direction.northEast|Direction.east|Direction.southEast);
    }

    static cardinalFromXY(x, y) {
        let heading = Math.atan2(y, x);
        return this.cardinalFromHeading(heading);
    }

    static diagonalFromXY(x, y) {
        let heading = Math.atan2(y, x);
        return this.diagonalFromHeading(heading);
    }

    static diagonalFromHeading(heading) {
        // slice of the unit circle that each direction occupies
        let cardinalUnit = (2*Math.PI) / this.all.length;
        // to map values of -PI to PI to the direction index, first add PI (to give values in the range of 0 to 2*PI), then
        // divide by the 'cardinalUnit' or size of each directional slice of the unit circle.  Rounding this will give values
        // in the range from 0 to # of directions + 1.  Mod this by the # of directions to handle the special case of the 'west'
        // direction which occurs at the beginning of the range (-PI) and end of the range (PI) of values.
        let dir_i = (Math.round((heading + Math.PI) / cardinalUnit) + 7) % this.all.length;
        return this.all[dir_i];
    }

    static cardinalFromHeading(heading) {
        // slice of the unit circle that each direction occupies
        let cardinalUnit = (2*Math.PI) / this.cardinals.length;
        // to map values of -PI to PI to the direction index, first add PI (to give values in the range of 0 to 2*PI), then
        // divide by the 'cardinalUnit' or size of each directional slice of the unit circle.  Rounding this will give values
        // in the range from 0 to # of directions + 1.  Mod this by the # of directions to handle the special case of the 'west'
        // direction which occurs at the beginning of the range (-PI) and end of the range (PI) of values.
        let dir_i = (Math.round((heading + Math.PI) / cardinalUnit) + 3) % this.cardinals.length;
        return this.cardinals[dir_i];
    }

    static asHeading(dir) {
        switch (dir) {
        case this.north:
            return -Math.PI*.5;
        case this.south:
            return Math.PI*.5;
        case this.east:
            return 0;
        case this.west:
            return Math.PI;
        case this.northWest:
            return -Math.PI*.75;
        case this.northEast:
            return -Math.PI*.25;
        case this.southWest:
            return Math.PI*.75;
        case this.southEast:
            return Math.PI*.25;
        }
        return 0;
    }

    static asX(dir) {
        switch(dir) {
        case Direction.west:
        case Direction.northWest:
        case Direction.southWest:
            return -1;
        case Direction.east:
        case Direction.northEast:
        case Direction.southEast:
            return 1;
        }
        return 0;
    }

    static asY(dir) {
        switch(dir) {
        case Direction.north:
        case Direction.northWest:
        case Direction.northEast:
            return -1;
        case Direction.south:
        case Direction.southWest:
        case Direction.southEast:
            return 1;
        }
        return 0;
    }

    static opposite(dir) {
        switch(dir) {
        case Direction.north:
            return Direction.south;
        case Direction.south:
            return Direction.north;
        case Direction.west:
            return Direction.east;
        case Direction.east:
            return Direction.west;
        case Direction.northWest:
            return Direction.southEast;
        case Direction.southEast:
            return Direction.northWest;
        case Direction.northEast:
            return Direction.southWest;
        case Direction.southWest:
            return Direction.northEast;
        }
        return Direction.none;
    }

    static orthogonal(dir) {
        switch(dir) {
        case Direction.north:
            return Direction.east;
        case Direction.south:
            return Direction.west;
        case Direction.west:
            return Direction.north;
        case Direction.east:
            return Direction.south;
        case Direction.northWest:
            return Direction.northEast;
        case Direction.southEast:
            return Direction.southWest;
        case Direction.northEast:
            return Direction.southEast;
        case Direction.southWest:
            return Direction.northWest;
        }
        return Direction.none;
    }

    static adjacent(dir) {
        switch(dir) {
        case Direction.north:
            return [Direction.northWest, Direction.northEast]
        case Direction.south:
            return [Direction.southWest, Direction.southEast]
        case Direction.west:
            return [Direction.southWest, Direction.northWest]
        case Direction.east:
            return [Direction.southEast, Direction.northEast]
        case Direction.northWest:
            return [Direction.north, Direction.west]
        case Direction.southEast:
            return [Direction.south, Direction.east]
        case Direction.northEast:
            return [Direction.north, Direction.east]
        case Direction.southWest:
            return [Direction.south, Direction.west]
        }
        return [];
    }

    static *forEach(dirs) {
        for (const dir of this.all) {
            if (dir & dirs) yield dir;
        }
    }

    static distanceAlong(dir, x, y) {
        let dx = this.asX(dir)*x;
        let dy = this.asY(dir)*y;
        return Math.sqrt(dx*dx+dy*dy);
    }

}