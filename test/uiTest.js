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
import { UiInput, UiInputText } from '../js/uiInput.js';
import { UiGrid } from '../js/uiGrid.js';
import { UiView } from '../js/uiView.js';
import { Bounds } from '../js/bounds.js';
import { Rect } from '../js/rect.js';
import { UiToggle } from '../js/uiToggle.js';
import { Media } from '../js/media.js';

class UITest extends Game {
    static xassets = [
        Sfx.xspec({ tag: 'test.sound', media: Media.from('../media/test.mp3') }),
    ];

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

        let toggle = new UiToggle({ 
            xform: new XForm({ 
                grip: .5, 
                x: 300, 
                y: 0, 
                fixedWidth: this.size, 
                fixedHeight: this.size,
            }),
        });
        Hierarchy.adopt(cvs, toggle)

        let grid = new UiGrid({
            hex: true,
            dbg: { xform: true, grid: true },
            createFilter: (gzo) => gzo.tag === 'grid',
            rows: 4,
            cols: 4,
            alignx: 0,
            aligny: 0,
            xform: new XForm({ 
                grip: .5, 
                x: 0, 
                y: 75+128, 
                fixedWidth: 256, 
                fixedHeight: 256*.75,
            }),
        });
        Hierarchy.adopt(cvs, grid)

        let panel = new UiPanel({sketch: new Rect({color: 'green'}), tag: 'grid', xform: new XForm({ x: 32, y: 32, fixedWidth: 16, fixedHeight: 16})});

        new Timer({ ttl: 2000, cb: () => { 
            panel.xform.x = 64; 
            new Timer({ ttl: 2000, cb: () => { 
                panel.xform.x = 128; 
                panel.xform.y = 48; 
                new Timer({ ttl: 2000, cb: () => { 
                    grid.xform.x = 32;
                    grid.rerender = true;
                    //console.log(`setting bounds width => ${grid.bounds.width}`);
                }});
            }});
        }});

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
