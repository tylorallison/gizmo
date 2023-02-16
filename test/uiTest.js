import { Game } from '../js/game.js';
import { UiCanvas } from '../js/uiCanvas.js';
import { Hierarchy } from '../js/hierarchy.js';
import { XForm } from '../js/xform.js';
import { TextToken } from '../js/textToken.js';
import { TextFormat } from '../js/textFormat.js';
import { UiPanel } from '../js/uiPanel.js';
import { UiText } from '../js/uiText.js';
import { Timer } from '../js/timer.js';
import { UiButton } from '../js/uiButton.js';
import { Sfx } from '../js/sfx.js';
import { SfxRef } from '../js/refs.js';
import { UiInput, UiInputText } from '../js/uiInput.js';
import { UiGrid } from '../js/uiGrid.js';
import { UiView } from '../js/uiView.js';
import { Bounds } from '../js/bounds.js';

class UITest extends Game {
    static assetSpecs = [
        Sfx.xspec({ tag: 'test.sound', audio: new SfxRef({src: '../media/test.mp3'}) }),
    ];

    /*
    testToken(cvs, tt, fitter='center', alignx=.5, aligny=.5) {
        let x = (this.col-Math.round(this.maxCols/2)) * this.size;
        let y = (this.row-Math.round(this.maxRows/2)) * this.size;
        let panel = new UiPanel({ fitter: fitter, alignx: alignx, aligny: aligny, sketch: tt, dbg: { xform: true }, xform: new XForm({ grip: .5, x: x, y: y, fixedWidth: this.size, fixedHeight: this.size})});
        Hierarchy.adopt(cvs, panel)
        //Hierarchy.adopt(panel, tt);
        this.col++;
        if (this.col >= this.maxCols) {
            this.row++;
            this.col = 0;
        }
    }

    testUiText(cvs, text, fmt, fitter='center', alignx=.5, aligny=.5) {
        let x = (this.col-Math.round(this.maxCols/2)) * this.size;
        let y = (this.row-Math.round(this.maxRows/2)) * this.size;
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
    */

    async prepare() {
        this.size = 150;
        this.maxCols = 6;
        this.maxRows = 4;
        this.col = 0;
        this.row = 0;
        console.log(`${this} ready`);

        let cvs = new UiCanvas({ gctx: this.gctx });

        let button = new UiButton({ 
            mouseEnteredSound: 'test.sound',
            mouseExitedSound: 'test.sound',
            mouseClickedSound: 'test.sound',
            text: 'press me', 
            hltext: 'press me now', 
            //dbg: { xform: true }, 
            xform: new XForm({ 
                grip: .5, 
                x: 0, 
                y: 0, 
                fixedWidth: this.size, 
                fixedHeight: this.size
            }),
            textSpec: {
                aligny: 0,
                xform: new XForm({ left: .3, }),
                fmt: new TextFormat({ color: 'blue' }),
            },
            hlTextSpec: {
                aligny: 1,
                xform: new XForm({ right: .3, }),
                fmt: new TextFormat({ color: 'red' }),
            },
        });
        Hierarchy.adopt(cvs, button)

        let input = new UiInput({ 
            text: '', 
            xform: new XForm({ 
                grip: .5, 
                x: 150, 
                y: 0, 
                fixedWidth: this.size, 
                fixedHeight: this.size,
            }),
            textFmt: new TextFormat({ color: 'green' }),
            selectedTextFmt: new TextFormat({ color: 'blue' }),
            ttext: new UiInputText({
                xform: new XForm({ top: .35, bottom: .35, left: .1, right: .1 }),
                token: new TextToken({
                    alignx: 0,
                    aligny: .5,
                }),
            })
        });
        Hierarchy.adopt(cvs, input)

        let grid = new UiGrid({
            dbg: { xform: true },
            createFilter: (gzo) => gzo.tag === 'grid',
            rows: 16,
            cols: 16,
            bounds: new Bounds(0, 0, 256, 256),
            xform: new XForm({ 
                grip: .5, 
                x: 0, 
                y: 150, 
                fixedWidth: this.size, 
                fixedHeight: this.size,
            }),
        });
        Hierarchy.adopt(cvs, grid)

        let view = new UiView({tag: 'grid', xform: new XForm({ x: 16, y: 16, fixedWidth: 16, fixedHeight: 16, origx: 0, origy: 0})});

        //new Timer({ ttl: 5000, cb: () => input.text = 'regular programming'});

    }
}

/** ========================================================================
 * start the game when page is loaded
 */
window.onload = async function() {
    // start the game
    let game = new UITest();
    game.start();
}
