export { Schema };

class SchemaEntry {
    constructor(key, spec={}) {
        this.key = key;
        this.dflt = spec.dflt;
        this.specKey = spec.specKey || this.key;
        // getter function of format (object, specification) => { <function returning value> };
        this.getter = spec.getter;
        // setter function of format (object, specification, value) => { <function returning final value> };
        this.setter = spec.setter;
        // nopathgen disables path updates (atUpdate and autogen)
        this.nopathgen = spec.nopathgen;
        this.autogen = spec.autogen;
        this.autogendeps = new Set();
        //this.parser = spec.parser || ((obj, x) => x.hasOwnProperty(this.specKey) ? x[this.specKey] : (x.autogen) ? x.autogen() : this.dflt);
        this.parser = spec.parser || ((o, x) => {
            if (x.hasOwnProperty(this.specKey)) return x[this.specKey];
            if (this.setter) return this.setter(o,x,this.dflt);
            return this.dflt;
        });
        this.link = spec.hasOwnProperty('link') ? spec.link : false;
        this.callable = spec.hasOwnProperty('callable') ? spec.callable : false;
        this.enumerable = (this.callable) ? false : spec.hasOwnProperty('enumerable') ? spec.enumerable : true;
        this.readonly = spec.hasOwnProperty('readonly') ? spec.readonly : false;
        this.renderable = spec.hasOwnProperty('renderable') ? spec.renderable : false;
        this.eventable = (this.readonly) ? false : spec.hasOwnProperty('eventable') ? spec.eventable : true;
        this.gizmo = spec.hasOwnProperty('gizmo') ? spec.gizmo : false;
        this.atUpdate = spec.atUpdate;
        // autogen fields are not serializable
        this.serializable = (this.autogen) ? false : spec.hasOwnProperty('serializable') ? spec.serializable : true;
        this.serializeKey = spec.serializeKey ? spec.serializeKey : this.key;
        this.serializeFcn = spec.serializeFcn || ((sdata, target, value) => (typeof value === 'object') ? JSON.parse(JSON.stringify(value)) : value);
    }
}

class Schema {

    static apply(cls, key, spec={}) {
        let schema;

        if (!cls.hasOwnProperty('$schema')) {
            schema = new Schema({base: Object.getPrototypeOf(cls).$schema});
            cls.$schema = schema;
            //Object.assign({}, Object.getPrototypeOf(this)._schema);
            //console.log(`cls: ${cls} schema: ${schema}`)
        } else {
            schema = cls.$schema;
        }

        let oldSchema = schema.map[key];
        let idx = -1;
        if (oldSchema) {
            idx = schema.entries.indexOf(oldSchema);
            clearAutogenDep(key);
        }
        let entry = new SchemaEntry(key, spec);
        schema.map[key] = entry;
        // FIXME: remove
        /*
        let sparser = schema.parser;
        schema.parser = (o,x) => {
            if (sparser) sparser(o,x);
            o[key] = entry.parser(o,x);
        }
        */
        if (idx !== -1) {
            schema.entries[idx] = entry;
        } else {
            schema.entries.push(entry);
        }

        for (const oentry of Object.values(schema.map)) {
            if (oentry.key === key) continue;
            // handle existing schema which might have an autogen dependency
            if (oentry.autogen && (typeof oentry.autogen !== 'function' || oentry.autogen(key))) {
                schema.setAutogenDep(key, oentry.key);
            }
            // handle if this new schema has an autogen dependency
            if (entry.autogen && (typeof entry.autogen !== 'function' || entry.autogen(oentry.key))) {
                schema.setAutogenDep(oentry.key, key);
            }
        }
    }
    static clear(cls, key) {
        if (cls.hasOwnProperty('$schema')) {
            let oldSchema = cls.$schema.map[key];
            let idx = cls.$schema.entries.indexOf(oldSchema);
            if (idx !== -1) {
                cls.$schema.entries.splice(idx, 1);
            }
            delete cls.$schema.map[key];
            cls.$schema.clearAutogenDep(key);
        }
    }

    constructor(spec={}) {
        this.map = {};
        this.entries = [];
        // track auto generation mapping
        // -- key: key of attribute that is being set
        // -- value: set of attribute keys that need to be generated when the keyed attribute changes
        this.autogendeps = {};
        this.parser = null;
    }

    setAutogenDep(skey, dkey) {
        if (!skey in this.autogendeps) {
            this.autogendeps[skey] = new Set();
        }
        this.autogendeps[skey].set(dkey);
    }

    clearAutogenDep(key) {
        delete this.autogendeps[key];
        for (const akey of Object.keys(this.autogendeps)) {
            let set = this.autogendeps[akey];
            set.delete(key);
            if (!set.size) {
                delete this.autogendeps[akey];
            }
        }
    }


}

