export { RenderSystem };

import { System } from './system.js';
import { EvtSystem } from './event.js';
import { Hierarchy } from './hierarchy.js';
import { Fmt } from './fmt.js';

class RenderSystem extends System {

    // STATIC VARIABLES ----------------------------------------------------
    static dfltIterateTTL = 0;
    static dfltMatchFcn = (v) => v.constructor.canvasable;

    // CONSTRUCTOR ---------------------------------------------------------
    cpre(spec) {
        super.cpre(spec);
        // -- bind event handlers
        this.onViewUpdated = this.onViewUpdated.bind(this);
        this.onRenderNeeded = this.onRenderNeeded.bind(this);
        this.onEntityAdopted = this.onEntityAdopted.bind(this);
    }
    cpost(spec) {
        super.cpost(spec);
        // -- listen on events
        EvtSystem.listen(this.gctx, this, 'gizmo.updated', this.onViewUpdated);
        EvtSystem.listen(this.gctx, this, 'render.needed', this.onRenderNeeded);
        EvtSystem.listen(this.gctx, this, 'gizmo.adopted', this.onEntityAdopted);
        this.stayActive = false;
    }

    // EVENT HANDLERS ------------------------------------------------------
    onEntityAdded(evt) {
        let actor = evt.actor;
        if (this.matchFcn(actor)) {
            this.store.set(evt.actor.gid, evt.actor);
            this.active = true;
            if (this.iterating) this.stayActive = true;
        }
    }
    onEntityRemoved(evt) {
        let actor = evt.actor;
        if (this.mathcFcn(actor)) {
            this.store.delete(evt.actor.gid);
            this.active = true;
            if (this.iterating) this.stayActive = true;
        }
    }
    onViewUpdated(evt) {
        // renderable?
        let actor = evt.actor;
        if (!actor.constructor.renderable) return;
        if (!evt.render) return;
        // skip non-visible entities
        if (!actor.visible) return;
        if (Hierarchy.findInParent(actor, (v) => !v.active)) return;
        // check for rooted to active canvas
        let root = Hierarchy.root(actor);
        if (!this.store.has(root.gid)) return;
        // otherwise, setup render pass
        this.active = true;
    }
    onRenderNeeded(evt) {
        this.active = true;
    }
    onEntityAdopted(evt) {
        let parent = evt.parent;
        let root = Hierarchy.root(parent);
        if (!this.store.has(root.gid)) return;
        // otherwise, setup render pass
        this.active = true;
    }

    // METHODS -------------------------------------------------------------
    iterate(evt, e) {
        if (!e.canvas || !e.ctx) return;
        // clear canvas
        e.ctx.clearRect(0, 0, e.canvas.width, e.canvas.height);
        // render
        e.render(e.ctx);
    }

    finalize() {
        if (this.stayActive) {
            this.stayActive = false;
        } else {
            this.active = false;
        }
    }

}
