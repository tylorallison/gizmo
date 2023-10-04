import { Game } from '../js/game.js';
import { UiCanvas } from '../js/uiCanvas.js';
import { Hierarchy } from '../js/hierarchy.js';
import { XForm } from '../js/xform.js';
import { TextToken } from '../js/textToken.js';
import { TextFormat } from '../js/textFormat.js';
import { UiPanel } from '../js/uiPanel.js';
import { UiText } from '../js/uiText.js';
import { Timer } from '../js/timer.js';


class TextTest extends Game {

    testToken(cvs, tt, fitter='center', alignx=.5, aligny=.5) {
        let x = (this.col-Math.round(this.maxCols/2)) * this.size;
        let y = (this.row-Math.round(this.maxRows/2)) * this.size;
        let panel = new UiPanel({ fitter: fitter, alignx: alignx, aligny: aligny, sketch: tt, dbg: { xform: true }, xform: new XForm({ grip: .5, x: x, y: y, fixedWidth: this.size, fixedHeight: this.size})});
        Hierarchy.adopt(cvs, panel)
        this.col++;
        if (this.col >= this.maxCols) {
            this.row++;
            this.col = 0;
        }
    }

    testUiText(cvs, text, fmt, fitter='center', alignx=.5, aligny=.5) {
        let x = (this.col-Math.round(this.maxCols/2)) * this.size;
        let y = (this.row-Math.round(this.maxRows/2)) * this.size;
        console.log(`pos: ${x},${y}`)
        if (!fmt) fmt = new TextFormat();
        let panel = new UiText({ fitter: fitter, alignx: alignx, aligny: aligny, text: text, fmt: fmt, dbg: { xform: true }, xform: new XForm({ grip: .5, x: x, y: y, fixedWidth: this.size, fixedHeight: this.size})});
        Hierarchy.adopt(cvs, panel)
        this.col++;
        if (this.col >= this.maxCols) {
            this.row++;
            this.col = 0;
        }
        return panel;
    }

    async prepare() {
        this.size = 150;
        this.maxCols = 6;
        this.maxRows = 4;
        this.col = 0;
        this.row = 0;

        let cvs = new UiCanvas({ gctx: this.gctx });
        let panel;

        /*
        this.testToken(cvs, new TextToken({fmt: new TextFormat({color: 'red', highlight: true, size: 22, }) }), 'none');
        this.testToken(cvs, new TextToken({fmt: new TextFormat({color: 'red', highlight: true, size: 22, }) }), 'none', .5, 0);
        this.testToken(cvs, new TextToken({fmt: new TextFormat({color: 'red', highlight: true, size: 22, }) }), 'none', .5, 1);
        this.testToken(cvs, new TextToken({fmt: new TextFormat({color: 'red', highlight: true, size: 22, }) }), 'stretch');
        */

        this.testUiText(cvs, 'hello great big world', new TextFormat({color: 'red', size: 22 }), 'wrap');
        this.testUiText(cvs, 'hello great big world', new TextFormat({color: 'red', size: 22 }), 'wrap', 1);
        this.testUiText(cvs, 'hello great <color=blue>big</> world', new TextFormat({color: 'red', size: 22 }), 'autowrap', .5, .5);
        this.testUiText(cvs, 'hello great big world', new TextFormat({color: 'red', size: 22 }), 'wrap', .5, .5);
        this.testUiText(cvs, 'hello great big world', new TextFormat({color: 'red', size: 22 }), 'stretch', .5, .5);
        this.testUiText(cvs, 'hello great big world', new TextFormat({color: 'red', size: 22 }), 'autowrap', 1, .5);
        this.testUiText(cvs, 'hello great <delta=20><b>big</b></> world', new TextFormat({color: 'red', size: 22 }), 'autowrap', .5, .5);
        panel = this.testUiText(cvs, 'special announcement', new TextFormat({color: 'red', size: 22 }), 'autowrap', .5, .5);

        new Timer({ ttl: 5000, cb: () => panel.text = 'regular programming'});


    }
}

/** ========================================================================
 * start the game when page is loaded
 */
window.onload = async function() {
    // start the game
    let game = new TextTest();
    game.start();
}
