
import { SfxSystem } from '../js/sfxSystem.js';
import { Evts } from '../js/evt.js';
import { Fmt } from '../js/fmt.js';
import { Game } from '../js/game.js';
import { SfxRef } from '../js/refs.js';
import { Sfx } from '../js/sfx.js';
import { Media } from '../js/media.js';

class SfxTest extends Game {
    static xassets = [
        Sfx.xspec({ tag: 'test.sound', media: Media.from('../media/test.mp3') }),
    ];

    async prepare() {
        console.log(`${this} ready`);
        //let sys;
        Evts.listen(null, 'KeyDown', (evt) => { 
            console.log(`key event: ${Fmt.ofmt(evt)}`);
            //if (!sys) sys = new SfxSystem();
            SfxSystem.playSfx(this, 'test.sound', {});
        });
    }
}

/** ========================================================================
 * start the game when page is loaded
 */
window.onload = async function() {
    // start the game
    let game = new SfxTest();
    game.start();
}
