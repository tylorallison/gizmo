import { Game } from '../js/game.js';
import { Hierarchy } from '../js/hierarchy.js';
import { UiCanvas } from '../js/uiCanvas.js';
import { UiView } from '../js/uiView.js';
import { XForm } from '../js/xform.js';

class XFormTest extends Game {
    async prepare() {
        console.log(`${this} prepare`);

        let ucvs = new UiCanvas({gtcx: this.gctx, canvasId: 'game.canvas'});

        let view1 = new UiView({
            gctx: this.gctx,
            dbg: { xform: true },
            xform: new XForm({ left: 0, right: 1, top: 0, bottom: 1, x: 200, y: 200, fixedWidth: 400, fixedHeight: 400}),
        });
        Hierarchy.adopt(ucvs, view1);

        let view1Child = new UiView({
            gctx: this.gctx,
            dbg: { xform: true },
            xform: new XForm({ grip: .1, origx: .5, origy: .5, scaley: 1, angle: Math.PI/4, gripOffsetLeft: 160 }),
        });
        Hierarchy.adopt(view1, view1Child);

        let view2 = new UiView({
            gctx: this.gctx,
            dbg: { xform: true },
            xform: new XForm({ left: 0, right: 1, top: 0, bottom: 1, x: 400, y: 200, fixedWidth: 300, fixedHeight: 300}),
        })
        Hierarchy.adopt(ucvs, view2);

        //let r = new Rect({ xform: new XForm({ fixedWidth: 100, fixedHeight: 200, gripOffsetForceRatio: true})});
        //Hierarchy.adopt(view2, r);

        /*
        Hierarchy.adopt( ucvs, new UiView({ xform: new XForm({grip: .2}), children: [
            new Rect({ xform: new XForm({ left: 0, right: 1, origx: 0, fixedWidth: 100, fixedHeight: 200 })}),
            new Rect({ xform: new XForm({ left: 0, right: 1, origx: 0, x: 100, fixedWidth: 100, fixedHeight: 200 })}),
        ]}));
        */

    }
}

/** ========================================================================
 * start the game when page is loaded
 */
window.onload = async function() {
    // start the game
    let game = new XFormTest();
    game.start();
}
