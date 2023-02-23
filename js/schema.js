export { Schema };

class Schema {

    static apply(cls, key, spec={}) {
        if (cls.schema.hasOwnProperty(key)) delete cls.schema[key];
        cls.schema[key] = new this(key, spec);
        if (spec.autogen && !cls.$autogenKeys.includes(key)) {
            cls.$autogenKeys.push(key);
        }
    }
    static clear(cls, key) {
        if (cls.schema.hasOwnProperty(key)) delete cls.schema[key];
    }

    constructor(key, spec={}) {
        this.key = key;
        this.dflt = spec.dflt;
        this.specKey = spec.specKey || this.key;
        // getter function of format (object, specification) => { <function returning value> };
        this.getter = spec.getter;
        // setter function of format (object, specification, value) => { <function returning final value> };
        this.setter = spec.setter;
        this.autogen = spec.autogen;
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
        this.serializable = spec.hasOwnProperty('serializable') ? spec.serializable : true;
        this.serializeKey = spec.serializeKey ? spec.serializeKey : this.key;
        this.serializeFcn = spec.serializeFcn || ((sdata, target, value) => (typeof value === 'object') ? JSON.parse(JSON.stringify(value)) : value);


    }

}

