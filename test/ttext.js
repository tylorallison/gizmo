import { Text } from '../js/text.js';

describe('text', () => {

    it('can be tokenized', ()=>{
        let tokens = Text.tokenize('<h>hello <b>whole</b></h> <i>wide</i> world \\<nothing to see here>', {whitespace: true});
        //expect(tokens).toEqual([]);
    });

});