export { TView, TXForm, TVect, GizmoData, Gizmo, TestProperty, ExBase, ExSub }

import { ExtEvtReceiver, EvtSystem, ExtEvtEmitter } from './event.js';
import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';
import { Schema } from './schema.js';


/*
    - Gizmos should be able to be serialized based on defined serializable properties.
    - Updates to properties of Gizmos should be able to be evented.
    - Properties of Gizmos should be able to be serialized with custom serializer fcn or default to property value.
    - When a Gizmo is destroyed:
        - Linked data objects should be cleared

    - Data objects can be linked to Gizmos
        - Gizmo property references data object
        - Optional data object property to reference parent Gizmo
    - Data objects should be able to be serialized based on defined serializable properties.
    - Updates to properties of data objects should be able to be evented.
    - Properties of data objects should be able to be serialized with custom serializer fcn or default to property value.
*/

class Gizmo extends GizmoData {
    constructor(spec={}) {
        super(spec);
        ExtEvtEmitter.apply(this, spec);
    }
}

class TVect extends GizmoData {
    static {
        Schema.apply(this, 'x');
        Schema.apply(this, 'y');
    }
    constructor(spec={}) {
        super(spec);
    }
}

class TXForm extends GizmoData {
    static {
        Schema.apply(this, 'pos', { link: TVect });
        Schema.apply(this, 'data');
    }
}

class TView extends Gizmo {
    static {
        Schema.apply(this, 'xform', { link: TView });
    }
}

class ExBase extends GizmoData {
    static {
        Schema.apply(this, 'var1');
    }

    func2() {
    }
}

class ExSub extends ExBase {
    static {
        Schema.apply(this, 'var2');
    }
}

class TestProperty {
    static define(obj, key, value, spec={}) {
        Object.defineProperty(obj, key, new this(obj, key, value, spec));
    }
    /**
     * 
     * @param {*} obj 
     * @param {*} key 
     * @param {*} value 
     * @param {*} spec 
     * -- link
     * -- linkKey
     * -- linkDestroyEvt
     * -- readonly
     */
    constructor(obj, key, value, spec={}) {
        ExtEvtReceiver.apply(this);

        this._key = key;
        this._value = value;
        this.enumerable = true;
        this.get = () => this._value;
        //this.listenerRefs = [];

        const linkDestroyEvt = spec.hasOwnProperty('linkDestroyEvt') ? linkDestroyEvt : 'gizmo.destroyed';
        const destroyFcn = () => {
            this._value = null;
        }

        // -- linked properties
        if (spec.link) {
            if (spec.linkKey && this._value && this._value.hasOwnProperty(spec.linkKey)) {
                this._value[spec.linkKey] = obj;
            }
            if (this._value && linkDestroyEvt) EvtSystem.listen(this._value, this, linkDestroyEvt, destroyFcn);
        }
        // -- readonly properties do not have a setter
        if (!spec.readonly) {
            this.set = (v) => {
                if (this._value !== v) {
                    this._value = v;
                    if (spec.onset) spec.onset(v);
                    let data =  { set: { [key]: v }};
                    if (spec.render) data.render = true;
                    if (obj) EvtSystem.trigger(obj, 'gizmo.set', data);
                }
                // update link listeners
                if (spec.link && this._value) {
                    EvtSystem.ignore(this._value, this, linkDestroyEvt, destroyFcn);
                }
                this._value = v;
                if (spec.link && v) {
                    EvtSystem.listen(v, this, linkDestroyEvt, destroyFcn);
                }
            }
        }
    }
}

class XFormLinkProperty {
    static define(obj, tag, value) {
        Object.defineProperty(obj, tag, new this(obj, value));
    }
    constructor(obj, value) {
        // data
        this._obj = obj;
        this._value = value;
        if (this._value) {
            this._value._gizmo = obj;
        }
        // define property values
        this.enumerable = true;
        this.get = () => { 
            return this._value;
        } ;
        this.set = (v) => {
            if (this._value !== v) {
                if (this._value) {
                    this._value._gizmo = this._obj;
                }
                this._value = v;
            }
        }
    }
}

class XFormProperty {
    static define(obj, tag, value) {
        Object.defineProperty(obj, tag, new this(obj, tag, value));
    }
    constructor(xform, key, value) {
        this._xform = xform;
        this._key = key;
        this._value = value;
        this.enumerable = true;
        this.get = () => this._value;
        this.set = (v) => {
            if (this._value !== v) {
                this._value = v;
                if (this._xform._gizmo) {
                    let data = { render: true, set: { xform: { [this._key]: v }}};
                    EvtSystem.trigger(this._xform._gizmo, 'gizmo.set', data);
                }
            }
        }
    }
}

class GizmoLinkProperty {
    static define(obj, tag, value) {
        Object.defineProperty(obj, tag, new this(value));
    }
    constructor(value) {
        // make property an event receiver
        ExtEvtReceiver.apply(this);
        this.onDestroy = this.onDestroy.bind(this);
        // data
        this._value = value;
        if (this._value) {
            EvtSystem.listen(this._value, this, 'gizmo.destroyed', this.onDestroy);
        }
        // define property values
        this.enumerable = true;
        this.get = () => { 
            return this._value;
        } ;
        this.set = (v) => {
            if (this._value !== v) {
                if (this._value) {
                    EvtSystem.ignore(this._value, this, 'gizmo.destroyed', this.onDestroy);
                }
                this._value = v;
                if (v) {
                    EvtSystem.listen(v, this, 'gizmo.destroyed', this.onDestroy);
                }
            }
        }
    }
    onDestroy(evt) {
        this._value = null;
    }
}