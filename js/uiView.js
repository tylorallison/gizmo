export { UiView };

import { EvtSystem } from './event.js';
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
        this.schema(this, 'visible', {dflt: true});
        this.schema(this, 'active', {dflt: false});
        this.schema(this, 'xform', {parser: (o,x) => x.xform || new XForm()});
        this.schema(this, 'smoothing', {dflt: null});
        this.schema(this, 'alpha', {dflt: 1});
        this.schema(this, 'dbg', {dflt: false, eventable: false});
        this.schema(this, 'mask', {dflt: false});
        this.schema(this, 'mouseOver', {dflt: false});
        this.schema(this, 'mousePressed', {dflt: false});
        this.schema(this, 'mousePriority', {dflt: 0});
        this.schema(this, 'mouseBlock', {dflt: false});
        this.schema(this, 'mouseClickedSound');
        this.schema(this, 'mouseEnteredSound');
        this.schema(this, 'mouseExitedSound');
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpre(spec={}) {
        super.cpre(spec);
        this.onMouseEntered = this.onMouseEntered.bind(this);
        this.onMouseExited = this.onMouseExited.bind(this);
        this.onMouseClicked = this.onMouseClicked.bind(this);
        this.onRooted = this.onRooted.bind(this);
        this.onOrphaned = this.onOrphaned.bind(this);
    }

    cpost(spec={}) {
        super.cpost(spec);
        EvtSystem.listen(this, this, 'mouse.clicked', this.onMouseClicked);
        EvtSystem.listen(this, this, 'gizmo.updated', this.onMouseEntered, { filter: (evt) => evt.update && evt.update.mouseOver === true});
        EvtSystem.listen(this, this, 'gizmo.updated', this.onMouseExited, { filter: (evt) => evt.update && evt.update.mouseOver === false});
        EvtSystem.listen(this, this, 'gizmo.rooted', this.onRooted);
        EvtSystem.listen(this, this, 'gizmo.orphaned', this.onOrphaned);

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
    onMouseClicked(evt) {
        if (this.mouseClickedSound) SfxSystem.playSfx(this, this.mouseClickedSound);
    }

    onMouseEntered(evt) {
        if (this.mouseEnteredSound) SfxSystem.playSfx(this, this.mouseEnteredSound);
    }
    onMouseExited(evt) {
        if (this.mouseExitedSound) SfxSystem.playSfx(this, this.mouseExitedSound);
    }

    onRooted(evt) {
        this.xform.$regen();
        if (evt.root.constructor.canvasable && !this.active) {
            this.active = true;
            this.enable();
        }
    }

    onOrphaned(evt) {
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

    resize(width, height) {
        if (width != this.xform.width || height != this.xform.height) {
            this.xform.width = width;
            this.xform.height = height;
            this.evt.trigger(this.constructor.evtResized, {actor: this, width: width, height: height});
            for (const child of Hierarchy.children(this)) {
                child.evt.trigger(child.constructor.evtResized, {actor: child, root: this});
            }
            this.evt.trigger(this.constructor.evtUpdated, {actor: this});
        }
    }

}