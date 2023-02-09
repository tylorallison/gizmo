export { Animator };

//import { EvtStream, Events } from './event.js';
import { Fmt } from './fmt.js';
import { EvtSystem, ExtEvtReceiver } from './event.js';
import { Schema } from './schema.js';
import { Sketch } from './sketch.js';
import { GizmoData } from './gizmoData.js';


/** ========================================================================
 * An animator is responsible for driving animations based on state passed through event updates
 */
class Animator extends Sketch {

    static {
        // -- sketch state mapping
        Schema.apply(this, 'trunkKey', { dflt: 'state', readonly: true });
        Schema.apply(this, 'sketches', { dflt: {}, readonly: true });
        // map of transitions
        // { <target state>: [ { from: <source state>, sketch: <sketch> }, ... ]}
        Schema.apply(this, 'transitions', { dflt: {}, readonly: true });
        // -- state tracking
        Schema.apply(this, 'state', { dflt: 'idle', renderable: true, setter: (o,x,v) => {
            if (o.sketches.hasOwnProperty(v)) {
                if (o.sketch) o.sketch.disable();
                let targetSketch = o.sketches[v];
                let transition = false;
                // check for transition
                if (o.sketch && o.transitions.hasOwnProperty(v)) {
                    // find best
                    let possibles = o.transitions[v];
                    let match;
                    for (const possible of possibles) {
                        if (!possible.sketch) return;
                        if (possible.from === o.state) {
                            match = possible.sketch;
                            break;
                        } else if ( !possible.from ) {
                            match = possible.sketch;
                        }
                    }
                    if (match) {
                        match.reset();
                        if (!match.done) {
                            transition = true;
                            targetSketch = match;
                        }
                    }
                }
                o.sketch = targetSketch;
                if (transition) {
                    let root = GizmoData.root(o);
                    let path = `${GizmoData.path(o.sketch)}.done`;
                    if (EvtSystem.isEmitter(root)) {
                        EvtSystem.listen(root, o, 'gizmo.updated', (evt) => {
                            if (o.state === v) {
                                o.sketch.disable();
                                o.sketch = o.sketches[v];
                                o.sketch.reset();
                                o.sketch.enable();
                            }
                        }, { once: true, filter: (evt) => evt.update.hasOwnProperty(path) });
                    }
                }
                o.sketch.reset();
                o.sketch.enable();
                return v;
            }
            return o.state;
        } });
        Schema.apply(this, 'sketch', { link: true, renderable: true, parser: ((o,x) => ((o.sketches) ? o.sketches[o.state] : null)) });
        Schema.apply(this, 'width', { readonly: true, getter: ((o,x) => ((o.sketch) ? o.sketch.width : 0)) });
        Schema.apply(this, 'height', { readonly: true, getter: ((o,x) => ((o.sketch) ? o.sketch.height : 0)) });
        Schema.apply(this, 'ttl', { readonly: true, getter: (o,x) => ( (o.sketch) ? o.sketch.ttl : 0 )});
        Schema.apply(this, 'done', { readonly: true, getter: (o,x) => ( (o.sketch) ? o.sketch.done : false )});
        ExtEvtReceiver.apply(this);
    }

    // DATA CHANGE HANDLERS ------------------------------------------------
    atLink(trunk) {
        // if linked to gizmo
        let self = this;
        if (EvtSystem.isEmitter(trunk)) {
            EvtSystem.listen(trunk, this, 'gizmo.updated', (evt) => { self.state = evt.update.state }, { filter: (evt) => evt.update.hasOwnProperty(this.trunkKey) });
        }
        if (this.state !== trunk[this.trunkKey]) this.state = trunk[this.trunkKey];
    }
    atUnlink(trunk) {
        if (EvtSystem.isEmitter(trunk)) {
            EvtSystem.ignore(trunk, this, 'gizmo.updated');
        }
    }

    // METHODS -------------------------------------------------------------
    enable() {
        if (!this.active) {
            if (this.sketch) this.sketch.enable();
        }
        super.enable();
    }

    disable() {
        // disable current sketch
        if (this.sketch) this.sketch.disable();
        super.disable();
    }

    subrender(ctx, x=0, y=0, width=0, height=0) {
        if (this.sketch) this.sketch.render(ctx, x, y, width, height);
    }

}