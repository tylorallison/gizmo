export { UiView };

import { Evts } from './evt.js';
import { Fmt } from './fmt.js';
import { Gizmo } from './gizmo.js';
import { Hierarchy } from './hierarchy.js';
import { SfxSystem } from './sfxSystem.js';
import { XForm } from './xform.js';

/** ========================================================================
 * The base ui primitive.
 * -- derives from Gizmo
 * -- views can have parent/child relationships
 */
class UiView extends Gizmo {

    // STATIC VARIABLES ----------------------------------------------------
    static mousable = true;
    static renderable = true;

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('visible', { dflt: true});
        this.schema('active', { dflt: false});
        this.schema('xform', { link: true, parser: (o,x) => x.xform || new XForm()});
        this.schema('smoothing', { dflt: null});
        this.schema('alpha', { dflt: 1});
        this.schema('dbg', { dflt: false, eventable: false});
        this.schema('mask', { dflt: false});
        this.schema('mouseOver', { dflt: false});
        this.schema('mousePressed', { dflt: false});
        this.schema('mousePriority', { dflt: 0});
        this.schema('mouseBlock', { dflt: false});
        this.schema('mouseClickedSound');
        this.schema('mouseEnteredSound');
        this.schema('mouseExitedSound');
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpre(spec={}) {
        super.cpre(spec);
        //this.onMouseEntered = this.onMouseEntered.bind(this);
        //this.onMouseExited = this.onMouseExited.bind(this);
        //this.onMouseClicked = this.onMouseClicked.bind(this);
        //this.onRooted = this.onRooted.bind(this);
        //this.onOrphaned = this.onOrphaned.bind(this);
    }

    cpost(spec={}) {
        super.cpost(spec);
        //Evts.listen(this, 'MouseClicked', this.onMouseClicked, this);
        //Evts.listen(this, 'GizmoUpdated', this.onMouseEntered, this, { filter: (evt) => evt.update && evt.update.mouseOver === true});
        //Evts.listen(this, 'GizmoUpdated', this.onMouseExited, this, { filter: (evt) => evt.update && evt.update.mouseOver === false});
        //Evts.listen(this, 'GizmoRooted', this.onRooted, this);
        //Evts.listen(this, 'GizmoOrphaned', this.onOrphaned, this);

    }
    cfinal(spec) {
        super.cfinal(spec);
        // activate if required
        if (this.active) this.enable();
    }

    destroy() {
        this.disable();
        super.destroy();
    }
    
    // EVENT HANDLERS ------------------------------------------------------
    $onMouseClicked(evt) {
        if (this.mouseClickedSound) SfxSystem.playSfx(this, this.mouseClickedSound);
    }

    $onMouseEntered(evt) {
        if (this.mouseEnteredSound) SfxSystem.playSfx(this, this.mouseEnteredSound);
    }
    $onMouseExited(evt) {
        if (this.mouseExitedSound) SfxSystem.playSfx(this, this.mouseExitedSound);
    }

    $onGizmoRooted(evt) {
        this.xform.$regen();
        if (evt.root.constructor.canvasable && !this.active) {
            this.active = true;
            this.enable();
        }
    }

    $onGizmoOrphaned(evt) {
        if (this.xform) this.xform.$regen();
        if (this.active) {
            this.disable();
        }
    }

    // METHODS -------------------------------------------------------------
    enable() {
    }
    disable() {
    }

    prerender(ctx) {
    }
    subrender(ctx) {
    }
    postrender(ctx) {
    }
    childrender(ctx) {
        for (const child of this.children) {
            child.render(ctx);
        }
    }

    render(ctx) {
        // for root views
        if (!this.parent) ctx.save();
        // don't render if not visible
        if (!this.visible) return;
        //if (this.dbg && this.dbg.xform) this.xform.render(ctx);
        // apply global context settings
        let savedAlpha = ctx.globalAlpha;
        ctx.globalAlpha *= this.alpha;
        let savedSmoothing = ctx.imageSmoothingEnabled;
        if (this.smoothing !== null) ctx.imageSmoothingEnabled = this.smoothing;
        // apply transform
        this.xform.apply(ctx, false);
        // handle masking
        if (this.mask) {
            // setup clip area
            ctx.save();
            ctx.beginPath();
            ctx.rect(this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
            ctx.clip();
        }
        // pre render, specific to subclass
        this.prerender(ctx);
        // private render, specific to subclass
        this.subrender(ctx);
        // child render
        this.childrender(ctx);
        // post render, specific to subclass
        this.postrender(ctx);
        // handle masking
        if (this.mask) {
            ctx.restore();
        }
        this.xform.revert(ctx, false);
        // revert global context settings
        ctx.globalAlpha = savedAlpha;
        ctx.imageSmoothingEnabled = savedSmoothing;
        if (this.dbg && this.dbg.xform) this.xform.render(ctx);
        if (!this.parent) ctx.restore();
    }

    /*
    resize(width, height) {
        if (width != this.xform.width || height != this.xform.height) {
            this.xform.width = width;
            this.xform.height = height;
            Evts.trigger(this, 'ViewResized', {width: width, height: height});
            this.evt.trigger(this.constructor.evtResized, {actor: this, width: width, height: height});
            for (const child of Hierarchy.children(this)) {
                child.evt.trigger(child.constructor.evtResized, {actor: child, root: this});
            }
            this.evt.trigger(this.constructor.evtUpdated, {actor: this});
        }
    }
    */

}
