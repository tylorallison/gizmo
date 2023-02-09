
import { SfxSystem } from '../js/sfxSystem.js';
import { EvtSystem } from '../js/event.js';
import { Fmt } from '../js/fmt.js';
import { Game } from '../js/game.js';
import { SfxRef } from '../js/refs.js';
import { Sfx } from '../js/sfx.js';

class SfxTest extends Game {
    static assetSpecs = [
        Sfx.xspec({ tag: 'test.sound', audio: new SfxRef({src: '../media/test.mp3'}) }),
    ];

    async prepare() {
        console.log(`${this} ready`);
        //let sys;
        EvtSystem.listen(this.gctx, this, 'key.down', (evt) => { 
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
