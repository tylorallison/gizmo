import { Fmt } from '../js/fmt.js';
import { Game } from '../js/game.js';
import { Evts } from '../js/evt.js';
import { UiCanvas } from '../js/uiCanvas.js';
import { Rect } from '../js/rect.js';
import { Hierarchy } from '../js/hierarchy.js';
import { XForm } from '../js/xform.js';
import { Sprite } from '../js/sprite.js';
import { Animation } from '../js/animation.js';
import { Generator } from '../js/generator.js';
import { UiPanel } from '../js/uiPanel.js';
import { Animator } from '../js/animator.js';
import { Timer } from '../js/timer.js';
//import { CompositeSprite } from '../js/compositeSprite.js';
import { Shape } from '../js/shape.js';
import { ImageMedia } from '../js/media.js';
import { Assets } from '../js/asset.js';

class TestModel extends UiPanel {
    static {
        this.schema('state', { dflt: 'on', renderable: true });
    }
}

class AssetTest extends Game {

    static xassets = [

        Rect.xspec({ tag: 'rect.one', color: 'rgba(255,0,0,.5)', borderColor: 'red', border: 2, width: 40, height: 40 }),
        Rect.xspec({ tag: 'rect.two', color: 'rgba(0,255,0,.25)', borderColor: 'yellow', border: 2, width: 40, height: 40 }),
        Rect.xspec({ tag: 'test.rect', color: 'blue', borderColor: 'red', border: 2, width: 40, height: 40 }),
        Sprite.xspec({tag: 'test.sprite', media: ImageMedia.xspec({src: '../media/token.png', width: 16, height: 16, x: 0, y: 0, scale: 4, smoothing: false}), }),
        Shape.xspec({tag: 'test.shape', color: 'purple', border: 2, borderColor: 'red', verts: [{x:0,y:0}, {x:10,y:0}, {x:10,y:10}, {x:5, y:15}, {x:0, y:10}]}),
        Animation.xspec({tag: 'test.animation', jitter: true, sketches: [
            Sprite.xspec({cls: 'Sprite', media: ImageMedia.xspec({src: '../media/token.png', width: 16, height: 16, x: 0, y: 0, scale: 4, smoothing: false}), ttl: 150 }),
            Sprite.xspec({cls: 'Sprite', media: ImageMedia.xspec({src: '../media/token.png', width: 16, height: 16, x: 16*1, y: 0, scale: 4, smoothing: false }), ttl: 150 }),
            Sprite.xspec({cls: 'Sprite', media: ImageMedia.xspec({src: '../media/token.png', width: 16, height: 16, x: 16*2, y: 0, scale: 4, smoothing: false }), ttl: 150 }),
            Sprite.xspec({cls: 'Sprite', media: ImageMedia.xspec({src: '../media/token.png', width: 16, height: 16, x: 16*3, y: 0, scale: 4, smoothing: false }), ttl: 150 }),
            Sprite.xspec({cls: 'Sprite', media: ImageMedia.xspec({src: '../media/token.png', width: 16, height: 16, x: 16*4, y: 0, scale: 4, smoothing: false }), ttl: 150 }),
            Sprite.xspec({cls: 'Sprite', media: ImageMedia.xspec({src: '../media/token.png', width: 16, height: 16, x: 16*5, y: 0, scale: 4, smoothing: false }), ttl: 150 }),
        ]}),

        Animator.xspec({ 
            tag: 'test.animator', state: 'on', 
            sketches: {
                on: Rect.xspec({ color: 'green', borderColor: 'red', border: 2, width: 40, height: 40 }),
                off: Rect.xspec({ color: 'gray', borderColor: 'red', border: 2, width: 40, height: 40 }),
            },
            transitions: {
                off: [{ sketch: Animation.xspec({ loop: false, sketches: [ 
                    Rect.xspec({ color: 'orange', borderColor: 'red', border: 2, width: 40, height: 40, ttl: 200 }),
                ]}) }],
            },
        }),

    ];

    async prepare() {
        Evts.listen(null, 'KeyDown', (evt) => { console.log(`key pressed: ${Fmt.ofmt(evt)}`)});

        let cvs = new UiCanvas({ });
        let rect = Assets.get('test.rect');
        let sprite = Assets.get('test.sprite');
        let shape = Assets.get('test.shape');
        let anim = Assets.get('test.animation');
        let animator = Assets.get('test.animator');

        /*
        // FIXME: needs to be refactored
        let c = new CompositeSprite();
        c.add('one', Generator.generate(Assets.get('rect.one')));
        c.add('two', Generator.generate(Assets.get('rect.two')));
        */
        let p = new TestModel({ 
            sketch: animator, 
            xform: new XForm({origx: .5, origy: .5, grip: .3}),
            fitter: 'stretchRatio',
        });
        Hierarchy.adopt(cvs, p);

        new Timer({ttl: 2000, cb: () => { console.log('turning state off'); p.state = 'off'}});


    }
}

/** ========================================================================
 * start the game when page is loaded
 */
window.onload = async function() {
    // start the game
    let game = new AssetTest();
    game.start();
}
