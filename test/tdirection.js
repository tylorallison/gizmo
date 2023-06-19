import { Direction } from '../js/direction.js';

describe('a direction implementation', () => {

    // set
    for (const test of [
        {heading: 0, xrslt: Direction.east},
        {heading: Math.PI, xrslt: Direction.west},
        {heading: Math.PI*2, xrslt: Direction.east},
        {heading: Math.PI*.5, xrslt: Direction.south},
        {heading: Math.PI*1.5, xrslt: Direction.north},
        {heading: Math.PI*.25, xrslt: Direction.southEast},
        {heading: Math.PI*.75, xrslt: Direction.southWest},
        {heading: Math.PI*1.25, xrslt: Direction.northWest},
        {heading: Math.PI*1.75, xrslt: Direction.northEast},
    ]) {
        it(`can determine diagonal direction from ${test.heading}`, ()=>{
            const rslt = Direction.diagonalFromHeading(test.heading);
            expect(rslt).toEqual(test.xrslt);
        })
    }
});