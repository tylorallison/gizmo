export { Schema, SchemaEntry };

import { Fmt } from './fmt.js';

class SchemaEntry {
    constructor(key, spec={}) {
        this.key = key;
        this.dflt = spec.dflt;
        this.specKey = spec.specKey || this.key;
        // getter function of format (object, specification) => { <function returning value> };
        // -- is treated as a dynamic value
        // -- setting getter will disable all set functions and notifications for this key
        this.getter = spec.getter;
        // generator function of format (object, value) => { <function returning final value> };
        this.generator = spec.generator;
        // nopathgen disables path updates (atUpdate and autogen)
        //this.nopathgen = spec.nopathgen;
        this.autogen = spec.autogen;
        this.autogendeps = new Set();
        this.parser = spec.parser || ((o, x) => {
            if (x.hasOwnProperty(this.specKey)) return x[this.specKey];
            if (this.generator) return this.generator(o,this.dflt);
            return this.dflt;
        });
        //this.link = spec.hasOwnProperty('link') ? spec.link : false;
        //this.readonly = spec.hasOwnProperty('readonly') ? spec.readonly : false;
        this.renderable = spec.hasOwnProperty('renderable') ? spec.renderable : false;
        this.eventable = (this.readonly) ? false : spec.hasOwnProperty('eventable') ? spec.eventable : true;
        //this.gizmo = spec.hasOwnProperty('gizmo') ? spec.gizmo : false;
        this.atUpdate = spec.atUpdate;
        // proxy - if the value is an object, setup a GizmoData proxy supports setter/getter traps to invoke GizmoData set/get logic
        this.proxy = spec.hasOwnProperty('proxy') ? spec.proxy : false;
        // nolink - if the value is an object, do not setup GizmoData links between the trunk and leaf.  This will disable any GizmoData-specific logic for this key
        this.nolink = spec.hasOwnProperty('nolink') ? spec.nolink : false;
        // autogen fields are not serializable
        this.serializable = (this.autogen) ? false : spec.hasOwnProperty('serializable') ? spec.serializable : true;
        this.serializeKey = spec.serializeKey ? spec.serializeKey : this.key;
        this.serializer = spec.serializer || ((sdata, target, value) => (typeof value === 'object') ? JSON.parse(JSON.stringify(value)) : value);
    }

    get customized() {
        if (this.getter) return true;
        if (this.setter) return true;
        if (this.autogen) return true;
        if (this.atUpdate) return true;
        if (this.readonly) return true;
        if (this.link) return true;
        if (this.gizmo) return true;
        return false;
    }

    toString() {
        return Fmt.toString(this.constructor.name, this.key);
    }
}

class Schema {

    static apply(cls, key, spec={}) {
        let schema;
        if (!cls.hasOwnProperty('$schema')) {
            schema = new Schema(Object.getPrototypeOf(cls).$schema);
            cls.$schema = schema;
        } else {
            schema = cls.$schema;
        }
        let oldEntry = schema.map[key];
        let idx = -1;
        if (oldEntry) {
            idx = schema.entries.indexOf(oldEntry);
            for (const entry of schema.entries) entry.autogendeps.delete(key);
            schema.trunkGenDeps.delete(key);
        }
        let entry = new SchemaEntry(key, spec);
        // -- customized schema indicates it must have full get/set proxy
        if (entry.customized) schema.customized = true;
        schema.map[key] = entry;
        if (idx !== -1) {
            schema.entries[idx] = entry;
        } else {
            schema.entries.push(entry);
        }
        if (entry.autogen && (typeof entry.autogen !== 'function' || entry.autogen('$trunk'))) {
            schema.trunkGenDeps.add(key);
        }

        for (const oentry of Object.values(schema.map)) {
            if (oentry.key === key) continue;
            // handle existing schema which might have an autogen dependency
            if (oentry.autogen && (typeof oentry.autogen !== 'function' || oentry.autogen(key))) {
                entry.autogendeps.add(oentry.key);
            }
            // handle if this new schema has an autogen dependency
            if (entry.autogen && (typeof entry.autogen !== 'function' || entry.autogen(oentry.key))) {
                oentry.autogendeps.add(key);
            }
        }

    }
    static clear(cls, key) {
        if (cls.hasOwnProperty('$schema')) {
            let sentry = cls.$schema.map[key];
            let idx = cls.$schema.entries.indexOf(sentry);
            if (idx !== -1) {
                cls.$schema.entries.splice(idx, 1);
            }
            delete cls.$schema.map[key];
            for (const entry of cls.$schema.entries) {
                entry.autogendeps.delete(key);
            }
            cls.$schema.trunkGenDeps.delete(key);
            //cls.$schema.clearAutogenDep(key);
        }
    }

    constructor(base={}) {
        if (!base) base = {};
        this.map = Object.assign({}, base.map);
        this.entries = Array.from(base.entries || []);
        // track auto generation mapping
        // -- key: key of attribute that is being set
        // -- value: set of attribute keys that need to be generated when the keyed attribute changes
        this.trunkGenDeps = new Set(base.trunkGenDeps || []);
        this.parser = null;
        // a schema is customized if any schema entries require special get/set processing
        this.customized = false;
    }

}

