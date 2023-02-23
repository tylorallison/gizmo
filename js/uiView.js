export { UiView };

import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { Gizmo } from './gizmo.js';
import { Hierarchy } from './hierarchy.js';
import { Schema } from './schema.js';
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
        Schema.apply(this, 'visible', {dflt: true, renderable: true});
        Schema.apply(this, 'active', {dflt: false});
        Schema.apply(this, 'xform', {link: true, renderable: true, parser: (o,x) => x.xform || new XForm()});
        Schema.apply(this, 'smoothing', {dflt: null, renderable: true});
        Schema.apply(this, 'alpha', {dflt: 1, renderable: true});
        Schema.apply(this, 'dbg', {dflt: false});
        Schema.apply(this, 'mask', {dflt: false});
        Schema.apply(this, 'mouseOver', {dflt: false, renderable: true});
        Schema.apply(this, 'mousePressed', {dflt: false, renderable: true});
        Schema.apply(this, 'mousePriority', {dflt: 0, renderable: true});
        Schema.apply(this, 'mouseBlock', {dflt: false, renderable: true});
        Schema.apply(this, 'mouseClickedSound');
        Schema.apply(this, 'mouseEnteredSound');
        Schema.apply(this, 'mouseExitedSound');
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
        /*
        this.depth = spec.hasOwnProperty('depth') ? spec.depth : ((spec.hasOwnProperty('dfltDepth')) ? spec.dfltDepth : 0);
        this.autocenter = spec.hasOwnProperty('autocenter') ? spec.autocenter : false;
        this.autosize = (spec.hasOwnProperty('autosize')) ? spec.autosize : true;
        */

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

    // FIXME: remove?
    /*
    onResized(evt) {
        if (this.autocenter) {
            if (this.autocenter && this.parent) {
                let offx = Math.max(0, (this.parent.xform.width - this.xform.width)/2);
                this.xform.offx = offx;
                let offy = Math.max(0, (this.parent.xform.height - this.xform.height)/2);
                this.xform.offy = offy;
            }
        }
    }
    */

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