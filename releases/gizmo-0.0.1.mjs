var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// js/fmt.js
var Fmt2 = class {
  // STATIC METHODS ------------------------------------------------------
  static toString(name, ...args) {
    return `{${name}:${args.join("|")}}`;
  }
  static ofmt(obj, name, fmtRules = {}) {
    if (!obj)
      return "";
    let kvs = [];
    if (obj instanceof Map) {
      for (const [key, value] of obj) {
        let rule = fmtRules[key];
        if (!rule && value && value.constructor.name === "Object")
          rule = Fmt2.ofmt;
        if (!rule && value instanceof Map)
          rule = Fmt2.ofmt;
        kvs.push(key + ":" + (rule ? rule(value) : value));
      }
    } else {
      let keys = Object.keys(obj);
      for (const key of keys) {
        let rule = fmtRules[key];
        if (!rule && obj[key] && obj[key].constructor.name === "Object")
          rule = Fmt2.ofmt;
        if (!rule && obj[key] instanceof Map)
          rule = Fmt2.ofmt;
        kvs.push(key + ":" + (rule ? rule(obj[key]) : obj[key]));
      }
    }
    if (name) {
      return `{name:${kvs.join("|")}}`;
    } else {
      return `{${kvs.join("|")}}`;
    }
  }
};

// js/schema.js
var Schema = class {
  static apply(cls, key, spec = {}) {
    if (cls.schema.hasOwnProperty(key))
      delete cls.schema[key];
    cls.schema[key] = new this(key, spec);
    if (spec.autogen && !cls.$autogenKeys.includes(key)) {
      cls.$autogenKeys.push(key);
    }
  }
  static clear(cls, key) {
    if (cls.schema.hasOwnProperty(key))
      delete cls.schema[key];
  }
  constructor(key, spec = {}) {
    this.key = key;
    this.dflt = spec.dflt;
    this.specKey = spec.specKey || this.key;
    this.getter = spec.getter;
    this.setter = spec.setter;
    this.autogen = spec.autogen;
    this.parser = spec.parser || ((o, x) => {
      if (x.hasOwnProperty(this.specKey))
        return x[this.specKey];
      if (this.setter)
        return this.setter(o, x, this.dflt);
      return this.dflt;
    });
    this.link = spec.hasOwnProperty("link") ? spec.link : false;
    this.callable = spec.hasOwnProperty("callable") ? spec.callable : false;
    this.enumerable = this.callable ? false : spec.hasOwnProperty("enumerable") ? spec.enumerable : true;
    this.readonly = spec.hasOwnProperty("readonly") ? spec.readonly : false;
    this.renderable = spec.hasOwnProperty("renderable") ? spec.renderable : false;
    this.eventable = this.readonly ? false : spec.hasOwnProperty("eventable") ? spec.eventable : true;
    this.gizmo = spec.hasOwnProperty("gizmo") ? spec.gizmo : false;
    this.onSet = spec.onSet;
    this.serializable = spec.hasOwnProperty("serializable") ? spec.serializable : true;
    this.serializeKey = spec.serializeKey ? spec.serializeKey : this.key;
    this.serializeFcn = spec.serializeFcn || ((sdata, target, value) => target[this.serializeKey] = JSON.parse(JSON.stringify(value)));
  }
};

// js/event.js
var EvtLink = class {
  constructor(tag2, emitter, receiver, fcn, opts = {}) {
    this.tag = tag2;
    this.emitter = emitter;
    this.receiver = receiver;
    this.fcn = fcn;
    this.priority = opts.priority || 0;
    this.once = opts.hasOwnProperty("once") ? opts.once : false;
    this.filter = opts.filter;
  }
};
var EvtSystem = class {
  static isEmitter(obj) {
    return obj.hasOwnProperty("evtEmitterLinks") && obj.hasOwnProperty("evtCounts");
  }
  static isReceiver(obj) {
    return obj.hasOwnProperty("evtReceiverLinks");
  }
  static addCount(emitter, tag2) {
    if (emitter.evtCounts.has(tag2)) {
      emitter.evtCounts.set(tag2, emitter.evtCounts.get(tag2) + 1);
    } else {
      emitter.evtCounts.set(tag2, 1);
    }
  }
  static getCount(emitter, tag2) {
    if (emitter.evtCounts.has(tag2)) {
      return emitter.evtCounts.get(tag2);
    }
    return 0;
  }
  static addEmitterLink(emitter, link) {
    if (emitter.evtEmitterLinks.has(link.tag)) {
      emitter.evtEmitterLinks.get(link.tag).push(link);
    } else {
      emitter.evtEmitterLinks.set(link.tag, [link]);
    }
  }
  static delEmitterLink(emitter, link) {
    let links = emitter.evtEmitterLinks.get(link.tag);
    if (links) {
      let idx = links.indexOf(link);
      if (idx !== -1) {
        links.splice(idx, 1);
      }
      if (!links.length)
        emitter.evtEmitterLinks.delete(link.tag);
    }
  }
  static addReceiverLink(receiver, link) {
    receiver.evtReceiverLinks.push(link);
  }
  static delReceiverLink(receiver, link) {
    let idx = receiver.evtReceiverLinks.indexOf(link);
    if (idx !== -1) {
      receiver.evtReceiverLinks.splice(idx, 1);
    }
  }
  static clearEmitterLinks(emitter) {
    emitter.evtEmitterLinks.clear();
    for (const linksForTag of Array.from(emitter.evtEmitterLinks.values())) {
      for (const link of linksForTag) {
        console.log(`clear receiver link for ${Fmt2.ofmt(link)}`);
        if (link.emitter === emitter)
          this.delReceiverLink(link.receiver, link);
      }
    }
  }
  static clearReceiverLinks(receiver) {
    let links = Array.from(receiver.evtReceiverLinks);
    receiver.evtReceiverLinks.splice(0);
    for (const link of links) {
      if (link.emitter)
        this.delEmitterLink(link.emitter, link);
    }
  }
  static findLinksForEvt(obj, evt, links = []) {
    if (!obj || !evt)
      return;
    if (obj.evtEmitterLinks.has(evt.tag)) {
      links.push(...obj.evtEmitterLinks.get(evt.tag));
    }
    return links;
  }
  static trigger(emitter, tag2, atts) {
    let evt = new Evt(tag2, Object.assign({ actor: emitter }, atts));
    this.addCount(emitter, tag2);
    let links = [];
    this.findLinksForEvt(emitter, evt, links);
    this.findLinksForEvt(emitter.gctx, evt, links);
    if (!links.length)
      return;
    links.sort((a, b) => a.priority - b.priority);
    for (const link of links.filter((v) => v.once && (!v.filter || v.filter(evt)))) {
      this.delEmitterLink(emitter, link);
      this.delReceiverLink(link.receiver, link);
    }
    for (const link of links) {
      if (link.filter && !link.filter(evt))
        continue;
      link.fcn(evt);
    }
  }
  static listen(emitter, receiver, tag2, fcn, opts = {}) {
    let link = new EvtLink(tag2, emitter, receiver, fcn, opts);
    this.addEmitterLink(emitter, link);
    this.addReceiverLink(receiver, link);
  }
  static ignore(emitter, receiver, tag2, fcn) {
    let evt = new Evt(tag2, Object.assign({ actor: emitter }));
    let links = [];
    this.findLinksForEvt(emitter, evt, links);
    if (!links.length)
      return;
    for (const link of links) {
      if (link.receiver === receiver && (!fcn || fcn === link.fcn)) {
        this.delEmitterLink(emitter, link);
        this.delReceiverLink(receiver, link);
      }
    }
  }
};
var Evt = class {
  // CONSTRUCTOR ---------------------------------------------------------
  constructor(tag2, atts = {}) {
    this.tag = tag2;
    Object.assign(this, atts);
  }
  // METHODS -------------------------------------------------------------
  toString() {
    return Fmt2.ofmt(this, this.constructor.name);
  }
};
var ExtEvtEmitter = class {
  static apply(cls, spec = {}) {
    Schema.apply(cls, "evtCounts", { eventable: false, serializable: false, parser: () => /* @__PURE__ */ new Map() });
    Schema.apply(cls, "evtEmitterLinks", { eventable: false, serializable: false, parser: () => /* @__PURE__ */ new Map() });
  }
  static gen(spec = {}) {
    let cls = class {
      static schema = {};
      constructor() {
        for (const [key, schema] of Object.entries(this.constructor.schema))
          GizmoData.applySchema(schema, this, spec);
      }
    };
    this.apply(cls);
    return new cls();
  }
};
var ExtEvtReceiver = class {
  static apply(cls, spec = {}) {
    Schema.apply(cls, "evtReceiverLinks", { eventable: false, serializable: false, parser: () => [] });
  }
  static gen(spec = {}) {
    let cls = class {
      static schema = {};
      constructor() {
        for (const [key, schema] of Object.entries(this.constructor.schema))
          GizmoData.applySchema(schema, this, spec);
      }
    };
    this.apply(cls);
    return new cls();
  }
};

// js/stats.js
var Stats = class {
  static count(key) {
    if (!this.enabled)
      return;
    if (!this.kvs.hasOwnProperty(key))
      this.kvs[key] = 0;
    this.kvs[key]++;
  }
  static get(key) {
    return this.last[key];
  }
  static report() {
    if (this.perUpdate) {
      let plast = {};
      for (const key of Object.keys(this.last)) {
        plast[key] = Math.round(this.last[key] / this.updates);
      }
      console.log(Fmt2.ofmt(plast));
    } else {
      console.log(Fmt2.ofmt(this.last));
    }
  }
  static update(ctx) {
    this.elapsed += ctx.deltaTime;
    this.updates++;
    if (this.elapsed >= this.interval) {
      this.last = this.kvs;
      this.kvs = {};
      this.report();
      this.elapsed = 0;
      this.updates = 0;
    }
  }
};
__publicField(Stats, "kvs", {});
__publicField(Stats, "elapsed", 0);
__publicField(Stats, "interval", 1e3);
__publicField(Stats, "last", {});
__publicField(Stats, "enabled", false);
__publicField(Stats, "perUpdate", false);
__publicField(Stats, "updates", 0);

// js/gizmoData.js
var GizmoData = class {
  static get schema() {
    if (!this.hasOwnProperty("_schema"))
      this._schema = Object.assign({}, Object.getPrototypeOf(this)._schema);
    return this._schema;
  }
  static get $autogenKeys() {
    if (!this.hasOwnProperty("_autogenKeys")) {
      let superKeys = Object.getPrototypeOf(this)._autogenKeys;
      this._autogenKeys = superKeys ? Array.from(superKeys) : [];
    }
    return this._autogenKeys;
  }
  static init() {
    if (!(this.name in this.registry)) {
      this.registry[this.name] = this;
    }
  }
  static xspec(spec = {}) {
    this.init();
    return Object.assign({
      $gzx: true,
      cls: this.name
    }, spec);
  }
  static root(gzd) {
    while (gzd) {
      if (gzd.$trunk) {
        gzd = gzd.$trunk;
      } else {
        return gzd;
      }
    }
    return null;
  }
  static path(gzd) {
    let path = null;
    while (gzd.$trunk) {
      let key = gzd.$keyFcn();
      path = path ? `${key}.${path}` : key;
      gzd = gzd.$trunk;
    }
    return path;
  }
  static findInTrunk(gzd, filter) {
    for (let trunk = gzd.$trunk; trunk; trunk = trunk.$trunk) {
      if (filter(trunk))
        return trunk;
    }
    return null;
  }
  static findInPath(gzd, filter) {
    for (let node = gzd; node; node = node.$trunk) {
      if (filter(node))
        return node;
    }
    return null;
  }
  static applySchema(schema, gzd, spec) {
    let storedValue = schema.parser(gzd, spec);
    if (schema.link === "array") {
      storedValue = new GizmoDataArray({ trunk: gzd, array: storedValue ? storedValue : [], schema });
    }
    let d = {
      enumerable: schema.enumerable,
      // getter
      get: schema.getter ? () => schema.getter(gzd, spec) : () => storedValue
    };
    if (!schema.readonly && !schema.callable) {
      d.set = (newValue) => {
        if (schema.setter) {
          newValue = schema.setter(gzd, spec, newValue);
        }
        if (!Object.is(storedValue, newValue)) {
          let oldValue = storedValue;
          if (schema.link === "array") {
            if (storedValue)
              storedValue.clear();
            if (newValue)
              newValue = new GizmoDataArray({ trunk: gzd, array: newValue, schema });
            storedValue = newValue;
          } else if (schema.link) {
            if (storedValue)
              storedValue.$unlink();
            storedValue = newValue;
            if (storedValue)
              storedValue.$link(gzd, schema);
          } else {
            storedValue = newValue;
          }
          for (const agk of gzd.constructor.$autogenKeys) {
            if (schema.key === agk)
              continue;
            let agschema = gzd.constructor.schema[agk];
            if (typeof agschema.autogen === "function" && !agschema.autogen(schema.key))
              continue;
            gzd[agk] = agschema.dflt;
          }
          if (schema.onSet)
            schema.onSet(gzd, oldValue, newValue);
          if (schema.eventable && !gzd.constructor.findInPath(gzd, (gzn) => gzn.$schema && !gzn.$schema.eventable)) {
            let root = gzd.constructor.root(gzd);
            if (EvtSystem.isEmitter(root)) {
              let path = gzd.constructor.path(gzd);
              let key = path ? `${path}.${schema.key}` : schema.key;
              let renderable = schema.renderable || gzd.constructor.findInPath(gzd, (gzn) => gzn.$schema && gzn.$schema.renderable);
              EvtSystem.trigger(root, "gizmo.set", { set: { [key]: storedValue }, render: renderable });
            }
          }
        }
      };
    }
    if (schema.callable) {
      Object.defineProperty(Object.getPrototypeOf(gzd), schema.key, d);
    } else {
      Object.defineProperty(gzd, schema.key, d);
    }
    if (storedValue && schema.link && schema.link !== "array") {
      storedValue.$link(gzd, schema);
    }
  }
  constructor(spec = {}, applySchema = true) {
    this.constructor.init();
    let trunk;
    let schema;
    let keyFcn = () => schema ? schema.key : null;
    Object.defineProperty(this, "$trunk", {
      enumerable: false,
      get: () => {
        Stats.count("gzd.$trunk");
        return trunk;
      }
    });
    Object.defineProperty(this, "$schema", {
      enumerable: false,
      get: () => {
        Stats.count("gzd.$schema");
        return schema;
      }
    });
    Object.defineProperty(this, "$keyFcn", {
      enumerable: false,
      get: () => {
        Stats.count("gzd.$keyFcn");
        return keyFcn;
      }
    });
    Object.defineProperty(this, "$link", {
      get: () => (p, s, kf) => {
        trunk = p;
        schema = s;
        if (kf)
          keyFcn = kf;
        this.atLink(trunk);
        for (const agk of this.constructor.$autogenKeys) {
          let agschema = this.constructor.schema[agk];
          if (typeof agschema.autogen === "function" && !agschema.autogen("$trunk"))
            continue;
          this[agk] = agschema.dflt;
        }
      }
    });
    Object.defineProperty(this, "$unlink", {
      get: () => () => {
        let oldTrunk = trunk;
        trunk = null;
        schema = null;
        this.atUnlink(oldTrunk);
        for (const agk of this.constructor.$autogenKeys) {
          let agschema = this.constructor.schema[agk];
          if (typeof agschema.autogen === "function" && !agschema.autogen("$trunk"))
            continue;
          this[agk] = agschema.dflt;
        }
      }
    });
    if (applySchema) {
      for (const schema2 of Object.values(this.constructor.schema)) {
        this.constructor.applySchema(schema2, this, spec);
      }
    }
  }
  destroy() {
    for (const schema of Object.values(this.constructor.schema)) {
      if (schema.link && this[schema.key]) {
        if (schema.link === "array") {
          for (const gzd of this[schema.key])
            gzd.destroy();
        } else {
          this[schema.key].destroy();
        }
        this[schema.key] = null;
      }
    }
  }
  atLink(trunk) {
  }
  atUnlink(trunk) {
  }
  $regen() {
    for (const agk of this.constructor.$autogenKeys) {
      let agschema = this.constructor.schema[agk];
      this[agk] = agschema.dflt;
    }
  }
  toString() {
    return Fmt2.toString(this.constructor.name);
  }
};
__publicField(GizmoData, "registry", {});
var GizmoDataArray = class {
  constructor(spec = {}) {
    this.trunk = spec.trunk;
    this.array = spec.array || [];
    this.schema = spec.schema;
    let link = this.link.bind(this);
    let unlink = this.unlink.bind(this);
    let clear = this.clear.bind(this);
    for (const el of this.array)
      link(-1, el, false);
    return new Proxy(this.array, {
      get(obj, prop) {
        switch (prop) {
          case "clear":
            return () => {
              clear();
            };
          case "push":
            return (...v) => {
              let i = obj.length;
              for (const el of v)
                link(i++, el);
              return obj.push(...v);
            };
          case "unshift":
            return (...v) => {
              let i = 0;
              for (const el of v)
                link(i++, el);
              return obj.unshift(...v);
            };
          case "pop":
            return () => {
              let idx = obj.length - 1;
              let v = obj.pop();
              unlink(idx, v, idx >= 0);
              return v;
            };
          case "shift":
            return () => {
              let idx = obj.length ? 0 : -1;
              let v = obj.shift();
              unlink(idx, v, idx >= 0);
              return v;
            };
          case "splice":
            return (start, deleteCount = 0, ...v) => {
              let i = start;
              for (const el of v)
                link(i++, el);
              for (let i2 = 0; i2 < deleteCount; i2++)
                unlink(start + i2, obj[start + i2], i2 == v.length);
              return obj.splice(start, deleteCount, ...v);
            };
        }
        return obj[prop];
      },
      set(obj, prop, value) {
        if (!isNaN(prop)) {
          let idx = parseInt(prop);
          if (idx >= 0) {
            unlink(idx, obj[idx], false);
            link(idx, value);
          }
        }
        obj[prop] = value;
        return true;
      }
    });
  }
  link(idx, value, eventable = true) {
    if (value && value instanceof GizmoData) {
      value.$link(this.trunk, this.schema, () => {
        let i = this.array.indexOf(value);
        return `${this.schema.key}[${i}]`;
      });
    }
    if (eventable) {
      if (this.schema.eventable && !GizmoData.findInTrunk(this.trunk, (v) => v.$schema && !v.$schema.eventable)) {
        let root = GizmoData.root(this.trunk);
        if (EvtSystem.isEmitter(root)) {
          let path = GizmoData.path(this.trunk);
          let key = path ? `${path}.${this.schema.key}[${idx}]` : `${this.schema.key}[${idx}]`;
          EvtSystem.trigger(root, "gizmo.set", { "set": { [key]: value } });
        }
      }
    }
  }
  unlink(idx, value, eventable = true) {
    if (value && value.$gdl) {
      value.$gdl.trunk = null;
      value.$gdl.schema = null;
      value.$gdl.keyFcn = null;
    }
    if (eventable) {
      if (this.schema.eventable && !GizmoData.findInTrunk(this.trunk, (v) => v.$schema && !v.$schema.eventable)) {
        let root = GizmoData.root(this.trunk);
        if (EvtSystem.isEmitter(root)) {
          let path = GizmoData.path(this.trunk);
          let key = path ? `${path}.${this.schema.key}[${idx}]` : `${this.schema.key}[${idx}]`;
          EvtSystem.trigger(root, "gizmo.set", { "set": { [key]: null } });
        }
      }
    }
  }
  clear() {
    for (const v of this.array) {
      this.unlink(-1, v, false);
    }
  }
};

// js/sketch.js
var _Sketch = class extends GizmoData {
  // STATIC PROPERTIES ---------------------------------------------------
  static get zero() {
    return new _Sketch();
  }
  static {
    Schema.apply(_Sketch, "assetTag", { readonly: true });
    Schema.apply(_Sketch, "width", { dflt: 0, readonly: true });
    Schema.apply(_Sketch, "height", { dflt: 0, readonly: true });
    Schema.apply(_Sketch, "active", { dflt: false });
    Schema.apply(_Sketch, "smoothing", { dflt: null, renderable: true });
    Schema.apply(_Sketch, "alpha", { dflt: 1, renderable: true });
    Schema.apply(_Sketch, "ttl", { readonly: true, renderable: true, parser: (o, x) => x.hasOwnProperty("ttl") ? x.ttl : o.constructor.dfltTTL });
    Schema.apply(_Sketch, "done", { parser: () => false });
  }
  // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
  /**
   * create a new sketch
   */
  cpost(spec) {
    super.cpost(spec);
  }
  destroy() {
    this.disable();
    super.destroy();
  }
  // PROPERTIES ----------------------------------------------------------
  get duration() {
    return this.ttl;
  }
  // METHODS -------------------------------------------------------------
  enable() {
    this.active = true;
  }
  disable() {
    this.active = false;
  }
  /**
   * A sketch can be reset...
   */
  reset() {
  }
  /**
   * A sketch can be rendered...
   * @param {canvasContext} ctx - canvas context on which to draw
   */
  render(ctx, x = 0, y = 0, width = 0, height = 0) {
    Stats.count("sketch.render");
    if (!this.active)
      this.enable();
    let savedAlpha = ctx.globalAlpha;
    ctx.globalAlpha *= this.alpha;
    let savedSmoothing = ctx.imageSmoothingEnabled;
    if (this.smoothing !== null)
      ctx.imageSmoothingEnabled = this.smoothing;
    this.prerender(ctx, x, y, width, height);
    this.subrender(ctx, x, y, width, height);
    this.postrender(ctx, x, y, width, height);
    ctx.globalAlpha = savedAlpha;
    ctx.imageSmoothingEnabled = savedSmoothing;
  }
  prerender(ctx) {
  }
  subrender(ctx) {
  }
  postrender(ctx) {
  }
  /**
   * convert to string
   */
  toString() {
    return Fmt2.toString(this.constructor.name, this.tag);
  }
};
var Sketch = _Sketch;
// STATIC VARIABLES ----------------------------------------------------
__publicField(Sketch, "renderable", true);
__publicField(Sketch, "dfltTTL", 100);

// js/gizmoContext.js
var _GizmoContext = class extends GizmoData {
  // STATIC PROPERTIES ---------------------------------------------------
  static get main() {
    if (!this._main) {
      this._main = new _GizmoContext();
    }
    return this._main;
  }
  static set main(v) {
    this._main = v;
  }
  static {
    Schema.apply(_GizmoContext, "ctxid", { readonly: true, parser: (obj, x) => obj.constructor.ctxid++ });
    Schema.apply(_GizmoContext, "tag", { readonly: true, parser: (obj, x) => x.tag || `${obj.constructor.name}.${obj.ctxid}` });
    Schema.apply(_GizmoContext, "game", { dflt: null });
    Schema.apply(_GizmoContext, "userActive", { dflt: false });
    ExtEvtEmitter.apply(_GizmoContext);
  }
  // METHODS -------------------------------------------------------------
  toString() {
    return Fmt2.toString(this.constructor.name, this.tag);
  }
};
var GizmoContext = _GizmoContext;
// STATIC VARIABLES ----------------------------------------------------
__publicField(GizmoContext, "_main");
__publicField(GizmoContext, "ctxid", 1);

// js/timer.js
var _Timer = class extends GizmoData {
  static {
    Schema.apply(_Timer, "gctx", { readonly: true, parser: (o, x) => x.gctx || GizmoContext.main });
    Schema.apply(_Timer, "ttl", { eventable: false, dflt: _Timer.dfltTTL });
    Schema.apply(_Timer, "startTTL", { readonly: true, parser: (o, x) => o.ttl });
    Schema.apply(_Timer, "loop", { readonly: true, dflt: false });
    Schema.apply(_Timer, "cb", { readonly: true, dflt: () => false });
    Schema.apply(_Timer, "data", { readonly: true });
    ExtEvtReceiver.apply(_Timer);
  }
  constructor(spec = {}) {
    super(spec);
    this.onTock = this.onTock.bind(this);
    EvtSystem.listen(this.gctx, this, "game.tock", this.onTock);
  }
  destroy() {
    EvtSystem.clearReceiverLinks(this);
  }
  onTock(evt) {
    Stats.count("timer.ontock");
    this.ttl -= evt.deltaTime;
    if (this.ttl <= 0) {
      let overflow = -this.ttl;
      if (this.loop) {
        this.ttl += this.startTTL;
        if (this.ttl < 0)
          this.ttl = 0;
      } else {
        EvtSystem.ignore(this.gctx, this, "game.tock", this.onTock);
      }
      this.cb(Object.assign({ overflow, elapsed: this.startTTL + overflow }, evt, this.data));
    }
  }
};
var Timer = _Timer;
__publicField(Timer, "dfltTTL", 1e3);

// js/random.js
var Random = class {
  static random() {
    return Math.random();
  }
  static randomInt() {
    return Math.random() * Number.MAX_SAFE_INTEGER;
  }
  static rangeInt(min, max) {
    return Math.floor(Math.random() * (Math.abs(max - min) + 1)) + Math.min(min, max);
  }
  static jitter(base, pct) {
    let v = base * pct * Math.random();
    return Math.random() > 0.5 ? base + v : base - v;
  }
  static range(min, max) {
    return Math.random() * Math.abs(max - min) + Math.min(min, max);
  }
  static choose(arr) {
    if (arr.length === 0)
      return void 0;
    if (arr.length === 1)
      return arr[0];
    let choice = Math.floor(Math.random() * arr.length);
    return arr[choice];
  }
  static flip(pct = 0.5) {
    return Math.random() < pct;
  }
  static shuffle(iter) {
    let shuffled = [];
    let choices = Array.from(iter);
    while (choices.length) {
      let i = this.rangeInt(0, choices.length - 1);
      shuffled.push(choices[i]);
      choices.splice(i, 1);
    }
    return shuffled;
  }
  static chooseWeightedOption(arr) {
    if (!arr || !arr.length)
      return null;
    if (arr.length === 1)
      return arr[0];
    let weights = arr.reduce((pv, cv) => (pv.weight || 1) + (cv.weight || 1), 0);
    let choice = Math.random() * weights;
    for (let i = 0, t = 0; i < arr.length; i++) {
      let w = arr[i].weight || 1;
      if (choice >= t && choice < t + w) {
        return arr[i];
      }
      t += w;
    }
    return arr[arr.length - 1];
  }
};

// js/animation.js
var Animation = class extends Sketch {
  static {
    Schema.apply(this, "loop", { dflt: true });
    Schema.apply(this, "timer", { link: true, eventable: false });
    Schema.apply(this, "sketchIdx", { eventable: false, dflt: 0 });
    Schema.apply(this, "sketches", { dflt: [], readonly: true });
    Schema.apply(this, "sketch", { link: true, renderable: true, parser: (o, x) => o.sketches && o.sketches.length ? o.sketches[o.sketchIdx] : null });
    Schema.apply(this, "width", { readonly: true, getter: (o, x) => o.sketch ? o.sketch.width : 0 });
    Schema.apply(this, "height", { readonly: true, getter: (o, x) => o.sketch ? o.sketch.height : 0 });
    Schema.apply(this, "ttl", { readonly: true, getter: (o, x) => o.sketches.reduce((pv, cv) => pv + cv.ttl, 0) });
  }
  // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
  constructor(spec) {
    let sketches = spec.sketches || [];
    if (spec.jitter)
      spec.sketchIdx = Random.rangeInt(0, sketches.length - 1);
    super(spec);
    this.onTimer = this.onTimer.bind(this);
  }
  // EVENT HANDLERS ------------------------------------------------------
  onTimer(evt) {
    console.log(`animation timer`);
    this.timer = null;
    let overflow = evt.overflow || 0;
    do {
      let ok = this.advance();
      if (!ok) {
        if (!this.done)
          this.done = true;
        break;
      }
      if (this.sketch.ttl >= overflow) {
        this.timer = new Timer({ gctx: this.constructor.root(this).gctx, ttl: this.sketch.ttl - overflow, cb: this.onTimer });
        break;
      } else {
        overflow -= this.sketch.ttl;
      }
    } while (overflow > 0);
  }
  // METHODS -------------------------------------------------------------
  enable() {
    console.log(`animation enable done: ${this.done} sketches.length: ${this.sketches.length} active: ${this.active}`);
    if (!this.active) {
      console.log(`animation not active`);
      if (this.sketch)
        this.sketch.enable();
      if (!this.done && (this.sketches.length > 1 || !this.loop)) {
        console.log(`gctx: ${this.constructor.root(this).gctx} ttl: ${this.sketch.ttl}`);
        this.timer = new Timer({ gctx: this.constructor.root(this).gctx, ttl: this.sketch.ttl, cb: this.onTimer });
      }
    }
    super.enable();
  }
  disable() {
    if (this.sketch)
      this.sketch.disable();
    if (this.timer) {
      this.timer.destroy();
      this.timer = null;
    }
    super.disable();
  }
  reset() {
    this.sketchIdx = 0;
    this.done = false;
  }
  advance() {
    if (!this.sketches && !this.sketches.length)
      return false;
    let idx = this.sketchIdx + 1;
    if (idx >= this.sketches.length) {
      if (!this.loop)
        return false;
      idx = 0;
    }
    if (idx !== this.sketchIdx) {
      this.sketch.disable();
      this.sketchIdx = idx;
      this.sketch = this.sketches[this.sketchIdx];
      this.sketch.enable();
    }
    return true;
  }
  rewind() {
    if (!this.sketches && !this.sketches.length)
      return false;
    let idx = this.sketchIdx - 1;
    if (idx < 0) {
      if (!this.loop)
        return false;
      idx = this.sketches.length - 1;
    }
    if (idx !== this.sketchIdx) {
      this.sketch.disable();
      this.sketchIdx = idx;
      this.sketch = this.sketches[this.sketchIdx];
      this.sketch.enable();
    }
    return true;
  }
  subrender(ctx, x = 0, y = 0, width = 0, height = 0) {
    if (this.sketch)
      this.sketch.render(ctx, x, y, width, height);
  }
};

// js/animator.js
var Animator = class extends Sketch {
  static {
    Schema.apply(this, "trunkKey", { dflt: "state", readonly: true });
    Schema.apply(this, "sketches", { dflt: {}, readonly: true });
    Schema.apply(this, "transitions", { dflt: {}, readonly: true });
    Schema.apply(this, "state", { dflt: "idle", renderable: true, setter: (o, x, v) => {
      if (o.sketches.hasOwnProperty(v)) {
        if (o.sketch)
          o.sketch.disable();
        let targetSketch = o.sketches[v];
        let transition = false;
        if (o.sketch && o.transitions.hasOwnProperty(v)) {
          let possibles = o.transitions[v];
          let match;
          for (const possible of possibles) {
            if (!possible.sketch)
              return;
            if (possible.from === o.state) {
              match = possible.sketch;
              break;
            } else if (!possible.from) {
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
            EvtSystem.listen(root, o, "gizmo.updated", (evt) => {
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
    Schema.apply(this, "sketch", { link: true, renderable: true, parser: (o, x) => o.sketches ? o.sketches[o.state] : null });
    Schema.apply(this, "width", { readonly: true, getter: (o, x) => o.sketch ? o.sketch.width : 0 });
    Schema.apply(this, "height", { readonly: true, getter: (o, x) => o.sketch ? o.sketch.height : 0 });
    Schema.apply(this, "ttl", { readonly: true, getter: (o, x) => o.sketch ? o.sketch.ttl : 0 });
    Schema.apply(this, "done", { readonly: true, getter: (o, x) => o.sketch ? o.sketch.done : false });
    ExtEvtReceiver.apply(this);
  }
  // DATA CHANGE HANDLERS ------------------------------------------------
  atLink(trunk) {
    let self = this;
    if (EvtSystem.isEmitter(trunk)) {
      EvtSystem.listen(trunk, this, "gizmo.updated", (evt) => {
        self.state = evt.update.state;
      }, { filter: (evt) => evt.update.hasOwnProperty(this.trunkKey) });
    }
    if (this.state !== trunk[this.trunkKey])
      this.state = trunk[this.trunkKey];
  }
  atUnlink(trunk) {
    if (EvtSystem.isEmitter(trunk)) {
      EvtSystem.ignore(trunk, this, "gizmo.updated");
    }
  }
  // METHODS -------------------------------------------------------------
  enable() {
    if (!this.active) {
      if (this.sketch)
        this.sketch.enable();
    }
    super.enable();
  }
  disable() {
    if (this.sketch)
      this.sketch.disable();
    super.disable();
  }
  subrender(ctx, x = 0, y = 0, width = 0, height = 0) {
    if (this.sketch)
      this.sketch.render(ctx, x, y, width, height);
  }
};

// js/util.js
var Util = class {
  static _update(target, ext) {
    for (const [k, v] of Object.entries(ext)) {
      if (v && v.constructor && v.constructor.name === "Object") {
        target[k] = this._update(k in target ? target[k] : {}, v);
      } else {
        target[k] = v;
      }
    }
    return target;
  }
  /**
   * update performs a deep copy of the provided extension objects to the target object.
   * All updates are added as extensions to the original object, so nested values in the target are only overwritten if that same path/key is in the extension update
   * @param {*} target 
   * @param  {...any} exts 
   * @returns 
   */
  static update(target, ...exts) {
    if (target && typeof target === "object") {
      for (const ext of exts) {
        if (ext && typeof ext === "object") {
          this._update(target, ext);
        }
      }
    }
    return target;
  }
  static *kvWalk(obj, cache = /* @__PURE__ */ new WeakSet()) {
    if (cache.has(obj))
      return;
    if (Array.isArray(obj)) {
      cache.add(obj);
      for (let i = 0; i < obj.length; i++) {
        yield [i, obj[i], obj];
        yield* this.kvWalk(obj[i], cache);
      }
    } else if (typeof obj === "object" && obj !== null) {
      cache.add(obj);
      for (const [k, v] of Object.entries(obj)) {
        yield [k, v, obj];
        yield* this.kvWalk(v, cache);
      }
    }
  }
  static copy(entity, cache = /* @__PURE__ */ new WeakMap()) {
    if (cache.has(entity))
      return cache.get(entity);
    if (entity instanceof Map) {
      let c = /* @__PURE__ */ new Map();
      entity.forEach((value, key) => c.set(this.copy(key), this.copy(value)));
      return c;
    }
    if (entity instanceof Set) {
      let c = /* @__PURE__ */ new Set();
      entity.forEach((value) => c.add(this.copy(value)));
      return c;
    }
    if (Array.isArray(entity)) {
      let c = [];
      entity.forEach((value) => c.push(this.copy(value)));
      return c;
    }
    if (entity.constructor.name === "Object") {
      let c = {};
      cache.set(entity, c);
      return Object.assign(c, ...Object.keys(entity).map((prop) => ({ [prop]: this.copy(entity[prop], cache) })));
    }
    return entity;
  }
  static arrayBufferToBase64(buffer) {
    var binary = "";
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  static spliceStr(str, index, count, add) {
    var ar = str.split("");
    ar.splice(index, count, add);
    return ar.join("");
  }
};

// js/fileLoader.js
var FileLoader = class {
  // STATIC METHODS ------------------------------------------------------
  static async loadFile(src) {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.crossOrigin = "Anonymous";
      req.responseType = "arraybuffer";
      req.addEventListener("load", () => {
        return resolve(req.response);
      });
      req.addEventListener("error", (err) => {
        console.error("error: " + Fmt2.ofmt(err));
        reject(err);
      });
      req.open("GET", src, true);
      req.setRequestHeader("Cache-Control", "no-store");
      req.send();
    });
  }
  static async load(srcs, media = {}) {
    return new Promise((resolve) => {
      let promises = [];
      for (const src of srcs) {
        let promise = this.loadFile(src);
        promise.then((rslt) => {
          media[src] = rslt;
          if (this.dbg)
            console.log(`loaded tag: ${tag} rslt: ${Fmt2.ofmt(rslt)}`);
        });
        promises.push(promise);
      }
      Promise.all(promises).then(() => {
        if (this.dbg)
          console.log("media loaded...");
        return resolve(media);
      });
    });
  }
};
__publicField(FileLoader, "dbg", false);

// js/refs.js
function resolveImage(media, encode = true) {
  let promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.addEventListener("load", () => {
      return resolve(img);
    });
    img.addEventListener("error", (err) => {
      console.error("error: " + Fmt.ofmt(err));
      reject(err);
    });
    let src = encode ? `data:image/png;base64,${Util.arrayBufferToBase64(media)}` : media;
    img.src = src;
  });
  return promise;
}
var BaseRef = class {
  constructor(spec = {}) {
    if (spec.src)
      this.src = spec.src;
    this.dbg = spec.dbg || false;
  }
  resolve(media) {
    return Promise.resolve(media);
  }
};
var SfxRef = class extends BaseRef {
};
var _ImageRef = class extends BaseRef {
  static {
    _ImageRef._canvas = document.createElement("canvas");
    _ImageRef._ctx = _ImageRef._canvas.getContext("2d");
  }
  constructor(spec = {}) {
    super(spec);
    let scale = spec.scale || 1;
    this.scalex = spec.scalex || scale;
    this.scaley = spec.scaley || scale;
    this.smoothing = spec.hasOwnProperty("smoothing") ? spec.smoothing : true;
  }
  resolve(media) {
    let promise = resolveImage(media);
    if (this.scalex === 1 || this.scaley === 1) {
      return promise;
    } else {
      return promise.then((img) => {
        let canvas = this.constructor._canvas;
        let ctx = this.constructor._ctx;
        canvas.width = this.width * this.scalex;
        canvas.height = this.height * this.scaley;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let savedSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = this.smoothing;
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = savedSmoothing;
        return resolveImage(canvas.toDataURL(), false);
      });
    }
  }
};
var ImageRef = _ImageRef;
__publicField(ImageRef, "_canvas");
__publicField(ImageRef, "_ctx");
var SheetRef = class extends ImageRef {
  constructor(spec = {}) {
    super(spec);
    this.width = spec.width || 0;
    this.height = spec.height || 0;
    this.x = spec.x || 0;
    this.y = spec.y || 0;
  }
  resolve(media) {
    let promise = resolveImage(media);
    return promise.then((img) => {
      let canvas = this.constructor._canvas;
      let ctx = this.constructor._ctx;
      canvas.width = this.width * this.scalex;
      canvas.height = this.height * this.scaley;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let savedSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = this.smoothing;
      ctx.drawImage(img, this.x, this.y, this.width, this.height, 0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = savedSmoothing;
      return resolveImage(canvas.toDataURL(), false);
    });
  }
};
var AssetRef = class extends BaseRef {
  static xspec(spec = {}) {
    return Object.assign({ cls: "AssetRef" }, spec);
  }
  constructor(spec = {}) {
    super(spec);
    Object.assign(this, spec);
  }
};

// js/assets.js
var Assets = class {
  // STATIC METHODS ------------------------------------------------------
  static get(tag2, overrides = {}, gctx) {
    if (!gctx)
      gctx = GizmoContext.main;
    if (!gctx.game || !gctx.game.assets)
      return null;
    return gctx.game.assets.get(tag2, overrides);
  }
  static add(tag2, asset, gctx) {
    if (!gctx)
      gctx = GizmoContext.main;
    if (!gctx.game)
      return;
    if (!gctx.game.assets)
      gctx.game.assets = new Assets();
    gctx.game.assets.add(tag2, asset);
  }
  // CONSTRUCTOR ---------------------------------------------------------
  constructor(spec = {}) {
    this.specs = Array.from(spec.specs || []);
    this.media = {};
    this.assets = {};
  }
  // METHODS -------------------------------------------------------------
  /**
   * Register the given list of specifications with asset management.  Registered assets must be loaded prior to being available.
   * @param {} specs 
   */
  register(specs) {
    this.specs.push(...specs);
  }
  /**
   * unregister and release any loaded assets associated with the given list of asset specifications
   * @param {*} specs 
   */
  unregister(specs) {
    for (const spec of specs) {
      if (this.specs.includes(spec)) {
        let idx = this.specs.indexOf(spec);
        this.specs.splice(idx, 1);
      }
      if (spec.tag in this.assets) {
        delete this.assets[spec.tag];
      }
    }
  }
  getMediaRefs() {
    let mrefs = [];
    for (const [k, v, o] of Util.kvWalk(this.specs)) {
      if (v instanceof BaseRef && v.src && !mrefs.includes(v.src)) {
        mrefs.push(v.src);
      }
    }
    return mrefs;
  }
  async load() {
    this.media = {};
    await FileLoader.load(this.getMediaRefs(), this.media);
    for (const spec of this.specs) {
      let tag2 = spec.tag || "tag";
      if (this.assets.hasOwnProperty(tag2)) {
        console.error(`duplicate asset tag detected: ${tag2}, previous definition: ${Fmt2.ofmt(this.assets[tag2])}, skipping: ${Fmt2.ofmt(spec)}`);
        continue;
      }
      spec.assetTag = tag2;
      this.assets[tag2] = Object.assign({}, spec);
    }
    this.specs = [];
    await this.resolve();
    this.resolveAssets();
    this.media = {};
  }
  async resolve() {
    return new Promise((resolve) => {
      let promises = [];
      for (const [k, v, o] of Util.kvWalk(this.assets)) {
        if (v instanceof BaseRef && !(v instanceof AssetRef)) {
          let media = this.media[v.src];
          let promise = v.resolve(media);
          promise.then((media2) => {
            if (this.dbg)
              console.log(`resolved k: ${k} v: ${Fmt2.ofmt(v)} with media: ${media2}`);
            o[k] = media2;
          });
          promises.push(promise);
        }
      }
      return Promise.all(promises).then(() => {
        if (this.dbg)
          console.log("resolve finished");
        resolve();
      });
    });
  }
  resolveAssets() {
    for (const [k, v, o] of Util.kvWalk(this.assets)) {
      if (v instanceof AssetRef) {
        let spec = this.assets[v.tag];
        if (spec) {
          spec = Object.assign({}, spec, v);
          o[k] = spec;
        }
      }
    }
  }
  get(tag2, overrides = {}) {
    let spec = this.assets[tag2];
    if (!spec) {
      console.error(`-- missing asset for ${tag2}`);
      return null;
    }
    spec = Object.assign({}, spec, overrides);
    return spec;
  }
  add(tag2, asset) {
    asset.tag = tag2;
    this.assets[tag2] = asset;
  }
};

// js/vect.js
var Vect = class extends GizmoData {
  static {
    Schema.apply(this, "x", { dflt: 0 });
    Schema.apply(this, "y", { dflt: 0 });
  }
  // CONSTRUCTOR ---------------------------------------------------------
  constructor(xorv, y) {
    if (typeof xorv === "number") {
      super({ x: xorv || 0, y: y || 0 });
    } else {
      super(xorv);
    }
  }
  // STATIC PROPERTIES ---------------------------------------------------
  static get zero() {
    return new Vect(0, 0);
  }
  static get maxValue() {
    return new Vect(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  }
  // PROPERTIES ----------------------------------------------------------
  get mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  set mag(v) {
    this.normalize().mult(v);
  }
  get sqmag() {
    return this.x * this.x + this.y * this.y;
  }
  // STATIC METHODS ------------------------------------------------------
  static add(v1, v2) {
    let r = v1.copy();
    return r.add(v2);
  }
  static sub(v1, v2) {
    let r = v1.copy();
    return r.sub(v2);
  }
  static mult(v1, n) {
    let r = v1.copy();
    return r.mult(n);
  }
  static div(v1, n) {
    let r = v1.copy();
    return r.div(n);
  }
  static dot(v1, v2) {
    return v1.dot(v2);
  }
  static dist(v1, v2) {
    let r = new Vect(v1);
    return r.dist(v2);
  }
  static min(v1, v2) {
    let r = v1.copy();
    return r.min(v2);
  }
  static max(v1, v2) {
    let r = v1.copy();
    return r.max(v2);
  }
  static round(v1) {
    let r = new Vect(v1);
    return r.round();
  }
  static equals(v1, v2) {
    if (!v1 && !v2)
      return true;
    if (v1 && !v1 || !v1 && v2)
      return false;
    let r = new Vect(v1);
    return r.equals(v2);
  }
  // METHODS -------------------------------------------------------------
  copy() {
    return new Vect(this.x, this.y);
  }
  set(xorv, y) {
    if (typeof xorv === "number") {
      this.x = xorv;
      this.y = typeof y === "number" ? y : xorv;
    } else {
      this.x = xorv.x || 0;
      this.y = xorv.y || 0;
    }
    return this;
  }
  add(xorv, y) {
    if (typeof xorv === "number") {
      this.x += xorv;
      this.y += typeof y === "number" ? y : xorv;
    } else {
      this.x += xorv.x || 0;
      this.y += xorv.y || 0;
    }
    return this;
  }
  sub(xorv, y) {
    if (typeof xorv === "number") {
      this.x -= xorv;
      this.y -= typeof y === "number" ? y : xorv;
    } else {
      this.x -= xorv.x || 0;
      this.y -= xorv.y || 0;
    }
    return this;
  }
  mult(xorv, y) {
    if (typeof xorv === "number") {
      this.x *= xorv;
      this.y *= typeof y === "number" ? y : xorv;
    } else {
      this.x *= xorv.x || 0;
      this.y *= xorv.y || 0;
    }
    return this;
  }
  div(xorv, y) {
    if (typeof xorv === "number") {
      this.x /= xorv;
      this.y /= typeof y === "number" ? y : xorv;
    } else {
      this.x /= xorv.x || 0;
      this.y /= xorv.y || 0;
    }
    return this;
  }
  dot(xorv, y) {
    if (typeof xorv === "number") {
      return this.x * (xorv || 0) + this.y * (y || 0);
    } else {
      return this.x * (xorv.x || 0) + this.y * (xorv.y || 0);
    }
  }
  dist(xorv, y) {
    let dx, dy;
    if (typeof xorv === "number") {
      dx = (xorv || 0) - this.x;
      dy = (y || 0) - this.y;
    } else {
      dx = (xorv.x || 0) - this.x;
      dy = (xorv.y || 0) - this.y;
    }
    return Math.sqrt(dx * dx + dy * dy);
  }
  normalize() {
    let m = this.mag;
    if (m != 0)
      this.div(m);
    return this;
  }
  round() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    return this;
  }
  heading(rad = false) {
    let a = Math.atan2(this.y, this.x);
    if (rad)
      return a;
    return a * 180 / Math.PI;
  }
  rotate(angle, rad = false) {
    let ra = rad ? angle : angle * Math.PI / 180;
    ra += this.heading(true);
    let m = this.mag;
    this.x = Math.cos(ra) * m;
    this.y = Math.sin(ra) * m;
    return this;
  }
  angle(xorv, y, rad = false) {
    let x2, y2;
    if (typeof xorv === "number") {
      x2 = xorv || 0;
      y2 = y || 0;
    } else {
      x2 = xorv.x || 0;
      y2 = xorv.y || 0;
    }
    let a1 = Math.atan2(this.y, this.x);
    let a2 = Math.atan2(y2, x2);
    let angle = a2 - a1;
    if (Math.abs(angle) > Math.PI) {
      angle = angle > 0 ? -(angle - Math.PI) : -(angle + Math.PI);
    }
    if (rad)
      return angle;
    return angle * 180 / Math.PI;
  }
  equals(xorv, y) {
    if (typeof xorv === "number") {
      return this.x == xorv && this.y == y;
    }
    return this.x == xorv.x && this.y == xorv.y;
  }
  limit(max) {
    if (this.sqmag > max * max) {
      this.mag = max;
    }
    return this;
  }
  min(xorv, y) {
    if (typeof xorv === "number") {
      this.x = Math.min(this.x, xorv);
      this.y = Math.min(this.y, typeof y === "number" ? y : xorv);
    } else {
      this.x = Math.min(this.x, xorv.x);
      this.y = Math.min(this.y, xorv.y);
    }
    return this;
  }
  max(xorv, y) {
    if (typeof xorv === "number") {
      this.x = Math.max(this.x, xorv);
      this.y = Math.max(this.y, typeof y === "number" ? y : xorv);
    } else {
      this.x = Math.max(this.x, xorv.x);
      this.y = Math.max(this.y, xorv.y);
    }
    return this;
  }
  toString() {
    return Fmt2.toString("Vect", this.x, this.y);
  }
};

// js/bounds.js
var Bounds = class extends GizmoData {
  // STATIC METHODS ------------------------------------------------------
  static hasBounds(obj) {
    return obj && obj.minx !== void 0 && obj.maxx !== void 0 && obj.miny !== void 0 && obj.maxy !== void 0;
  }
  static _intersects(minx1, miny1, maxx1, maxy1, minx2, miny2, maxx2, maxy2, inclusive = false) {
    Stats.count("Bounds.intersects");
    let minx = Math.max(minx1, minx2);
    let maxx = Math.min(maxx1, maxx2);
    let miny = Math.max(miny1, miny2);
    let maxy = Math.min(maxy1, maxy2);
    let width = maxx - minx;
    let height = maxy - miny;
    if (inclusive && width >= 0 && height >= 0) {
      return new Bounds(minx, miny, width, height);
    } else if (!inclusive && width > 0 && height > 0) {
      return new Bounds(minx, miny, width, height);
    } else {
      return false;
    }
  }
  static _overlaps(minx1, miny1, maxx1, maxy1, minx2, miny2, maxx2, maxy2, inclusive = false) {
    Stats.count("Bounds.overlaps");
    let minx = Math.max(minx1, minx2);
    let maxx = Math.min(maxx1, maxx2);
    let miny = Math.max(miny1, miny2);
    let maxy = Math.min(maxy1, maxy2);
    if (inclusive) {
      return maxx >= minx && maxy >= miny;
    } else {
      return maxx > minx && maxy > miny;
    }
  }
  static _contains(minx, miny, maxx, maxy, x, y, inclusive) {
    if (inclusive) {
      return x >= minx && x <= maxx && y >= miny && y <= maxy;
    } else {
      return x > minx && x < maxx && y > miny && y < maxy;
    }
  }
  static intersects(obj1, obj2, inclusive = false) {
    return this._intersects(
      obj1.minx,
      obj1.miny,
      obj1.maxx,
      obj1.maxy,
      obj2.minx,
      obj2.miny,
      obj2.maxx,
      obj2.maxy,
      inclusive
    );
  }
  static overlaps(obj1, obj2, inclusive = false) {
    if ("minx" in obj1 && "miny" in obj1 && "maxx" in obj1 && "maxy" in obj1) {
      if ("minx" in obj2 && "miny" in obj2 && "maxx" in obj2 && "maxy" in obj2) {
        return this._overlaps(
          obj1.minx,
          obj1.miny,
          obj1.maxx,
          obj1.maxy,
          obj2.minx,
          obj2.miny,
          obj2.maxx,
          obj2.maxy,
          inclusive
        );
      } else if ("x" in obj2 && "y" in obj2) {
        return this._contains(
          obj1.minx,
          obj1.miny,
          obj1.maxx,
          obj1.maxy,
          obj2.x,
          obj2.y,
          inclusive
        );
      }
    } else if ("x" in obj1 && "y" in obj1) {
      if ("minx" in obj2 && "miny" in obj2 && "maxx" in obj2 && "maxy" in obj2) {
        return this._contains(
          obj2.minx,
          obj2.miny,
          obj2.maxx,
          obj2.maxy,
          obj1.x,
          obj1.y,
          inclusive
        );
      } else if (inclusive && "x" in obj2 && "y" in obj2) {
        return obj1.x === obj2.x && obj1.y === obj2.y;
      }
    }
    return false;
  }
  static contains(obj1, obj2, inclusive = false) {
    if ("minx" in obj1 && "miny" in obj1 && "maxx" in obj1 && "maxy" in obj1) {
      if ("x" in obj2 && "y" in obj2) {
        return this._contains(
          obj1.minx,
          obj1.miny,
          obj1.maxx,
          obj1.maxy,
          obj2.x,
          obj2.y,
          inclusive
        );
      }
    } else if ("x" in obj1 && "y" in obj1) {
      if (inclusive && "x" in obj2 && "y" in obj2) {
        return obj1.x === obj2.x && obj1.y === obj2.y;
      }
    }
    return false;
  }
  static containsXY(obj, x, y, inclusive = false) {
    if ("minx" in obj && "miny" in obj && "maxx" in obj && "maxy" in obj) {
      return this._contains(
        obj.minx,
        obj.miny,
        obj.maxx,
        obj.maxy,
        x,
        y,
        inclusive
      );
    } else if ("x" in obj && "y" in obj) {
      return inclusive && obj.x === x && obj.y === y;
    }
  }
  static {
    Schema.apply(this, "x", { dflt: 0 });
    Schema.apply(this, "y", { dflt: 0 });
    Schema.apply(this, "width", { dflt: 0 });
    Schema.apply(this, "height", { dflt: 0 });
  }
  // CONSTRUCTOR ---------------------------------------------------------
  /**
   * create a new bounds
   * @param {*} x - x position of minimum point within bounds
   * @param {*} y - y position of minimum point within bounds
   * @param {*} width - width in pixels
   * @param {*} height - height in pixels
   */
  constructor(x, y, width, height) {
    super({ x, y, width, height });
  }
  // STATIC PROPERTIES ---------------------------------------------------
  static get zero() {
    return new Bounds(0, 0, 0, 0);
  }
  // STATIC FUNCTIONS ----------------------------------------------------
  static fromMinMax(minx, miny, maxx, maxy) {
    return new Bounds(minx, miny, maxx - minx, maxy - miny);
  }
  // PROPERTIES ----------------------------------------------------------
  get pos() {
    return new Vect(this.x, this.y);
  }
  get minx() {
    return this.x;
  }
  get miny() {
    return this.y;
  }
  get min() {
    return new Vect(this.x, this.y);
  }
  get maxx() {
    return this.x + this.width;
  }
  get maxy() {
    return this.y + this.height;
  }
  get max() {
    return new Vect(this.x + this.width, this.y + this.height);
  }
  get midx() {
    return this.x + this.width * 0.5;
  }
  get midy() {
    return this.y + this.height * 0.5;
  }
  get mid() {
    return new Vect(this.x + this.width * 0.5, this.y + this.height * 0.5);
  }
  // STATIC FUNCTIONS ----------------------------------------------------
  static newOrExtend(ob, nb) {
    if (!ob)
      return nb;
    ob.extend(nb);
    return ob;
  }
  // METHODS -------------------------------------------------------------
  /**
   * make a copy of the current bounds and return
   */
  copy() {
    return new Bounds(this.x, this.y, this.width, this.height);
  }
  /**
   * determine if the given position (in world space) is within the current bounds
   * @param {Vect} pos - position to check
   */
  contains(pos, inclusive = false) {
    return Bounds.contains(this, pos, inclusive);
  }
  /**
   * determine if the given position (in world space) is within the current bounds
   */
  containsXY(x, y, inclusive = false) {
    return Bounds.containsXY(this, x, y, inclusive);
  }
  /**
   * determine if given bounds overlaps current bounds
   * @param {Bounds} other - other bounds to evaluate
   */
  overlaps(other, inclusive = false) {
    return Bounds.overlaps(this, other, inclusive);
  }
  /**
   * determine if given bounds intersects current bounds
   * @param {Bounds} other - other bounds to evaluate
   */
  intersects(other, inclusive = false) {
    return Bounds.intersects(this, other, inclusive);
  }
  /**
   * Extend the current bounds to include the extend of given bounds
   * @param {*} other 
   */
  extend(other) {
    if (!other)
      return this;
    if (other.minx < this.minx) {
      let delta = this.minx - other.minx;
      this.width += delta;
      this.x = other.minx;
    }
    if (other.maxx > this.maxx) {
      let delta = other.maxx - this.maxx;
      this.width += delta;
    }
    if (other.miny < this.miny) {
      let delta = this.miny - other.miny;
      this.height += delta;
      this.y = other.minx;
    }
    if (other.maxy > this.maxy) {
      let delta = other.maxy - this.maxy;
      this.height += delta;
    }
    return this;
  }
  equals(other) {
    if (!other)
      return this;
    if (this.x !== other.x)
      return false;
    if (this.y !== other.y)
      return false;
    if (this.width !== other.width)
      return false;
    if (this.height !== other.height)
      return false;
    return true;
  }
  toString() {
    return Fmt2.toString("Bounds", this.x, this.y, this.maxx, this.maxy, this.width, this.height);
  }
};

// js/hierarchy.js
var Hierarchy = class {
  // STATIC METHODS ------------------------------------------------------
  static adopt(parent, child) {
    if (child.parent) {
      this.orphan(child);
    }
    if (this.findInRoot(parent, (v) => v === child)) {
      console.error(`hierarchy loop detected ${child} already in root for parent: ${parent}`);
      return;
    }
    if ("children" in parent) {
      if (this.find(child, (v) => v === parent)) {
        console.error(`hierarchy loop detected ${child} already in children of parent: ${parent}`);
        return;
      }
    }
    child.parent = parent;
    if ("children" in parent)
      parent.children.push(child);
    EvtSystem.trigger(child, "gizmo.adopted", { parent, child });
    let root = this.root(parent);
    EvtSystem.trigger(child, "gizmo.rooted", { root });
    for (const dec of this.children(child)) {
      EvtSystem.trigger(dec, "gizmo.rooted", { root });
    }
  }
  static orphan(child) {
    if (child.parent) {
      let parent = child.parent;
      if ("children" in parent) {
        let idx = parent.children.indexOf(child);
        if (idx != -1) {
          parent.children.splice(idx, 1);
        }
      }
      child.parent = null;
      EvtSystem.trigger(child, "gizmo.orphaned", { parent, child });
    }
  }
  /**
   * find root for given object
   * @param {*} obj 
   */
  static root(obj) {
    while (obj && obj.parent)
      obj = obj.parent;
    return obj;
  }
  /**
   * find object in entire hierarchy
   * @param {*} obj 
   * @param {*} filter 
   */
  static findInRoot(obj, filter) {
    return this.find(this.root(obj), filter);
  }
  /**
   * find object in hierarchy (evaluating object and its children)
   * @param {*} obj 
   * @param {*} filter 
   */
  static find(obj, filter) {
    if (filter(obj))
      return obj;
    for (const child of obj.children || []) {
      if (filter(child))
        return child;
      let match = this.find(child, filter);
      if (match)
        return match;
    }
    return null;
  }
  /**
   * find object in parent hierarchy (evaluating parent hierarchy)
   * @param {*} obj 
   * @param {*} filter 
   */
  static findInParent(obj, filter) {
    for (let parent = obj.parent; parent; parent = parent.parent) {
      if (filter(parent))
        return parent;
    }
    return null;
  }
  static *children(obj, filter) {
    for (const child of Array.from(obj.children || [])) {
      if (child.children) {
        yield* this.children(child, filter);
      }
      if (!filter || filter(child))
        yield child;
    }
  }
};
var ExtHierarchy = class {
  static apply(cls, spec = {}) {
    Schema.apply(cls, "parent", { serializable: false, parser: () => null });
    Schema.apply(cls, "children", { gizmo: true, parser: (o, x) => {
      let v = x.children || [];
      for (const el of v)
        Hierarchy.adopt(o, el);
      return v;
    }, readonly: true });
  }
};

// js/gizmo.js
var _Gizmo = class extends GizmoData {
  // STATIC PROPERTIES ---------------------------------------------------
  static get gctx() {
    return GizmoContext.main;
  }
  // STATIC METHODS ------------------------------------------------------
  static listen(receiver, tag2, fcn, opts = {}) {
    EvtSystem.listen(this.gctx, receiver, tag2, fcn, opts);
  }
  static ignore(receiver, tag2, fcn) {
    EvtSystem.ignore(this.gctx, receiver, tag2, fcn);
  }
  static {
    Schema.apply(_Gizmo, "gctx", { readonly: true, serializable: false, parser: (obj, x) => x.gctx || GizmoContext.main });
    Schema.apply(_Gizmo, "gid", { readonly: true, parser: (obj, x) => _Gizmo.gid++ });
    Schema.apply(_Gizmo, "tag", { readonly: true, parser: (obj, x) => x.tag || `${obj.constructor.name}.${obj.gid}` });
    ExtEvtEmitter.apply(_Gizmo);
    ExtEvtReceiver.apply(_Gizmo);
    ExtHierarchy.apply(_Gizmo);
  }
  // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
  constructor(spec = {}) {
    super(spec, false);
    this.cpre(spec);
    for (const [key, schema] of Object.entries(this.constructor.schema)) {
      this.constructor.applySchema(schema, this, spec);
    }
    this.cpost(spec);
    this.cfinal(spec);
    EvtSystem.trigger(this, "gizmo.created");
  }
  destroy() {
    super.destroy();
    for (const child of Array.from(this.children || [])) {
      child.destroy();
    }
    Hierarchy.orphan(this);
    EvtSystem.trigger(this, "gizmo.destroyed");
    EvtSystem.clearEmitterLinks(this);
    EvtSystem.clearReceiverLinks(this);
  }
  // -- overridable constructor functions
  cpre(spec = {}) {
  }
  cpost(spec) {
  }
  cfinal(spec) {
  }
  // METHODS -------------------------------------------------------------
  toString() {
    return Fmt2.toString(this.constructor.name, this.gid, this.tag);
  }
};
var Gizmo = _Gizmo;
// STATIC VARIABLES ----------------------------------------------------
__publicField(Gizmo, "gid", 1);

// js/system.js
var _System = class extends Gizmo {
  static {
    Schema.apply(_System, "iterateTTL", { eventable: false, parser: (o, x) => x.hasOwnProperty("iterateTTL") ? x.iterateTTL : o.constructor.dfltIterateTTL });
    Schema.apply(_System, "dbg", { eventable: false, dflt: false });
    Schema.apply(_System, "active", { eventable: false, dflt: true });
    Schema.apply(_System, "matchFcn", { eventable: false, parser: (o, x) => x.hasOwnProperty("matchFcn") ? x.matchFcn : o.constructor.dfltMatchFcn || (() => false) });
    Schema.apply(_System, "store", { readonly: true, parser: (o, x) => x.store || /* @__PURE__ */ new Map() });
    Schema.apply(_System, "iterating", { eventable: false, dflt: false });
    Schema.apply(_System, "timer", { readonly: true, parser: (o, x) => new Timer({ gctx: o.gctx, ttl: o.iterateTTL, cb: o.onTimer, loop: true }) });
  }
  // CONSTRUCTOR ---------------------------------------------------------
  cpre(spec) {
    super.cpre(spec);
    this.onTimer = this.onTimer.bind(this);
    this.onGizmoCreated = this.onGizmoCreated.bind(this);
    this.onGizmoDestroyed = this.onGizmoDestroyed.bind(this);
  }
  cpost(spec) {
    super.cpost(spec);
    EvtSystem.listen(this.gctx, this, "gizmo.created", this.onGizmoCreated);
    EvtSystem.listen(this.gctx, this, "gizmo.destroyed", this.onGizmoDestroyed);
  }
  // EVENT HANDLERS ------------------------------------------------------
  onTimer(evt) {
    if (!this.active)
      return;
    this.iterating = true;
    this.prepare(evt);
    for (const e of this.store.values()) {
      Stats.count("sys.iterate");
      this.iterate(evt, e);
    }
    this.finalize(evt);
    this.iterating = false;
  }
  onGizmoCreated(evt) {
    if (this.matchFcn(evt.actor)) {
      if (this.dbg)
        console.log(`${this} onGizmoCreated: ${Fmt2.ofmt(evt)} gid: ${evt.actor.gid}`);
      this.store.set(evt.actor.gid, evt.actor);
    }
  }
  onGizmoDestroyed(evt) {
    if (this.dbg)
      console.log(`${this} onGizmoDestroyed: ${Fmt2.ofmt(evt)}`);
    this.store.delete(evt.actor.gid);
  }
  // METHODS -------------------------------------------------------------
  prepare(evt) {
  }
  iterate(evt, e) {
  }
  finalize(evt) {
  }
};
var System = _System;
// STATIC VARIABLES ----------------------------------------------------
__publicField(System, "dfltIterateTTL", 200);
__publicField(System, "dfltMatchFcn", () => false);

// js/keySystem.js
var KeySystem = class extends System {
  static {
    Schema.apply(this, "pressed", { readonly: true, parser: () => /* @__PURE__ */ new Map() });
  }
  cpre(spec) {
    if (!spec.hasOwnProperty("tag"))
      spec.tag = "keys";
    super.cpre(spec);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  }
  cpost(spec) {
    super.cpost(spec);
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
  }
  destroy() {
    super.destroy();
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp.bind);
  }
  onKeyDown(evt) {
    evt.preventDefault();
    if (!this.pressed.has(evt.key)) {
      if (this.dbg)
        console.log(`${this} evt.key down: ${evt.key}`);
      this.pressed.set(evt.key);
      EvtSystem.trigger(this, "key.down", { key: evt.key });
    }
  }
  onKeyUp(evt) {
    if (this.pressed.has(evt.key)) {
      if (this.dbg)
        console.log(`${this} evt.key up: ${evt.key}`);
      this.pressed.delete(evt.key);
      EvtSystem.trigger(this, "key.up", { key: evt.key });
    }
  }
  get(key) {
    return this.pressed.has(key) ? 1 : 0;
  }
};

// js/sfxSystem.js
var _SfxSystem = class extends System {
  static {
    Schema.apply(_SfxSystem, "ready", { serializeable: false, parser: false });
    Schema.apply(_SfxSystem, "decodes", { eventable: false, serializeable: false, parser: (o, x) => ({}) });
    Schema.apply(_SfxSystem, "ctx", { eventable: false, serializeable: false, parser: (o, x) => null });
    Schema.apply(_SfxSystem, "assets", { eventable: false, serializeable: false, readonly: true, parser: (o, x) => x.assets || o.gctx.game ? o.gctx.game.assets : new Assets() });
    Schema.apply(_SfxSystem, "streams", { eventable: false, serializeable: false, parser: (o, x) => [] });
    Schema.apply(_SfxSystem, "reqs", { eventable: false, serializeable: false, parser: (o, x) => [] });
    Schema.apply(_SfxSystem, "volumes", { eventable: false, serializeable: false, parser: (o, x) => x.volumes || {} });
    Schema.apply(_SfxSystem, "gains", { eventable: false, serializeable: false, parser: (o, x) => ({}) });
  }
  // STATIC METHODS ------------------------------------------------------
  static playSfx(actor, tag2, options = {}) {
    EvtSystem.trigger(actor, "sfx.play.requested", {
      assetTag: tag2,
      options
    });
  }
  static stopSfx(actor, tag2) {
    EvtSystem.trigger(actor, "sfx.stop.requested", {
      assetTag: tag2
    });
  }
  // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
  cpre(spec) {
    super.cpre(spec);
    this.onSfxRequested = this.onSfxRequested.bind(this);
  }
  cpost(spec) {
    super.cpost(spec);
    EvtSystem.listen(this.gctx, this, "sfx.play.requested", this.onSfxRequested);
    EvtSystem.listen(this.gctx, this, "sfx.stop.requested", this.onSfxRequested);
    if (!this.volumes.hasOwnProperty("master"))
      this.volumes.master = 1;
  }
  // EVENT HANDLERS ------------------------------------------------------
  onSfxRequested(evt) {
    this.reqs.push(evt);
    this.active = true;
  }
  // METHODS -------------------------------------------------------------
  prepare(evt) {
    let reqs = this.reqs;
    this.reqs = [];
    for (const req of reqs) {
      if (req.tag === "sfx.play.requested") {
        this.playRequest(req.actor, req.assetTag, req.options);
      } else {
        this.stopRequest(req.actor, req.assetTag);
      }
    }
  }
  finalize(evt) {
    this.active = false;
  }
  initialize() {
    if (!this.gctx.userActive)
      return;
    this.ctx = new AudioContext();
    this.ready = true;
  }
  async playRequest(actor, assetTag, options) {
    if (!options)
      options = {};
    if (!this.ready) {
      this.initialize();
      if (!this.ready)
        return;
    }
    let x_sfx = this.assets.get(assetTag);
    if (!x_sfx)
      return;
    let decoded;
    if (!this.decodes[assetTag]) {
      let buffer = new ArrayBuffer(x_sfx.audio.byteLength);
      new Uint8Array(buffer).set(new Uint8Array(x_sfx.audio));
      let p = this.ctx.decodeAudioData(buffer);
      p.then((d) => decoded = d);
      await p;
      this.decodes[assetTag] = decoded;
    } else {
      decoded = this.decodes[assetTag];
    }
    let stream = new AudioBufferSourceNode(this.ctx, {
      buffer: decoded,
      loop: x_sfx.loop
    });
    let link = stream;
    let volume = options.hasOwnProperty("volume") ? options.volume : x_sfx.hasOwnProperty("volume") ? x_sfx.volume : 1;
    if (volume !== 1) {
      let gainNode = this.ctx.createGain();
      gainNode.gain.value = volume;
      link.connect(gainNode);
      link = gainNode;
    }
    let channel = options.hasOwnProperty("channel") ? options.channel : x_sfx.channel;
    if (!this.gains[channel]) {
      if (!this.volumes.hasOwnProperty(channel)) {
        this.volumes[channel] = 1;
      }
      let gainNode = this.ctx.createGain();
      gainNode.gain.value = this.volumes[channel];
      this.gains[channel] = gainNode;
      link.connect(gainNode);
      link = gainNode;
    } else {
      link.connect(this.gains[channel]);
      link = null;
    }
    if (link) {
      if (!this.gains.master) {
        let gainNode = this.ctx.createGain();
        gainNode.gain.value = this.volumes.master;
        this.gains.master = gainNode;
        gainNode.connect(this.ctx.destination);
      }
      link.connect(this.gains.master);
    }
    this.streams.push({
      actor: actor.gid,
      assetTag,
      stream
    });
    stream.addEventListener("ended", () => {
      let idx = this.streams.findIndex((v) => v.stream === stream);
      if (idx !== -1)
        this.streams.splice(idx, 1);
    });
    stream.start(0);
  }
  stopRequest(actor, assetTag) {
    if (!actor)
      return;
    for (let i = this.streams.length - 1; i >= 0; i--) {
      if (actor.gid !== this.streams[i].actor)
        continue;
      if (assetTag && assetTag !== this.streams[i].assetTag)
        continue;
      this.streams.splice(i, 1);
    }
  }
  getVolume(tag2) {
    return this.volumes[tag2] || 1;
  }
  setVolume(tag2, value) {
    if (this.gains[tag2])
      this.gains[tag2].gain.value = value;
    this.volumes[tag2] = value;
  }
};
var SfxSystem = _SfxSystem;
// STATIC VARIABLES ----------------------------------------------------
__publicField(SfxSystem, "dfltVolume", 1);
__publicField(SfxSystem, "dfltIterateTTL", 0);

// js/xform.js
var XForm = class extends GizmoData {
  static {
    Schema.apply(this, "gripOffsetLeft", { dflt: 0 });
    Schema.apply(this, "gripOffsetRight", { dflt: 0 });
    Schema.apply(this, "gripOffsetTop", { dflt: 0 });
    Schema.apply(this, "gripOffsetBottom", { dflt: 0 });
    Schema.apply(this, "gripOffsetForceRatio", { dflt: false });
    Schema.apply(this, "x", { dflt: 0 });
    Schema.apply(this, "y", { dflt: 0 });
    Schema.apply(this, "fixedWidth", { dflt: 0 });
    Schema.apply(this, "fixedHeight", { dflt: 0 });
    Schema.apply(this, "left", { dflt: 0 });
    Schema.apply(this, "right", { dflt: 0 });
    Schema.apply(this, "top", { dflt: 0 });
    Schema.apply(this, "bottom", { dflt: 0 });
    Schema.apply(this, "origx", { dflt: 0.5 });
    Schema.apply(this, "origy", { dflt: 0.5 });
    Schema.apply(this, "scalex", { dflt: 1 });
    Schema.apply(this, "scaley", { dflt: 1 });
    Schema.apply(this, "angle", { dflt: 0 });
    Schema.apply(this, "bounds", { autogen: true, setter: (o, x) => o.computeBounds(), onSet: (o, k, v) => {
      let gzo = o.$trunk;
      if (gzo) {
        for (const child of gzo.children) {
          if (child.xform)
            child.xform.$regen();
        }
      }
    } });
  }
  // private internal state
  #savedTransform;
  constructor(spec = {}) {
    let gripOffset = spec.gripOffset || 0;
    if (!spec.hasOwnProperty("gripOffsetLeft"))
      spec.gripOffsetLeft = gripOffset;
    if (!spec.hasOwnProperty("gripOffsetRight"))
      spec.gripOffsetRight = gripOffset;
    if (!spec.hasOwnProperty("gripOffsetTop"))
      spec.gripOffsetTop = gripOffset;
    if (!spec.hasOwnProperty("gripOffsetBottom"))
      spec.gripOffsetBottom = gripOffset;
    let grip = spec.grip || 0;
    if (!spec.hasOwnProperty("left"))
      spec.left = grip;
    if (!spec.hasOwnProperty("right"))
      spec.right = grip;
    if (!spec.hasOwnProperty("top"))
      spec.top = grip;
    if (!spec.hasOwnProperty("bottom"))
      spec.bottom = grip;
    let orig = spec.hasOwnProperty("orig") ? spec.orig : 0.5;
    if (!spec.hasOwnProperty("origx"))
      spec.origx = orig;
    if (!spec.hasOwnProperty("origy"))
      spec.origy = orig;
    let scale = spec.scale || 1;
    if (!spec.hasOwnProperty("scalex"))
      spec.scalex = scale;
    if (!spec.hasOwnProperty("scaley"))
      spec.scaley = scale;
    super(spec);
  }
  // parent transform linked through gizmo relation (if any)
  get parent() {
    Stats.count("xform.parent");
    let v = this.$trunk;
    if (!v)
      return null;
    v = v.parent;
    if (!v)
      return null;
    return v.xform;
  }
  // grip positions relative to parent bounds/rect
  get gripLeft() {
    Stats.count("xform.gripLeft");
    let p = this.parent;
    if (p)
      return Math.round(p.minx + p.width * this.left);
    return 0;
  }
  get gripRight() {
    Stats.count("xform.gripRight");
    let p = this.parent;
    if (p)
      return Math.round(p.maxx - p.width * this.right);
    return 0;
  }
  get gripTop() {
    let p = this.parent;
    if (p)
      return Math.round(p.miny + p.height * this.top);
    return 0;
  }
  get gripBottom() {
    let p = this.parent;
    if (p)
      return Math.round(p.maxy - p.height * this.bottom);
    return 0;
  }
  // grip dimensions in pixels
  get gripWidth() {
    let p = this.parent;
    if (p)
      return Math.round(p.maxx - p.width * this.right) - Math.round(p.minx + p.width * this.left);
    return 0;
  }
  get gripHeight() {
    let p = this.parent;
    if (p)
      return Math.round(p.maxy - p.height * this.bottom) - Math.round(p.miny + p.height * this.top);
    return 0;
  }
  // delta from parent origin to current origin in pixels
  get deltax() {
    let gl = this.gripLeft;
    let gr = this.gripRight;
    if (gl === gr) {
      return gl + this.x;
    } else {
      let left = gl + this.gripOffsetLeft;
      let right = gr - this.gripOffsetRight;
      return left + Math.round((right - left) * this.origx);
    }
  }
  get deltay() {
    let gt = this.gripTop;
    let gb = this.gripBottom;
    if (gt === gb) {
      return gt + this.y;
    } else {
      let top = gt + this.gripOffsetTop;
      let bottom = gb - this.gripOffsetBottom;
      return top + Math.round((bottom - top) * this.origy);
    }
  }
  // the defined rect boundary in world coordinates
  get worldBounds() {
  }
  // min/max x/y returns min/max of bounds/rect in local space
  get minx() {
    return this.bounds.x;
  }
  get miny() {
    return this.bounds.y;
  }
  get maxx() {
    return this.bounds.x + this.bounds.width;
  }
  get maxy() {
    return this.bounds.y + this.bounds.height;
  }
  get width() {
    return this.bounds.width;
  }
  get height() {
    return this.bounds.height;
  }
  // inverse scale of transform
  get iscalex() {
    return this.scalex ? 1 / this.scalex : 0;
  }
  get iscaley() {
    return this.scaley ? 1 / this.scaley : 0;
  }
  computeBounds() {
    let minx = 0, miny = 0, width = 0, height = 0;
    if (this.gripLeft === this.gripRight) {
      minx = Math.round(-this.fixedWidth * this.origx);
      width = this.fixedWidth;
    } else {
      let left = this.gripLeft + this.gripOffsetLeft;
      minx = left - this.deltax;
      let right = this.gripRight - this.gripOffsetRight;
      width = right - left;
    }
    if (this.gripTop === this.gripBottom) {
      miny = Math.round(-this.fixedHeight * this.origy);
      height = this.fixedHeight;
    } else {
      let top = this.gripTop + this.gripOffsetTop;
      miny = top - this.deltay;
      let bottom = this.gripBottom - this.gripOffsetBottom;
      height = bottom - top;
    }
    if (this.gripOffsetForceRatio) {
      let desiredRatio = typeof this.gripOffsetForceRatio === "number" ? this.gripOffsetForceRatio : this.fixedWidth && this.fixedHeight ? this.fixedWidth / this.fixedHeight : 1;
      let currentRatio = width / height;
      if (this.gripLeft !== this.gripRight) {
        if (width && height) {
          if (currentRatio > desiredRatio) {
            let adjustedWidth = height * desiredRatio;
            minx += Math.round((width - adjustedWidth) * this.origx);
            width = adjustedWidth;
          }
        }
      }
      if (this.gripTop !== this.gripBottom) {
        if (width && height) {
          if (currentRatio < desiredRatio) {
            let adjustedHeight = width / desiredRatio;
            miny += Math.round((height - adjustedHeight) * this.origy);
            height = adjustedHeight;
          }
        }
      }
    }
    return new Bounds(minx, miny, width, height);
  }
  // apply local coords, then scale, rotation, translation
  apply(ctx, chain = true) {
    if (chain && this.parent)
      this.parent.apply(ctx);
    let deltax = this.deltax;
    let deltay = this.deltay;
    this.#savedTransform = ctx.getTransform();
    if (deltax || deltay)
      ctx.translate(deltax, deltay);
    if (this.angle)
      ctx.rotate(this.angle);
    if (this.scalex !== 1 || this.scaley !== 1)
      ctx.scale(this.scalex, this.scaley);
  }
  // revert transform
  revert(ctx, chain = true) {
    ctx.setTransform(this.#savedTransform);
    if (chain && this.parent)
      this.parent.revert(ctx);
  }
  /**
   * translate world position to local position
   * @param {*} worldPos 
   */
  getLocal(worldPos, chain = true) {
    let localPos;
    if (chain && this.parent) {
      localPos = this.parent.getLocal(worldPos);
    } else {
      localPos = worldPos.copy();
    }
    let deltax = this.deltax;
    let deltay = this.deltay;
    if (deltax || deltay)
      localPos.sub(deltax, deltay);
    if (this.angle)
      localPos.rotate(-this.angle, true);
    if (this.scalex !== 1 || this.scaley !== 1)
      localPos.div(this.scalex, this.scaley);
    return localPos.round();
  }
  /**
   * translate local position to world position
   * @param {*} localPos 
   */
  getWorld(localPos, chain = true) {
    let worldPos = localPos.copy();
    if (this.scalex !== 1 || this.scaley !== 1)
      worldPos.mult(this.scalex, this.scaley);
    if (this.angle)
      worldPos.rotate(this.angle, true);
    let deltax = this.deltax;
    let deltay = this.deltay;
    if (deltax || deltay)
      worldPos.add(deltax, deltay);
    if (chain && this.parent)
      worldPos = this.parent.getWorld(worldPos);
    return worldPos.round();
  }
  renderGrip(ctx, x, y, which = "tl", opts = {}) {
    let size = opts.gripSize || 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    switch (which) {
      case "tl":
        ctx.lineTo(x - size * 2, y - size);
        ctx.lineTo(x - size, y - size * 2);
        break;
      case "tr":
        ctx.lineTo(x + size * 2, y - size);
        ctx.lineTo(x + size, y - size * 2);
        break;
      case "bl":
        ctx.lineTo(x - size * 2, y + size);
        ctx.lineTo(x - size, y + size * 2);
        break;
      case "br":
        ctx.lineTo(x + size * 2, y + size);
        ctx.lineTo(x + size, y + size * 2);
        break;
    }
    ctx.fillStyle = opts.gripColor || "rgba(255,0,255,.5";
    ctx.fill();
  }
  renderOrigin(ctx, x, y, opts = {}) {
    let size = opts.originSize || 4;
    ctx.fillStyle = opts.originColor || "rgba(255,0,0,.5)";
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
  }
  renderBounds(ctx, left, top, width, height, opts = {}) {
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = opts.boundsColor || "rgba(255,255,0,.5)";
    ctx.strokeRect(left, top, width, height);
    ctx.setLineDash([]);
  }
  render(ctx, chain = false, color = "rgba(255,255,0,.5)", opts = {}) {
    if (chain && this.parent)
      this.parent.apply(ctx);
    if (this.parent) {
      this.renderGrip(ctx, this.gripLeft, this.gripTop, "tl", opts);
      this.renderGrip(ctx, this.gripRight, this.gripTop, "tr", opts);
      this.renderGrip(ctx, this.gripLeft, this.gripBottom, "bl", opts);
      this.renderGrip(ctx, this.gripRight, this.gripBottom, "br", opts);
    }
    let deltax = this.deltax;
    let deltay = this.deltay;
    this.#savedTransform = ctx.getTransform();
    if (deltax || deltay)
      ctx.translate(deltax, deltay);
    this.renderOrigin(ctx, 0, 0, opts);
    if (!this.parent) {
      this.renderGrip(ctx, this.gripLeft, this.gripTop, "tl", opts);
      this.renderGrip(ctx, this.gripRight, this.gripTop, "tr", opts);
      this.renderGrip(ctx, this.gripLeft, this.gripBottom, "bl", opts);
      this.renderGrip(ctx, this.gripRight, this.gripBottom, "br", opts);
    }
    if (this.angle)
      ctx.rotate(this.angle);
    if (this.scalex !== 1 || this.scaley !== 1)
      ctx.scale(this.scalex, this.scaley);
    this.renderBounds(ctx, this.minx, this.miny, this.width, this.height, opts);
    ctx.setTransform(this.#savedTransform);
    if (chain && this.parent)
      this.parent.revert(ctx);
  }
  $onLink() {
    console.log(`-- xform onlink ${this.$gdl.parent}`);
  }
  toString() {
    return Fmt2.toString(this.constructor.name, this.minx, this.miny, this.width, this.height);
  }
};

// js/uiView.js
var _UiView = class extends Gizmo {
  static {
    Schema.apply(_UiView, "visible", { dflt: true, renderable: true });
    Schema.apply(_UiView, "active", { dflt: false });
    Schema.apply(_UiView, "xform", { link: true, renderable: true, parser: (o, x) => x.xform || new XForm() });
    Schema.apply(_UiView, "smoothing", { dflt: null, renderable: true });
    Schema.apply(_UiView, "alpha", { dflt: 1, renderable: true });
    Schema.apply(_UiView, "dbg", { dflt: false });
    Schema.apply(_UiView, "mask", { dflt: false });
    Schema.apply(_UiView, "mouseOver", { dflt: false, renderable: true });
    Schema.apply(_UiView, "mousePressed", { dflt: false, renderable: true });
    Schema.apply(_UiView, "mousePriority", { dflt: 0, renderable: true });
    Schema.apply(_UiView, "mouseBlock", { dflt: false, renderable: true });
    Schema.apply(_UiView, "mouseClickedSound");
    Schema.apply(_UiView, "mouseEnteredSound");
    Schema.apply(_UiView, "mouseExitedSound");
  }
  // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
  cpre(spec = {}) {
    super.cpre(spec);
    this.onMouseEntered = this.onMouseEntered.bind(this);
    this.onMouseExited = this.onMouseExited.bind(this);
    this.onMouseClicked = this.onMouseClicked.bind(this);
    this.onRooted = this.onRooted.bind(this);
    this.onOrphaned = this.onOrphaned.bind(this);
  }
  cpost(spec = {}) {
    super.cpost(spec);
    EvtSystem.listen(this, this, "mouse.clicked", this.onMouseClicked);
    EvtSystem.listen(this, this, "gizmo.updated", this.onMouseEntered, { filter: (evt) => evt.update && evt.update.mouseOver === true });
    EvtSystem.listen(this, this, "gizmo.updated", this.onMouseExited, { filter: (evt) => evt.update && evt.update.mouseOver === false });
    EvtSystem.listen(this, this, "gizmo.rooted", this.onRooted);
    EvtSystem.listen(this, this, "gizmo.orphaned", this.onOrphaned);
  }
  cfinal(spec) {
    super.cfinal(spec);
    if (this.active)
      this.enable();
  }
  destroy() {
    this.disable();
    super.destroy();
  }
  // EVENT HANDLERS ------------------------------------------------------
  onMouseClicked(evt) {
    if (this.mouseClickedSound)
      SfxSystem.playSfx(this, this.mouseClickedSound);
  }
  onMouseEntered(evt) {
    if (this.mouseEnteredSound)
      SfxSystem.playSfx(this, this.mouseEnteredSound);
  }
  onMouseExited(evt) {
    if (this.mouseExitedSound)
      SfxSystem.playSfx(this, this.mouseExitedSound);
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
    if (this.xform)
      this.xform.$regen();
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
    if (!this.parent)
      ctx.save();
    if (!this.visible)
      return;
    let savedAlpha = ctx.globalAlpha;
    ctx.globalAlpha *= this.alpha;
    let savedSmoothing = ctx.imageSmoothingEnabled;
    if (this.smoothing !== null)
      ctx.imageSmoothingEnabled = this.smoothing;
    this.xform.apply(ctx, false);
    if (this.mask) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
      ctx.clip();
    }
    this.prerender(ctx);
    this.subrender(ctx);
    this.childrender(ctx);
    this.postrender(ctx);
    if (this.mask) {
      ctx.restore();
    }
    this.xform.revert(ctx, false);
    ctx.globalAlpha = savedAlpha;
    ctx.imageSmoothingEnabled = savedSmoothing;
    if (this.dbg && this.dbg.xform)
      this.xform.render(ctx);
    if (!this.parent)
      ctx.restore();
  }
  resize(width, height) {
    if (width != this.xform.width || height != this.xform.height) {
      this.xform.width = width;
      this.xform.height = height;
      this.evt.trigger(this.constructor.evtResized, { actor: this, width, height });
      for (const child of Hierarchy.children(this)) {
        child.evt.trigger(child.constructor.evtResized, { actor: child, root: this });
      }
      this.evt.trigger(this.constructor.evtUpdated, { actor: this });
    }
  }
  toString() {
    return Fmt2.toString(this.constructor.name, this.gid, this.tag);
  }
};
var UiView = _UiView;
// STATIC VARIABLES ----------------------------------------------------
__publicField(UiView, "mousable", true);
__publicField(UiView, "renderable", true);

// js/uiCanvas.js
var _UiCanvas = class extends UiView {
  // STATIC PROPERTIES ---------------------------------------------------
  static getCanvas(id = this.dfltCanvasID) {
    let canvas = document.getElementById(id);
    if (canvas)
      return canvas;
    canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.constructed = true;
    document.body.appendChild(canvas);
    return canvas;
  }
  static {
    Schema.apply(_UiCanvas, "active", { dflt: true });
    Schema.apply(_UiCanvas, "canvasId", { readonly: true, parser: (o, x) => x.canvasId || o.constructor.dfltCanvasID });
    Schema.apply(_UiCanvas, "canvas", { readonly: true, parser: (o, x) => x.canvas || o.constructor.getCanvas(o.canvasId) });
    Schema.apply(_UiCanvas, "xform", { link: true, renderable: true, parser: (o, x) => x.xform || new XForm({ origx: 0, origy: 0, fixedWidth: o.canvas.width, fixedHeight: o.canvas.height }) });
    Schema.apply(_UiCanvas, "ctx", { readonly: true, parser: (o, x) => o.canvas.getContext("2d") });
    Schema.apply(_UiCanvas, "fitToWindow", { readonly: true, dflt: true });
  }
  // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
  cpre(spec) {
    super.cpre(spec);
    this.onWindowResize = this.onWindowResize.bind(this);
  }
  cpost(spec) {
    super.cpost(spec);
    let targetWidth = this.xform.fixedWidth;
    let targetHeight = this.xform.fixedHeight;
    if (this.fitToWindow) {
      targetWidth = window.innerWidth;
      targetHeight = window.innerHeight;
    }
    this.canvas.width = this.xform.fixedWidth = targetWidth;
    this.canvas.height = this.xform.fixedHeight = targetHeight;
    if (this.fitToWindow) {
      window.addEventListener("resize", this.onWindowResize);
    }
  }
  destroy() {
    if (this.canvas && this.canvas.constructed)
      this.canvas.remove();
    window.removeEventListener("resize", this.onWindowResize);
    super.destroy();
  }
  // METHODS -------------------------------------------------------------
  onWindowResize() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    this.canvas.width = width;
    this.canvas.height = height;
    this.xform.fixedWidth = width;
    this.xform.fixedHeight = height;
    EvtSystem.trigger(this, "gizmo.resized", { width, height });
  }
};
var UiCanvas = _UiCanvas;
// STATIC VARIABLES ----------------------------------------------------
__publicField(UiCanvas, "dfltCanvasID", "game.canvas");
__publicField(UiCanvas, "canvasable", true);

// js/mouseSystem.js
var MouseSystem = class extends System {
  // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
  cpre(spec = {}) {
    super.cpre(spec);
    this.onClicked = this.onClicked.bind(this);
    this.onMoved = this.onMoved.bind(this);
    this.onPressed = this.onPressed.bind(this);
    this.onUnpressed = this.onUnpressed.bind(this);
  }
  cpost(spec = {}) {
    super.cpost(spec);
    let canvasId = spec.canvasId || UiCanvas.dfltCanvasID;
    this.canvas = spec.canvas || UiCanvas.getCanvas(canvasId);
    this.x = 0;
    this.y = 0;
    this.pressed = false;
    this.clicked = false;
    this.dbg = spec.dbg;
    this.locator = spec.locator;
    this.canvas.addEventListener("mousemove", this.onMoved.bind(this));
    this.canvas.addEventListener("click", this.onClicked.bind(this));
    this.canvas.addEventListener("mousedown", this.onPressed.bind(this));
    this.canvas.addEventListener("mouseup", this.onUnpressed.bind(this));
  }
  destroy() {
    this.canvas.removeEventListener("mousemove", this.onMoved);
    this.canvas.removeEventListener("click", this.onClicked);
    this.canvas.removeEventListener("mousedown", this.onPressed);
    this.canvas.removeEventListener("mouseup", this.onUnpressed);
  }
  // EVENT HANDLERS ------------------------------------------------------
  onClicked(evt) {
    let data = {
      actor: this,
      old_x: this.x,
      old_y: this.y,
      x: evt.offsetX,
      y: evt.offsetY
    };
    this.x = evt.offsetX;
    this.y = evt.offsetY;
    this.active = true;
    this.clicked = true;
    EvtSystem.trigger(this, "mouse.clicked", data);
  }
  onMoved(evt) {
    let data = {
      actor: this,
      old_x: this.x,
      old_y: this.y,
      x: evt.offsetX,
      y: evt.offsetY
    };
    this.x = evt.offsetX;
    this.y = evt.offsetY;
    this.active = true;
    EvtSystem.trigger(this, "mouse.moved", data);
  }
  onPressed(evt) {
    this.pressed = true;
    this.active = true;
  }
  onUnpressed(evt) {
    this.pressed = false;
    this.active = true;
  }
  // METHODS -------------------------------------------------------------
  prepare(evt) {
    this.targets = [];
  }
  iterate(evt, e) {
    if (!e.active)
      return;
    if (Hierarchy.findInParent(e, (v) => !v.active))
      return;
    let lpos = e.xform.getLocal(new Vect(this.x, this.y));
    let contains = Bounds.contains(e.xform, lpos);
    if (contains) {
      this.targets.push(e);
    }
    if (e.mouseOver && !contains) {
      e.mouseOver = false;
      if (this.dbg)
        console.log(`${this} mouse left: ${e}`);
    }
    if (e.mousePressed && (!contains || !this.pressed)) {
      e.mousePressed = false;
      if (this.dbg)
        console.log(`${this} mouse unpressed: ${e}`);
    }
  }
  finalize(evt) {
    if (this.targets.length) {
      this.targets.sort((a, b) => b.mousePriority - a.mousePriority);
      let mouseData = { x: this.x, y: this.y };
      for (const e of this.targets) {
        if (this.clicked) {
          if (this.dbg)
            console.log(`${this} mouse clicked: ${e}`);
          EvtSystem.trigger(e, "mouse.clicked", { mouse: mouseData });
        }
        if (!e.mouseOver) {
          e.mouseOver = true;
          if (this.dbg)
            console.log(`${this} mouse entered: ${e}`);
        }
        if (this.pressed && !e.mousePressed) {
          e.mousePressed = true;
          if (this.dbg)
            console.log(`${this} mouse pressed: ${e}`);
        }
        if (e.mouseBlock)
          break;
      }
    }
    this.active = false;
    this.clicked = false;
  }
};
// STATIC VARIABLES ----------------------------------------------------
__publicField(MouseSystem, "dfltIterateTTL", 0);
__publicField(MouseSystem, "dfltMatchFcn", (v) => v.constructor.mousable);

// js/renderSystem.js
var RenderSystem = class extends System {
  // CONSTRUCTOR ---------------------------------------------------------
  cpre(spec) {
    super.cpre(spec);
    this.onViewUpdated = this.onViewUpdated.bind(this);
    this.onRenderNeeded = this.onRenderNeeded.bind(this);
    this.onEntityAdopted = this.onEntityAdopted.bind(this);
  }
  cpost(spec) {
    super.cpost(spec);
    EvtSystem.listen(this.gctx, this, "gizmo.updated", this.onViewUpdated);
    EvtSystem.listen(this.gctx, this, "render.needed", this.onRenderNeeded);
    EvtSystem.listen(this.gctx, this, "gizmo.adopted", this.onEntityAdopted);
    this.stayActive = false;
  }
  // EVENT HANDLERS ------------------------------------------------------
  onEntityAdded(evt) {
    let actor = evt.actor;
    if (this.matchFcn(actor)) {
      this.store.set(evt.actor.gid, evt.actor);
      this.active = true;
      if (this.iterating)
        this.stayActive = true;
    }
  }
  onEntityRemoved(evt) {
    let actor = evt.actor;
    if (this.mathcFcn(actor)) {
      this.store.delete(evt.actor.gid);
      this.active = true;
      if (this.iterating)
        this.stayActive = true;
    }
  }
  onViewUpdated(evt) {
    let actor = evt.actor;
    if (!actor.constructor.renderable)
      return;
    if (!evt.render)
      return;
    if (!actor.visible)
      return;
    if (Hierarchy.findInParent(actor, (v) => !v.active))
      return;
    let root = Hierarchy.root(actor);
    if (!this.store.has(root.gid))
      return;
    this.active = true;
  }
  onRenderNeeded(evt) {
    this.active = true;
  }
  onEntityAdopted(evt) {
    let parent = evt.parent;
    let root = Hierarchy.root(parent);
    if (!this.store.has(root.gid))
      return;
    this.active = true;
  }
  // METHODS -------------------------------------------------------------
  iterate(evt, e) {
    if (!e.canvas || !e.ctx)
      return;
    e.ctx.clearRect(0, 0, e.canvas.width, e.canvas.height);
    e.render(e.ctx);
  }
  finalize() {
    if (this.stayActive) {
      this.stayActive = false;
    } else {
      this.active = false;
    }
  }
};
// STATIC VARIABLES ----------------------------------------------------
__publicField(RenderSystem, "dfltIterateTTL", 0);
__publicField(RenderSystem, "dfltMatchFcn", (v) => v.constructor.canvasable);

// js/updateSystem.js
var _UpdateSystem = class extends System {
  static {
    Schema.apply(_UpdateSystem, "updates", { eventable: false, parser: (o, x) => /* @__PURE__ */ new Map() });
    Schema.apply(_UpdateSystem, "waiting", { eventable: false, parser: (o, x) => [] });
    Schema.apply(_UpdateSystem, "renders", { eventable: false, parser: (o, x) => /* @__PURE__ */ new Set() });
  }
  // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
  cpost(spec) {
    super.cpost(spec);
    this.active = false;
    this.onSet = this.onSet.bind(this);
    EvtSystem.listen(this.gctx, this, "gizmo.set", this.onSet);
  }
  // EVENT HANDLERS ------------------------------------------------------
  onSet(evt) {
    if (!("actor" in evt))
      return;
    if (!("set" in evt))
      return;
    this.setUpdate(evt.actor, evt.set);
    if (evt.render) {
      this.renders.add(evt.actor.gid);
    }
  }
  // METHODS -------------------------------------------------------------
  setUpdate(g, set) {
    if (!this.updates.has(g.gid))
      this.updates.set(g.gid, {});
    Util.update(this.updates.get(g.gid), set);
    if (this.iterating) {
      this.waiting.push(g);
    } else {
      this.store.set(g.gid, g);
    }
    this.active = true;
  }
  prepare(evt) {
    this.currentUpdates = this.updates;
    this.currentRenders = this.renders;
    this.updates = /* @__PURE__ */ new Map();
    this.renders = /* @__PURE__ */ new Set();
    this.waiting = [];
  }
  iterate(evt, e) {
    let updates = this.currentUpdates.get(e.gid);
    if (!updates)
      return;
    let data = { update: updates };
    if (this.currentRenders.has(e.gid))
      data.render = true;
    EvtSystem.trigger(e, "gizmo.updated", data);
  }
  finalize(evt) {
    this.store.clear();
    for (const g of this.waiting) {
      this.store.set(g.gid, g);
    }
    this.waiting.slice(0);
    this.active = this.updates.size !== 0;
  }
};
var UpdateSystem = _UpdateSystem;
// STATIC VARIABLES ----------------------------------------------------
// -- override default TTL (zero means update every frame)
__publicField(UpdateSystem, "dfltIterateTTL", 0);

// js/gameState.js
var _GameState = class extends Gizmo {
  static {
    Schema.apply(_GameState, "dbg", { dflt: false });
    Schema.apply(_GameState, "state", { dflt: "created" });
    Schema.apply(_GameState, "assets", { readonly: true, parser: (o, x) => o.gctx.game && o.gctx.game.assets ? o.gctx.game.assets : new Assets() });
    Schema.apply(_GameState, "assetSpecs", { readonly: true, parser: (o, x) => {
      if (x.assetSpecs)
        return x.assetSpecs;
      if (o.constructor.assetSpecs)
        return o.constructor.assetSpecs;
      return [];
    } });
  }
  // METHODS -------------------------------------------------------------
  /**
   * init is called only once during state lifetime (when state is first started, before any other setup)
   * -- intended to create required state/variables for the given game state
   * -- override $init() for state specific init functionality
   * @param {*} data 
   * @returns 
   */
  async doinit(data) {
    if (this.dbg)
      console.log(`${this} starting initialization`);
    await this.init(data);
    if (this.dbg)
      console.log(`${this} initialization complete`);
    this.state = "initialized";
    return Promise.resolve();
  }
  async init(data) {
    return Promise.resolve();
  }
  /**
   * load is called once during state lifetime (when state is first started but after initialization)
   * -- intended to load assets or other setup that needs to occur after initial state setup.
   * -- override $load() for state specific load functionality
   * @param {*} data 
   * @returns 
   */
  async doload(data) {
    if (this.dbg)
      console.log(`${this} starting loading`);
    this.assets.register(this.assetSpecs);
    await this.assets.load();
    await this.load(data);
    if (this.dbg)
      console.log(`${this} loading complete`);
    this.state = "prepared";
    return Promise.resolve();
  }
  async load(data) {
    return Promise.resolve();
  }
  /**
   * prepare is called every time a state is started
   * @param {*} data 
   * @returns 
   */
  async doprepare(data) {
    if (this.dbg)
      console.log(`${this} starting prepare`);
    await this.prepare(data);
    if (this.dbg)
      console.log(`${this} prepare complete`);
    this.state = "started";
    return Promise.resolve();
  }
  async prepare(data) {
    return Promise.resolve();
  }
  async start(data) {
    if (this.state === "created") {
      await this.doinit(data);
    }
    if (this.state === "initialized") {
      await this.doload(data);
    }
    if (this.state === "prepared") {
      await this.doprepare(data);
    }
    EvtSystem.trigger(this, "state.started");
    return Promise.resolve();
  }
  async stop() {
    this.state = "initialized";
    EvtSystem.trigger(this, "state.stopped");
    this.assets.unregister(this.assetSpecs);
    return Promise.resolve();
  }
  toString() {
    return Fmt2.toString(this.constructor.name, this.tag);
  }
};
var GameState = _GameState;
// STATIC VARIABLES ----------------------------------------------------
__publicField(GameState, "assetSpecs", []);

// js/stateMgr.js
var StateMgr = class extends Gizmo {
  static start(state, data, gctx) {
    if (!gctx)
      gctx = GizmoContext.main;
    EvtSystem.trigger(gctx, "state.wanted", { state, data });
  }
  static {
    Schema.apply(this, "dbg", { dflt: false });
    Schema.apply(this, "states", { readonly: true, parser: () => ({}) });
    Schema.apply(this, "current");
  }
  // CONSTRUCTOR ---------------------------------------------------------
  cpre(spec) {
    super.cpre(spec);
    this.onGizmoCreated = this.onGizmoCreated.bind(this);
    this.onGizmoDestroyed = this.onGizmoDestroyed.bind(this);
    this.onStateWanted = this.onStateWanted.bind(this);
  }
  cpost(spec) {
    super.cpost(spec);
    EvtSystem.listen(this.gctx, this, "gizmo.created", this.onGizmoCreated);
    EvtSystem.listen(this.gctx, this, "gizmo.destroyed", this.onGizmoDestroyed);
    EvtSystem.listen(this.gctx, this, "state.wanted", this.onStateWanted);
  }
  // EVENT HANDLERS ------------------------------------------------------
  onGizmoCreated(evt) {
    if (evt.actor && evt.actor instanceof GameState) {
      let state = evt.actor;
      if (this.dbg && this.states[state.tag])
        console.log(`${this} replacing state for tag: ${state.tag}`);
      if (this.dbg)
        console.log(`${this} adding state: ${state} tag: ${state.tag}`);
      this.states[state.tag] = state;
    }
  }
  onGizmoDestroyed(evt) {
    if (evt.actor && evt.actor instanceof GameState) {
      let state = evt.actor;
      if (state.tag in this.states) {
        delete this.states[state.tag];
      }
    }
  }
  onStateWanted(evt) {
    let newState = evt.state;
    let data = evt.data;
    if (this.dbg)
      console.log(`${this} onStateWanted: ${Fmt2.ofmt(evt)} current: ${this.current} new: ${newState}`);
    if (newState && newState !== this.current) {
      new Timer({ gctx: this.gctx, ttl: 0, cb: () => {
        this.startState(newState, data);
      } });
    }
  }
  // METHODS -------------------------------------------------------------
  get(tag2) {
    return this.states[tag2];
  }
  startState(tag2, data) {
    if (this.dbg)
      console.log(`${this} starting state: ${tag2} with ${Fmt2.ofmt(data)}`);
    let state = this.states[tag2];
    if (!state) {
      console.error(`invalid state: ${tag2}`);
      return;
    }
    if (this.current) {
      this.current.stop();
    }
    state.start(data);
    this.current = state;
  }
};

// js/systemMgr.js
var SystemMgr = class extends Gizmo {
  static {
    Schema.apply(this, "dbg", { dflt: false });
    Schema.apply(this, "systems", { readonly: true, parser: () => ({}) });
  }
  // CONSTRUCTOR ---------------------------------------------------------
  cpre(spec) {
    this.onGizmoCreated = this.onGizmoCreated.bind(this);
    this.onGizmoDestroyed = this.onGizmoDestroyed.bind(this);
  }
  cpost(spec) {
    EvtSystem.listen(this.gctx, this, "gizmo.created", this.onGizmoCreated);
    EvtSystem.listen(this.gctx, this, "gizmo.destroyed", this.onGizmoDestroyed);
  }
  // EVENT HANDLERS ------------------------------------------------------
  onGizmoCreated(evt) {
    if (evt.actor && evt.actor instanceof System) {
      let system = evt.actor;
      if (this.systems[system.tag])
        console.log(`${this} replacing system for tag: ${system.tag}`);
      if (this.dbg)
        console.log(`${this} adding system: ${system} tag: ${system.tag}`);
      this.systems[system.tag] = system;
    }
  }
  onGizmoDestroyed(evt) {
    if (evt.actor && evt.actor instanceof System) {
      let system = evt.actor;
      if (system.tag in this.systems) {
        delete this.systems[system.tag];
      }
    }
  }
  // METHODS -------------------------------------------------------------
  get(tag2) {
    return this.systems[tag2];
  }
};

// js/generator.js
var Generator = class {
  // STATIC PROPERTIES ---------------------------------------------------
  static get main() {
    if (!this._main) {
      this._main = new this();
    }
    return this._main;
  }
  static set main(v) {
    this._main = v;
  }
  // STATIC METHODS ------------------------------------------------------
  static generate(spec = {}) {
    let obj = this.main.generate(spec);
    if (!obj)
      console.error(`generator failed for ${Fmt2.ofmt(spec)}`);
    return obj;
  }
  // CONSTRUCTOR ---------------------------------------------------------
  constructor(spec = {}) {
    this.registry = spec.registry || GizmoData.registry;
    this.gctx = spec.gctx || GizmoContext.main;
    this.assets = spec.assets || (this.gctx.game ? this.gctx.game.assets : new Assets());
  }
  // METHODS -------------------------------------------------------------
  resolve(spec) {
    let nspec = Util.copy(spec);
    for (const [k, v, o] of Util.kvWalk(nspec)) {
      if (v && v.cls === "AssetRef") {
        o[k] = this.generate(this.assets.get(v.assetTag));
      } else if (v && typeof v === "object" && v.$gzx) {
        let nv = this.generate(v);
        o[k] = nv;
        if (this.dbg)
          console.log(`-- generator: resolve ${k}->${Fmt2.ofmt(v)} to ${k}->${nv}`);
      }
    }
    return nspec;
  }
  generate(spec) {
    if (!spec)
      return void 0;
    spec = this.resolve(spec);
    let cls = this.registry[spec.cls];
    if (!cls)
      return void 0;
    if (cls)
      return new cls(spec);
    return void 0;
  }
};
// STATIC VARIABLES ----------------------------------------------------
__publicField(Generator, "_main");

// js/game.js
var _Game = class extends Gizmo {
  static {
    Schema.apply(_Game, "dbg", { eventable: false, dflt: false });
    Schema.apply(_Game, "name", { dflt: _Game.name, readonly: true });
    Schema.apply(_Game, "maxDeltaTime", { eventable: false, dflt: _Game.dfltMaxDeltaTime });
    Schema.apply(_Game, "frame", { eventable: false, dflt: 0 });
    Schema.apply(_Game, "lastUpdate", { eventable: false, dflt: 0 });
    Schema.apply(_Game, "assets", { readonly: true, parser: (o, x) => new Assets() });
    Schema.apply(_Game, "systems", { readonly: true, parser: (o, x) => new SystemMgr({ gctx: o.gctx }) });
    Schema.apply(_Game, "states", { readonly: true, parser: (o, x) => new StateMgr({ gctx: o.gctx }) });
    Schema.apply(_Game, "generator", { readonly: true, parser: (o, x) => new Generator({ gctx: o.gctx, assets: o.assets }) });
  }
  cpre(spec) {
    super.cpre(spec);
    this.loop = this.loop.bind(this);
  }
  cpost(spec) {
    super.cpost(spec);
    this.gctx.game = this;
    Generator.main = this.generator;
  }
  // METHODS -------------------------------------------------------------
  async doinit() {
    if (this.dbg)
      console.log(`${this.name} starting initialization`);
    UiCanvas.getCanvas().addEventListener("click", () => this.gctx.userActive = true, { once: true });
    EvtSystem.listen(this.gctx, this, "key.down", () => this.gctx.userActive = true, { once: true });
    this.assets.register(this.constructor.assetSpecs);
    await this.init();
    if (this.dbg)
      console.log(`${this.name} initialization complete`);
    EvtSystem.trigger(this, "game.inited");
    return Promise.resolve();
  }
  async init() {
    return Promise.resolve();
  }
  async doload() {
    if (this.dbg)
      console.log(`${this.name} starting loading`);
    await this.assets.load();
    await this.load();
    if (this.dbg)
      console.log(`${this.name} loading complete`);
    EvtSystem.trigger(this, "game.loaded");
    return Promise.resolve();
  }
  async load() {
    return Promise.resolve();
  }
  prepareSystems() {
    new KeySystem({ gctx: this.gctx });
    new MouseSystem({ gctx: this.gctx, dbg: false });
    new RenderSystem({ gctx: this.gctx, dbg: false });
    new UpdateSystem({ gctx: this.gctx, dbg: false });
    new SfxSystem({ gctx: this.gctx, dbg: false });
  }
  async doprepare() {
    if (this.dbg)
      console.log(`${this.name} starting prepare`);
    this.prepareSystems();
    await this.prepare();
    if (this.dbg)
      console.log(`${this.name} prepare complete`);
    EvtSystem.trigger(this, "game.prepared");
    return Promise.resolve();
  }
  async prepare() {
    return Promise.resolve();
  }
  async start() {
    await this.doinit();
    await this.doload();
    await this.doprepare();
    EvtSystem.trigger(this, "game.started");
    window.requestAnimationFrame(this.loop);
    return Promise.resolve();
  }
  loop(timestamp) {
    this.frame++;
    if (this.frame > Number.MAX_SAFE_INTEGER)
      this.frame = 0;
    const dt = Math.min(this.maxDeltaTime, timestamp - this.lastUpdate);
    this.lastUpdate = timestamp;
    EvtSystem.trigger(this, "game.tock", { deltaTime: parseInt(dt), frame: this.frame });
    window.requestAnimationFrame(this.loop);
  }
};
var Game = _Game;
// STATIC VARIABLES ----------------------------------------------------
__publicField(Game, "assetSpecs", []);
/*
static startStateTag = 'play';
static config = {};
*/
// max allowed delta time (in ms)
__publicField(Game, "dfltMaxDeltaTime", 50);

// js/math.js
var Mathf2 = class {
  static approx(v1, v2) {
    return Math.abs(v1 - v2) < 1e-5;
  }
  static clamp(val, min, max) {
    return val > max ? max : val < min ? min : val;
  }
  static clampInt(val, min, max) {
    val = parseInt(val);
    return val > max ? max : val < min ? min : val;
  }
  static roundTo(val, base = 1) {
    return Math.round(val / base) * base;
  }
  static floorTo(val, base = 1) {
    return Math.floor(val / base) * base;
  }
  static round(val, places) {
    return +(Math.round(val + "e+" + places) + "e-" + places);
  }
  static angle(cx, cy, ex, ey, rad = false) {
    let dx = ex - cx;
    let dy = ey - cy;
    let theta = Math.atan2(dy, dx);
    if (rad)
      return theta;
    theta *= 180 / Math.PI;
    return theta;
  }
  static distance(x1, y1, x2, y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  static rotatePoint(cx, cy, pX, pY, angle) {
    var dx = pX - cx;
    var dy = pY - cy;
    var mag = Math.sqrt(dx * dx + dy * dy);
    let rads = angle * Math.PI / 180;
    let x = mag * Math.cos(rads);
    let y = mag * Math.sin(rads);
    return { x: cx + x, y: cy + y };
  }
  static lerp(min, max, minw, maxw, v) {
    if (max === min)
      return 0;
    return minw + (maxw - minw) * (v - min) / (max - min);
  }
  static addAvgTerm(terms, avg, newTerm) {
    return (terms * avg + newTerm) / (terms + 1);
  }
  static towards(x1, y1, x2, y2, d) {
    if (x1 === x2 && y1 === y2 || d === 0)
      return [x1, y1];
    let md = this.distance(x1, y1, x2, y2);
    let k = d / md;
    return [x1 + (x2 - x1) * k, y1 + (y2 - y1) * k];
  }
  static checkIntersectRectSegment(rminx, rminy, rmaxx, rmaxy, p1x, p1y, p2x, p2y) {
    let minX = p1x;
    let maxX = p2x;
    if (p1x > p2x) {
      minX = p2x;
      maxX = p1x;
    }
    if (maxX > rmaxx)
      maxX = rmaxx;
    if (minX < rminx)
      minX = rminx;
    if (minX > maxX)
      return false;
    let minY = p1y;
    let maxY = p2y;
    let dx = p2x - p1x;
    if (Math.abs(dx) > 1e-7) {
      let a = (p2y - p1y) / dx;
      let b = p1y - a * p1x;
      minY = a * minX + b;
      maxY = a * maxX + b;
    }
    if (minY > maxY) {
      let tmp = maxY;
      maxY = minY;
      minY = tmp;
    }
    if (maxY > rmaxy)
      maxY = rmaxy;
    if (minY < rminy)
      minY = rminy;
    if (minY > maxY)
      return false;
    return true;
  }
  static overlap(min1, max1, min2, max2) {
    let min = min1;
    let max = max1;
    if (max > max2)
      max = Math.max(max2, min1);
    if (min < min2)
      min = Math.min(min2, max1);
    return max - min;
  }
  static projectSegment(min1, max1, min2, max2) {
    let min = min1;
    let max = max1;
    if (max > max2)
      max = Math.max(max2, min1);
    if (min < min2)
      min = Math.min(min2, max1);
    return [min, max];
  }
  static invProjectSegment(smin, smax, pmin, pmax) {
    if (pmin < smin)
      pmin = smin;
    if (pmax > smax)
      pmax = smax;
    if (pmin > smin && pmax < smax) {
      return [smin, pmin, pmax, smax];
    }
    let min = pmin > smin ? smin : pmax;
    let max = pmax < smax ? smax : pmin;
    return [min, max];
  }
  /**
   * A function to return a sample within a given range, where the sample roughly fits a standard bell curve for standard distribution.
   * Based on maths from https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
   * @param {*} min 
   * @param {*} mean 
   * @param {*} max 
   * @param {*} sdf - standard deviation factor.  Range between mean and min/max is divided by this to give approximation for standard deviation for curve.
   * @returns sample
   */
  static distSample(min, mean, max, sdf = 3) {
    let sample;
    let maxiters = 100;
    do {
      if (maxiters-- <= 0)
        break;
      var u = 1 - Math.random();
      var v = 1 - Math.random();
      let sd = Math.max(max - mean, mean - min) / sdf;
      sample = mean + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
    } while (sample < min || sample > max);
    return sample;
  }
  static avg(...args) {
    let sum = args.reduce((pv, cv) => pv + cv, 0);
    return sum / args.length;
  }
  static avgi(...args) {
    let sum = args.reduce((pv, cv) => pv + cv, 0);
    return Math.round(sum / args.length);
  }
};

// js/rect.js
var Rect = class extends Sketch {
  static {
    Schema.apply(this, "border", { dflt: 0, renderable: true });
    Schema.apply(this, "borderColor", { dflt: "black", renderable: true });
    Schema.apply(this, "color", { dflt: "rgba(127,127,127,.75", renderable: true });
    Schema.apply(this, "fill", { dflt: true, renderable: true });
    Schema.apply(this, "dash", { dflt: null, renderable: true });
  }
  // METHODS -------------------------------------------------------------
  subrender(ctx, x = 0, y = 0, width = 0, height = 0) {
    if (!width)
      width = this.width;
    if (!height)
      height = this.height;
    Stats.count(`rect.subrender`);
    if (this.fill) {
      ctx.fillStyle = this.color;
      ctx.fillRect(x, y, width, height);
    }
    if (this.border) {
      ctx.lineWidth = this.border;
      ctx.strokeStyle = this.borderColor;
      if (this.dash)
        ctx.setLineDash(this.dash);
      ctx.strokeRect(x, y, width, height);
      if (this.dash)
        ctx.setLineDash([]);
    }
  }
};

// js/serializer.js
var SerialData = class {
  static fromStr(str) {
    let spec = JSON.parse(str);
    return new this(spec);
  }
  constructor(spec = {}) {
    this.xgzos = spec.xgzos || [];
  }
  asString() {
    return JSON.stringify(this);
  }
};
var Serializer = class {
  static xifyGizmoData(sdata, gzd) {
    if (!(gzd instanceof GizmoData))
      return null;
    let sobj = {
      $gzx: true,
      cls: gzd.constructor.name
    };
    for (const schema of Object.values(gzd.constructor.schema)) {
      if (!schema.serializable)
        continue;
      let value = gzd[schema.key];
      if (value === void 0)
        continue;
      if (value.hasOwnProperty("assetTag")) {
        sobj[schema.serializeKey] = {
          cls: "AssetRef",
          assetTag: value.assetTag
        };
      } else if (schema.gizmo) {
        if (Array.isArray(value)) {
          sobj[schema.serializeKey] = [];
          for (const item of value)
            sobj[schema.serializeKey].push(this.xifyGizmo(sdata, item));
        } else {
          sobj[schema.serializeKey] = this.xifyGizmo(sdata, value);
        }
      } else if (schema.link) {
        if (Array.isArray(value)) {
          sobj[schema.serializeKey] = [];
          for (const item of value)
            sarray.push(this.xifyGizmoData(sdata, item));
        } else {
          sobj[schema.serializeKey] = this.xifyGizmoData(sdata, value);
        }
      } else {
        sobj[schema.serializeKey] = schema.serializeFcn(sdata, sobj, value);
      }
    }
    return sobj;
  }
  static xifyGizmo(sdata, gzo) {
    if (!(gzo instanceof Gizmo))
      return null;
    sdata.xgzos.push(this.xifyGizmoData(sdata, gzo));
    return {
      cls: "GizmoRef",
      gid: gzo.gid
    };
  }
  static restore(sdata, generator) {
    let gzos = [];
    let refs = {};
    for (const xgzo of sdata.xgzos) {
      let swaps = [];
      for (const [k, v, obj] of Util.kvWalk(xgzo)) {
        if (v && typeof v === "object" && v.cls === "GizmoRef") {
          let ref = refs[v.gid];
          if (ref)
            swaps.push([k, ref, obj]);
        }
      }
      for (const [k, v, obj] of swaps)
        obj[k] = v;
      let gzo = generator.generate(xgzo);
      refs[xgzo.gid] = gzo;
      gzos.push(gzo);
    }
    for (let i = gzos.length - 1; i >= 0; i--) {
      let gzo = gzos[i];
      if (Hierarchy.root(gzo) !== gzo) {
        gzos.splice(i, 1);
      }
    }
    return gzos;
  }
};

// js/sfx.js
var _Sfx = class extends GizmoData {
  static {
    Schema.apply(_Sfx, "assetTag", { readonly: true });
    Schema.apply(_Sfx, "audio", { parser: (o, x) => x.audio || new ArrayBuffer() });
    Schema.apply(_Sfx, "channel", { dflt: _Sfx.dfltChannel });
    Schema.apply(_Sfx, "loop", { dflt: false });
    Schema.apply(_Sfx, "volume", { dflt: 1 });
  }
  // METHODS -------------------------------------------------------------
  play(actor) {
    SfxSystem.playSfx(actor, this.assetTag, this);
  }
  stop(actor) {
    SfxSystem.stopSfx(actor, this.assetTag, this);
  }
};
var Sfx = _Sfx;
// STATIC VARIABLES ----------------------------------------------------
__publicField(Sfx, "dfltChannel", "sfx");

// js/sprite.js
var Sprite = class extends Sketch {
  static {
    Schema.apply(this, "img", { readonly: true });
    Schema.apply(this, "width", { getter: (o, x) => o.img ? o.img.width : 0, readonly: true });
    Schema.apply(this, "height", { getter: (o, x) => o.img ? o.img.height : 0, readonly: true });
  }
  // METHODS -------------------------------------------------------------
  subrender(ctx, x = 0, y = 0, width = 0, height = 0) {
    if (!this.img)
      return;
    if (width && width !== this.width || height && height !== this.height) {
      if (this.width && this.height) {
        let sw = this.width;
        let sh = this.height;
        let dw = width;
        let dh = height;
        ctx.drawImage(
          this.img,
          0,
          0,
          sw,
          sh,
          x,
          y,
          dw,
          dh
        );
      }
    } else {
      ctx.drawImage(this.img, x, y);
    }
  }
};

// js/test.js
var Gizmo2 = class extends GizmoData {
  constructor(spec = {}) {
    super(spec);
    ExtEvtEmitter.apply(this, spec);
  }
};
var TVect = class extends GizmoData {
  static {
    Schema.apply(this, "x");
    Schema.apply(this, "y");
  }
  constructor(spec = {}) {
    super(spec);
  }
};
var TXForm = class extends GizmoData {
  static {
    Schema.apply(this, "pos", { link: TVect });
    Schema.apply(this, "data");
  }
};
var TView = class extends Gizmo2 {
  static {
    Schema.apply(this, "xform", { link: TView });
  }
};
var ExBase = class extends GizmoData {
  static {
    Schema.apply(this, "var1");
  }
  func2() {
  }
};
var ExSub = class extends ExBase {
  static {
    Schema.apply(this, "var2");
  }
};
var TestProperty = class {
  static define(obj, key, value, spec = {}) {
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
  constructor(obj, key, value, spec = {}) {
    ExtEvtReceiver.apply(this);
    this._key = key;
    this._value = value;
    this.enumerable = true;
    this.get = () => this._value;
    const linkDestroyEvt = spec.hasOwnProperty("linkDestroyEvt") ? linkDestroyEvt : "gizmo.destroyed";
    const destroyFcn = () => {
      this._value = null;
    };
    if (spec.link) {
      if (spec.linkKey && this._value && this._value.hasOwnProperty(spec.linkKey)) {
        this._value[spec.linkKey] = obj;
      }
      if (this._value && linkDestroyEvt)
        EvtSystem.listen(this._value, this, linkDestroyEvt, destroyFcn);
    }
    if (!spec.readonly) {
      this.set = (v) => {
        if (this._value !== v) {
          this._value = v;
          if (spec.onset)
            spec.onset(v);
          let data = { set: { [key]: v } };
          if (spec.render)
            data.render = true;
          if (obj)
            EvtSystem.trigger(obj, "gizmo.set", data);
        }
        if (spec.link && this._value) {
          EvtSystem.ignore(this._value, this, linkDestroyEvt, destroyFcn);
        }
        this._value = v;
        if (spec.link && v) {
          EvtSystem.listen(v, this, linkDestroyEvt, destroyFcn);
        }
      };
    }
  }
};

// js/textFormat.js
var _TextFormat = class extends GizmoData {
  static {
    Schema.apply(_TextFormat, "style", { dflt: "normal" });
    Schema.apply(_TextFormat, "variant", { dflt: "normal" });
    Schema.apply(_TextFormat, "weight", { dflt: "normal" });
    Schema.apply(_TextFormat, "size", { dflt: 12 });
    Schema.apply(_TextFormat, "family", { dflt: "sans-serif" });
    Schema.apply(_TextFormat, "color", { dflt: "black" });
    Schema.apply(_TextFormat, "border", { dflt: 0 });
    Schema.apply(_TextFormat, "borderColor", { dflt: "white" });
    Schema.apply(_TextFormat, "highlight", { dflt: false });
    Schema.apply(_TextFormat, "highlightColor", { dflt: "yellow" });
  }
  static parse(str) {
    let kvs = str.split(" ");
    let spec = {};
    for (var [k, v] of kvs.map((v2) => v2.split("=", 2))) {
      switch (k) {
        case "B":
        case "b": {
          spec.weight = "bold";
          break;
        }
        case "I":
        case "i": {
          spec.style = "italic";
          break;
        }
        case "H":
        case "h": {
          spec.highlight = true;
          break;
        }
        case "size":
        case "border":
        case "delta": {
          spec[k] = parseInt(v);
          break;
        }
        default: {
          if (v)
            spec[k] = v;
          break;
        }
      }
    }
    return spec;
  }
  // CONSTRUCTOR ---------------------------------------------------------
  constructor(spec = {}) {
    spec.size = spec.size || 12;
    if (spec.hasOwnProperty("delta"))
      spec.size += spec.delta;
    super(spec);
  }
  // PROPERTIES ----------------------------------------------------------
  get font() {
    return `${this.style} ${this.variant} ${this.weight} ${this.size}px ${this.family}`;
  }
  // METHODS -------------------------------------------------------------
  measure(text) {
    Stats.count("textFormat.measure");
    const ctx = this.constructor.textCtx;
    ctx.font = this.font;
    const metrics = ctx.measureText(text);
    let h = Math.max(0, metrics.fontBoundingBoxAscent) + Math.max(0, metrics.fontBoundingBoxDescent);
    let w = Math.max(0, metrics.actualBoundingBoxLeft) + Math.max(0, metrics.actualBoundingBoxRight);
    if (text.endsWith(" ")) {
      const m1 = ctx.measureText(text + "x");
      const m2 = ctx.measureText("x");
      let m1w = Math.max(0, m1.actualBoundingBoxLeft) + Math.max(0, m1.actualBoundingBoxRight);
      let m2w = Math.max(0, m2.actualBoundingBoxLeft) + Math.max(0, m2.actualBoundingBoxRight);
      w = m1w - m2w;
    }
    return new Vect(w, h);
  }
  copy(overrides = {}) {
    return new this.constructor(Object.assign({}, this, overrides));
  }
  toString() {
    return Fmt2.toString(this.constructor.name, Fmt2.ofmt(this));
  }
};
var TextFormat = _TextFormat;
__publicField(TextFormat, "textCanvas", document.createElement("canvas"));
__publicField(TextFormat, "textCtx", _TextFormat.textCanvas.getContext("2d"));

// js/textToken.js
var _TextToken = class extends Sketch {
  static {
    Schema.apply(_TextToken, "text", { dflt: "default text", renderable: true });
    Schema.apply(_TextToken, "fmt", { renderable: true, link: true, parser: (o, x) => x.fmt || new TextFormat() });
    Schema.apply(_TextToken, "alignx", { dflt: 0.5, renderable: true });
    Schema.apply(_TextToken, "aligny", { dflt: 0.5, renderable: true });
    Schema.apply(_TextToken, "width", { readonly: true, getter: (o, x) => o.fmt.measure(o.text).x });
    Schema.apply(_TextToken, "height", { readonly: true, getter: (o, x) => o.fmt.measure(o.text).y });
  }
  // METHODS -------------------------------------------------------------
  subrender(ctx, x = 0, y = 0, width = 0, height = 0) {
    let fmt = this.fmt;
    let tsize = fmt.measure(this.text);
    if (width && width !== this.width || height && height !== this.height) {
      fmt = this.fmt.copy();
      if (tsize.x < width && tsize.y < height) {
        while (fmt.size < 1e3 && tsize.x < width && tsize.y < height) {
          fmt.size++;
          tsize = fmt.measure(this.text);
        }
        fmt.size -= 1;
        tsize = fmt.measure(this.text);
      } else {
        while (fmt.size > 1 && (tsize.x > width || tsize.y > height)) {
          fmt.size--;
          tsize = fmt.measure(this.text);
        }
      }
      this.fmt.size = fmt.size;
    }
    let tx = width ? (width - tsize.x) * this.alignx : 0;
    let ty = height ? (height - tsize.y) * this.aligny : 0;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    if (this.fmt.highlight) {
      ctx.fillStyle = this.fmt.highlightColor;
      ctx.fillRect(x + tx, y + ty, tsize.x, tsize.y);
    }
    ctx.fillStyle = this.fmt.color;
    ctx.font = fmt.font;
    ctx.fillText(this.text, x + tx, y + ty);
    if (this.fmt.border) {
      ctx.lineWidth = this.fmt.border;
      ctx.strokeStyle = this.fmt.borderColor;
      ctx.strokeText(this.text, x + tx, y + ty);
    }
  }
  getCharBounds(idx) {
    if (idx < 0)
      idx = 0;
    if (idx > this.text.length)
      idx = this.text.length;
    let left = this.fmt.measure(this.text.slice(0, idx));
    let right = this.fmt.measure(this.text.slice(0, Math.min(idx, this.text.length)));
    return new Bounds(left.x, 0, right.x - left.x, left.y);
  }
  toString() {
    return Fmt2.toString(this.constructor.name, this.text);
  }
};
var TextToken = _TextToken;
// STATIC VARIABLES ----------------------------------------------------
__publicField(TextToken, "textCanvas", document.createElement("canvas"));
__publicField(TextToken, "textCtx", _TextToken.textCanvas.getContext("2d"));
__publicField(TextToken, "dfltColor", "black");
__publicField(TextToken, "dfltBorderColor", "white");
__publicField(TextToken, "dfltHighlightColor", "yellow");
__publicField(TextToken, "dfltText", "default text");

// js/uiPanel.js
var UiPanel = class extends UiView {
  static {
    Schema.apply(this, "sketch", { parser: (o, x) => x.hasOwnProperty("sketch") ? x.sketch : o.constructor.dfltSketch, link: true, renderable: true });
    Schema.apply(this, "fitter", { dflt: "stretch", renderable: true });
    Schema.apply(this, "alignx", { dflt: 0.5, renderable: true });
    Schema.apply(this, "aligny", { dflt: 0.5, renderable: true });
  }
  // STATIC PROPERTIES ---------------------------------------------------
  static get dfltSketch() {
    return new Rect({ color: "rgba(255,255,255,.25)" });
  }
  // METHODS -------------------------------------------------------------
  renderSketch(ctx, sketch) {
    if (!sketch)
      return;
    switch (this.fitter) {
      case "none": {
        let xo = Math.round((this.xform.width - sketch.width) * this.alignx);
        let yo = Math.round((this.xform.height - sketch.height) * this.aligny);
        sketch.render(ctx, this.xform.minx + xo, this.xform.miny + yo, 0, 0);
        break;
      }
      case "origin": {
        let wd = Math.round((this.xform.width - sketch.width) * this.xform.origx);
        let hd = Math.round((this.xform.height - sketch.height) * this.xform.origy);
        sketch.render(ctx, this.xform.minx + wd, this.xform.miny + hd, 0, 0);
        break;
      }
      case "stretchRatio": {
        let x = this.xform.minx;
        let y = this.xform.miny;
        let adjustedWidth = this.xform.width;
        let adjustedHeight = this.xform.height;
        if (this.xform.width && this.xform.height) {
          let desiredRatio = sketch.width && sketch.height ? sketch.width / sketch.height : 1;
          let currentRatio = this.xform.width / this.xform.height;
          if (currentRatio > desiredRatio) {
            adjustedWidth = this.xform.height * desiredRatio;
            x += Math.round((this.xform.width - adjustedWidth) * this.alignx);
          } else if (currentRatio < desiredRatio) {
            adjustedHeight = this.xform.width / desiredRatio;
            y += Math.round((this.xform.height - adjustedHeight) * this.aligny);
          }
        }
        sketch.render(ctx, x, y, adjustedWidth, adjustedHeight);
        break;
      }
      case "tile": {
        if (!this.xform.width || !this.xform.height || !sketch.width || !sketch.height)
          return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
        ctx.clip();
        let wd = (this.xform.width % sketch.width - sketch.width) * this.alignx;
        let hd = (this.xform.height % sketch.height - sketch.height) * this.aligny;
        if (Math.abs(wd) >= sketch.width)
          wd = 0;
        if (Math.abs(hd) >= sketch.height)
          hd = 0;
        let x, y;
        for (let i = 0; i < this.xform.width / sketch.width; i++) {
          for (let j = 0; j < this.xform.height / sketch.height; j++) {
            x = wd + i * sketch.width;
            y = hd + j * sketch.height;
            sketch.render(ctx, this.xform.minx + x, this.xform.miny + y);
          }
        }
        ctx.restore();
        break;
      }
      case "autotile": {
        if (!this.xform.width || !this.xform.height || !sketch.width || !sketch.height)
          return;
        let xtiles = this.xform.width > sketch.width ? Math.floor(this.xform.width / sketch.width) : 1;
        let scaledWidth = this.xform.width / xtiles;
        let ytiles = this.xform.height > sketch.height ? Math.floor(this.xform.height / sketch.height) : 1;
        let scaledHeight = this.xform.height / ytiles;
        for (let i = 0; i < xtiles; i++) {
          for (let j = 0; j < ytiles; j++) {
            let x = i * scaledWidth;
            let y = j * scaledHeight;
            sketch.render(ctx, this.xform.minx + x, this.xform.miny + y, scaledWidth, scaledHeight);
          }
        }
        break;
      }
      case "stretch":
      default: {
        sketch.render(ctx, this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
        break;
      }
    }
  }
  subrender(ctx) {
    this.renderSketch(ctx, this.sketch);
  }
};

// js/uiText.js
var _UiText = class extends UiView {
  static get rlorem() {
    let len = Math.floor(Math.random() * this.lorem.length);
    return this.lorem.slice(0, len);
  }
  static get rword() {
    let choices = this.lorem.split(" ");
    let idx = Math.floor(Math.random() * choices.length);
    return choices[idx];
  }
  static get dfltFmt() {
    return new TextFormat();
  }
  static {
    Schema.apply(_UiText, "text", { dflt: "default text", renderable: true, onSet: (o, k, v) => o.needsLayout = true });
    Schema.apply(_UiText, "fmt", { renderable: true, link: true, parser: (o, x) => x.fmt || _UiText.dfltFmt, onSet: (o, k, v) => o.needsLayout = true });
    Schema.apply(_UiText, "fitter", { dflt: "stretch", renderable: true, onSet: (o, k, v) => o.needsLayout = true });
    Schema.apply(_UiText, "alignx", { dflt: 0.5, renderable: true, onSet: (o, k, v) => o.needsLayout = true });
    Schema.apply(_UiText, "aligny", { dflt: 0.5, renderable: true, onSet: (o, k, v) => o.needsLayout = true });
    Schema.apply(_UiText, "tokens", { link: "array", parser: () => [] });
    Schema.apply(_UiText, "needsLayout", { eventable: false, dflt: true });
    Schema.apply(_UiText, "lastHeight", { eventable: false, dflt: 0 });
    Schema.apply(_UiText, "lastWidth", { eventable: false, dflt: 0 });
    Schema.apply(_UiText, "leadingPct", { renderable: true, dflt: 0.25, onSet: (o, k, v) => o.needsLayout = true });
  }
  // STATIC METHODS ------------------------------------------------------
  // FIXME: allow for text that isn't evaluated for control strings (e.g.: user input fields)
  static tokenize(text, opts = {}) {
    let fmt = opts.fmt || new TextFormat();
    let fmts = [fmt];
    let ctrls = text.match(/<[^<>]*>/g) || [];
    let remaining = text;
    let tokens = [];
    for (var ctrl of ctrls) {
      let splits = remaining.split(ctrl, 1);
      if (splits[0].endsWith("\\"))
        continue;
      let block = splits[0];
      remaining = remaining.slice(block.length + ctrl.length);
      if (block) {
        if (opts.wrap) {
          let lines = block.split("\n");
          let firstLine = true;
          for (const line of lines) {
            if (line) {
              let tstrs = line.split(/\s+/);
              let firstStr = true;
              for (const tstr of tstrs) {
                if (tstr) {
                  tokens.push(new TextToken({ text: tstr, fmt: fmts[fmts.length - 1].copy(), newline: !firstLine && firstStr }));
                  firstStr = false;
                }
              }
            }
            firstLine = false;
          }
        } else {
          tokens.push(new TextToken({ text: block, fmt: fmts[fmts.length - 1].copy() }));
        }
      }
      if (ctrl.startsWith("</")) {
        if (fmts.length > 1)
          fmts.pop();
      } else {
        ctrl = ctrl.replace(/[<>]*/g, "");
        let spec = TextFormat.parse(ctrl);
        let newFmt = fmts[fmts.length - 1].copy(spec);
        fmts.push(newFmt);
      }
    }
    if (remaining) {
      if (opts.wrap) {
        let lines = remaining.split("\n");
        let firstLine = true;
        for (const line of lines) {
          if (line) {
            let tstrs = line.split(/\s+/);
            let firstStr = true;
            for (const tstr of tstrs) {
              if (tstr) {
                tokens.push(new TextToken({ text: tstr, fmt: fmts[fmts.length - 1].copy(), newline: !firstLine && firstStr }));
                firstStr = false;
              }
            }
          }
          firstLine = false;
        }
      } else {
        tokens.push(new TextToken({ text: remaining, fmt: fmts[fmts.length - 1].copy() }));
      }
    }
    return tokens;
  }
  static splitLines(tokens, width, leadingPct) {
    let wrapHeight = 0;
    let wrapWidth = 0;
    let lines = [];
    let line = [];
    let lineWidth = 0;
    let lineHeight = 0;
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      let spacing = token.fmt.measure(" ");
      let checkWidth = token.width + (line.length ? spacing.x : 0);
      if (lineWidth + checkWidth < width) {
        line.push(token);
        lineWidth += checkWidth;
        if (spacing.y > lineHeight)
          lineHeight = spacing.y;
      } else {
        if (!line.length) {
          line.push(token);
          lines.push(line);
          line = [];
          if (lines.length > 1) {
            wrapHeight += lineHeight + lineHeight * leadingPct;
          } else {
            wrapHeight += lineHeight;
          }
          lineWidth = 0;
          lineHeight = 0;
          if (token.width > wrapWidth)
            wrapWidth = token.width;
        } else {
          lines.push(line);
          line = [];
          line.push(token);
          if (lineWidth > wrapWidth)
            wrapWidth = lineWidth;
          lineWidth = token.width;
          if (lines.length > 1) {
            wrapHeight += lineHeight + lineHeight * leadingPct;
          } else {
            wrapHeight += lineHeight;
          }
          lineHeight = spacing.y;
        }
      }
    }
    if (line.length) {
      wrapHeight += lineHeight + lineHeight * leadingPct;
      if (lineWidth > wrapWidth)
        wrapWidth = lineWidth;
      lines.push(line);
    }
    return [lines, wrapHeight, wrapWidth];
  }
  static resizeTokens(tokens, delta = 1) {
    for (const token of tokens)
      if (token.fmt.size + delta > 0)
        token.fmt.size += delta;
  }
  static measureWrapHeight(text, opts = {}) {
    let fmt = opts.fmt || new TextFormat();
    let leadingPct = opts.hasOwnProperty("leadingPct") ? opts.leadingPct : 0.25;
    let autofit = opts.hasOwnProperty("autofit") ? opts.autofit : false;
    let width = opts.width || 0;
    let height = opts.height || 0;
    let tokens = this.tokenize(text, { fmt, wrap: true });
    let lines = [];
    let wrapHeight = 0;
    let wrapWidth = 0;
    if (autofit) {
      [lines, wrapHeight, wrapWidth] = this.splitLines(tokens, width, leadingPct);
      if (iterations-- >= 0 && wrapWidth < width && wrapHeight < height) {
        while (wrapWidth < width && wrapHeight < height) {
          this.resizeTokens(tokens, 1);
          [lines, wrapHeight, wrapWidth] = this.splitLines(tokens, width, leadingPct);
        }
        this.resizeTokens(tokens, -1);
        [lines, wrapHeight, wrapWidth] = this.splitLines(tokens, width, leadingPct);
      } else {
        while (iterations-- >= 0 && (wrapWidth > width || wrapHeight > height)) {
          this.resizeTokens(tokens, -1);
          [lines, wrapHeight, wrapWidth] = this.splitLines(tokens, width, leadingPct);
        }
      }
    } else {
      [lines, wrapHeight, wrapWidth] = this.splitLines(tokens, width, leadingPct);
    }
    return wrapHeight;
  }
  // METHODS -------------------------------------------------------------
  layoutLine(tokens, bounds, top, width, autofit = false) {
    let lineWidth = 0;
    let lineHeight = 0;
    let spaces = [];
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      let spacing = token.fmt.measure(" ");
      spaces[i] = spacing.x * 0.5;
      if (i > 0) {
        spaces[i - 1] += spacing.x * 0.5;
        lineWidth += spaces[i - 1];
      }
      lineWidth += token.width;
      if (spacing.y > lineHeight)
        lineHeight = spacing.y;
    }
    let delta = width - lineWidth;
    let x = delta * this.alignx;
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      let bound = bounds[i];
      bound.x = x;
      bound.width = token.width;
      if (autofit) {
        let widthPct = Mathf2.round(token.width / lineWidth, 2);
        bound.width = Mathf2.round(widthPct * lineWidth, 2);
      } else {
        bound.width = token.width;
      }
      bound.x = x;
      bound.y = top;
      bound.height = lineHeight;
      if (autofit) {
        x += bound.width;
      } else {
        x += token.width + spaces[i];
      }
    }
    return lineHeight;
  }
  // define layout of tokens
  layout() {
    this.tokens = this.constructor.tokenize(this.text, { fmt: this.fmt, wrap: this.fitter === "wrap" || this.fitter === "autowrap" });
    this.bounds = [];
    for (let i = 0; i < this.tokens.length; i++)
      this.bounds[i] = new Bounds(0, 0, this.xform.width, this.xform.height);
    if (this.tokens.length === 1) {
      let token = this.tokens[0];
      let bounds = this.bounds[0];
      switch (this.fitter) {
        case "none":
          token.alignx = this.alignx;
          token.aligny = this.aligny;
          bounds.width = 0;
          bounds.height = 0;
          break;
        case "stretch":
          token.alignx = this.alignx;
          token.aligny = this.aligny;
          break;
      }
    } else {
      if (this.fitter === "wrap" || this.fitter === "autowrap") {
        let lines = [];
        let wrapHeight = 0;
        let wrapWidth = 0;
        let iterations2 = 1e3;
        if (this.fitter === "autowrap") {
          [lines, wrapHeight, wrapWidth] = this.constructor.splitLines(this.tokens, this.xform.width, this.leadingPct);
          if (iterations2-- >= 0 && wrapWidth < this.xform.width && wrapHeight < this.xform.height) {
            while (wrapWidth < this.xform.width && wrapHeight < this.xform.height) {
              this.constructor.resizeTokens(this.tokens, 1);
              [lines, wrapHeight, wrapWidth] = this.constructor.splitLines(this.tokens, this.xform.width, this.leadingPct);
            }
            this.constructor.resizeTokens(this.tokens, -1);
            [lines, wrapHeight, wrapWidth] = this.constructor.splitLines(this.tokens, this.xform.width, this.leadingPct);
          } else {
            while (iterations2-- >= 0 && (wrapWidth > this.xform.width || wrapHeight > this.xform.height)) {
              this.constructor.resizeTokens(this.tokens, -1);
              [lines, wrapHeight, wrapWidth] = this.constructor.splitLines(this.tokens, this.xform.width, this.leadingPct);
            }
          }
        } else {
          [lines, wrapHeight, wrapWidth] = this.constructor.splitLines(this.tokens, this.xform.width, this.leadingPct);
        }
        let top = (this.xform.height - wrapHeight) * this.aligny;
        let bi = 0;
        for (let li = 0; li < lines.length; li++) {
          let line = lines[li];
          let lineHeight = this.layoutLine(line, this.bounds.slice(bi, bi + line.length), top, this.xform.width, false);
          bi += line.length;
          top += lineHeight + lineHeight * this.leadingPct;
        }
      } else {
        this.layoutLine(this.tokens, this.bounds, 0, this.xform.width, this.fitter === "autowrap");
      }
    }
  }
  getCursorBounds(idx) {
    if (this.needsLayout) {
      this.needsLayout = false;
      this.layout();
    }
    if (!this.tokens.length) {
      console.log(`this: ${this} fmt: ${this.fmt}`);
      let tsize = this.fmt.measure(" ");
      return new Bounds(0, 0, tsize.x, tsize.y);
    }
    if (idx < 0)
      idx = 0;
    let token = this.tokens[0];
    if (idx > token.text.length)
      idx = token.text.length;
    let substr = this.text.slice(0, idx);
    let spacing = token.fmt.measure(substr);
    let bounds = this.bounds[0];
    let tx = bounds.width ? (bounds.width - token.width) * this.alignx : 0;
    let ty = bounds.height ? (bounds.height - token.height) * this.aligny : 0;
    return new Bounds(this.bounds[0].x + spacing.x + tx, this.bounds[0].y + ty, token.width, token.height);
  }
  subrender(ctx) {
    if (!this.text || !this.text.length)
      return;
    if (this.lastWidth != this.xform.width || this.lastHeight != this.xform.height || this.needsLayout) {
      this.lastWidth = this.xform.width;
      this.lastHeight = this.xform.height;
      this.needsLayout = false;
      this.layout();
    }
    for (let i = 0; i < this.tokens.length; i++) {
      let token = this.tokens[i];
      let bounds = this.bounds[i];
      token.render(ctx, this.xform.minx + bounds.x, this.xform.miny + bounds.y, bounds.width, bounds.height);
    }
  }
};
var UiText = _UiText;
// STATIC VARIABLES ----------------------------------------------------
__publicField(UiText, "evtUpdated", "text.updated");
__publicField(UiText, "lorem", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.");
__publicField(UiText, "minFontSize", 5);
__publicField(UiText, "dfltText", "default text");

// js/uiButton.js
var UiButton = class extends UiPanel {
  static {
    Schema.apply(this, "unpressed", { parser: (o, x) => x.hasOwnProperty("unpressed") ? x.unpressed : o.constructor.dfltUnpressed, link: true, renderable: true });
    Schema.apply(this, "highlight", { parser: (o, x) => x.hasOwnProperty("highlight") ? x.highlight : o.constructor.dfltHighlight, link: true, renderable: true });
    Schema.apply(this, "pressed", { parser: (o, x) => x.hasOwnProperty("pressed") ? x.pressed : o.constructor.dfltPressed, link: true, renderable: true });
    Schema.apply(this, "text", { parser: (o, x) => x.hasOwnProperty("text") ? x.text : "default text", renderable: true, onSet: (o, k, v) => o._text.text = v });
    Schema.apply(this, "hltext", { parser: (o, x) => x.hasOwnProperty("hltext") ? x.hltext : null, renderable: true });
    Schema.apply(this, "textSpec", { eventable: false, renderable: false, parser: (o, x) => x.textSpec || {}, onset: (o, k, v) => Object.assign(o._text, v) });
    Schema.apply(this, "hlTextSpec", { eventable: false, renderable: false, parser: (o, x) => x.hlTextSpec || {} });
    Schema.apply(this, "_text", { readonly: true, serializable: false, gizmo: true, parser: (o, x) => {
      let spec = Object.assign({}, o.textSpec || {}, { text: o.text });
      return new UiText(spec);
    } });
  }
  // STATIC PROPERTIES ---------------------------------------------------
  static get dfltUnpressed() {
    return new Rect({ color: "rgba(255,255,255,.25)" });
  }
  static get dfltHighlight() {
    return new Rect({ borderColor: "yellow", border: 3, fill: false });
  }
  static get dfltPressed() {
    return new Rect({ color: "rgba(255,255,255,.75)" });
  }
  // CONSTRUCTOR ---------------------------------------------------------
  cpost(spec) {
    super.cpost(spec);
    Hierarchy.adopt(this, this._text);
  }
  // EVENT HANDLERS ------------------------------------------------------
  onMouseEntered(evt) {
    super.onMouseEntered(evt);
    if (this.hltext) {
      this._text.text = this.hltext;
    }
    if (this.hlTextSpec) {
      Object.assign(this._text, this.hlTextSpec);
    }
  }
  onMouseExited(evt) {
    super.onMouseExited(evt);
    if (this.hltext) {
      this._text.text = this.text;
    }
    if (this.hlTextSpec) {
      Object.assign(this._text, this.textSpec);
    }
  }
  // METHODS -------------------------------------------------------------
  subrender(ctx) {
    if (this.mouseOver && this.mousePressed) {
      this.renderSketch(ctx, this.pressed);
    } else {
      this.renderSketch(ctx, this.unpressed);
    }
    if (this.mouseOver && !this.mousePressed) {
      this.renderSketch(ctx, this.highlight);
    }
  }
};

// js/uiInput.js
var _UiInputText = class extends UiView {
  // STATIC VARIABLES ----------------------------------------------------
  static get dfltCursor() {
    return new Rect({ color: "rgba(255,255,255,.5)" });
  }
  static {
    Schema.apply(_UiInputText, "token", { link: true, renderable: true, parser: (o, x) => x.hasOwnProperty("token") ? x.token : new TextToken() });
    Schema.apply(_UiInputText, "cursor", { link: true, renderable: true, parser: (o, x) => x.hasOwnProperty("cursor") ? x.cursor : o.constructor.dfltCursor });
    Schema.apply(_UiInputText, "cursorBlinkRate", { dflt: _UiInputText.dfltCursorBlinkRate });
    Schema.apply(_UiInputText, "cursorHeightPct", { dflt: _UiInputText.dfltCursorHeightPct });
    Schema.apply(_UiInputText, "cursorAlignY", { dflt: 0 });
    Schema.apply(_UiInputText, "cursorWidthPct", { dflt: _UiInputText.dfltCursorWidthPct });
    Schema.apply(_UiInputText, "cursorIdx", { serializable: false, renderable: true, parser: (o, x) => o.token.text.length });
    Schema.apply(_UiInputText, "cursorOn", { serializable: false, dflt: false, renderable: true });
    Schema.apply(_UiInputText, "timer", { link: true, eventable: false, serializable: false });
    Schema.apply(_UiInputText, "selected", { serializable: false, dflt: false, renderable: true, onSet: (o, k, v) => o.updateSelected(v) });
  }
  updateSelected(value) {
    this.selected = value;
    if (value) {
      this.cursorOn = true;
      if (this.cursorBlinkRate)
        this.timer = new Timer({ ttl: this.cursorBlinkRate, cb: () => this.cursorOn = !this.cursorOn, loop: true });
    } else {
      this.cursorOn = false;
      if (this.timer) {
        this.timer.destroy();
        this.timer = null;
      }
    }
  }
  subrender(ctx) {
    this.token.render(ctx, this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
    if (this.cursorOn) {
      let cursorBounds = this.token.getCharBounds(this.cursorIdx);
      let cursorHeight = Math.round(cursorBounds.height * this.cursorHeightPct);
      let cursorWidth = Math.round(cursorHeight * this.cursorWidthPct);
      let offX = this.token.alignx * (this.xform.width - this.token.width);
      let offY = this.token.aligny * (this.xform.height - this.token.height);
      offY += (cursorBounds.height - cursorHeight) * this.cursorAlignY;
      this.cursor.render(ctx, this.xform.minx + offX + cursorBounds.x, this.xform.miny + offY, cursorWidth, cursorHeight);
    }
  }
};
var UiInputText = _UiInputText;
__publicField(UiInputText, "dfltCursorBlinkRate", 500);
__publicField(UiInputText, "dfltCursorHeightPct", 0.8);
__publicField(UiInputText, "dfltCursorWidthPct", 0.1);
var _UiInput = class extends UiPanel {
  static get dfltSketch() {
    return new Rect({ color: "rgba(255,255,255,.25)" });
  }
  static get dfltHighlight() {
    return new Rect({ borderColor: "yellow", border: 3, fill: false });
  }
  static get dfltTextFmt() {
    return new TextFormat({ color: "black" });
  }
  static get dfltSelectedTextFmt() {
    return new TextFormat({ color: "yellow" });
  }
  static get dfltEmptyTextFmt() {
    return new TextFormat({ color: "gray", style: "italic" });
  }
  static {
    Schema.apply(_UiInput, "sketch", { parser: (o, x) => x.hasOwnProperty("sketch") ? x.sketch : o.constructor.dfltSketch, link: true, renderable: true });
    Schema.apply(_UiInput, "highlight", { parser: (o, x) => x.hasOwnProperty("highlight") ? x.highlight : o.constructor.dfltHighlight, link: true, renderable: true });
    Schema.apply(_UiInput, "text", { parser: (o, x) => x.hasOwnProperty("text") ? x.text : "default text", renderable: true, onSet: (o, k, v) => o.updateText(v) }), Schema.apply(_UiInput, "emptyText", { renderable: true, dflt: "enter value" }), Schema.apply(_UiInput, "textFmt", { eventable: false, renderable: false, parser: (o, x) => x.textFmt || _UiInput.dfltTextFmt });
    Schema.apply(_UiInput, "selectedTextFmt", { eventable: false, renderable: false, parser: (o, x) => x.selectedTextFmt || _UiInput.dfltSelectedTextFmt });
    Schema.apply(_UiInput, "emptyTextFmt", { eventable: false, renderable: false, parser: (o, x) => x.emptyTextFmt || _UiInput.dfltEmptyTextFmt });
    Schema.apply(_UiInput, "charset", { dflt: _UiInput.dfltCharset });
    Schema.apply(_UiInput, "ttext", { readonly: true, serializable: false, gizmo: true, parser: (o, x) => {
      let ttext = x.ttext || new UiInputText({});
      ttext.token.text = o.text ? o.text : o.emptyText;
      ttext.token.fmt = o.text ? o.textFmt : o.emptyTextFmt;
      if (!o.text)
        ttext.cursorIdx = 0;
      return ttext;
    } });
  }
  // CONSTRUCTOR ---------------------------------------------------------
  cpre(spec) {
    super.cpre(spec);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onSystemMouseClicked = this.onSystemMouseClicked.bind(this);
  }
  cpost(spec) {
    super.cpost(spec);
    EvtSystem.listen(this.gctx, this, "key.down", this.onKeyDown);
    EvtSystem.listen(this.gctx, this, "mouse.clicked", this.onSystemMouseClicked);
    Hierarchy.adopt(this, this.ttext);
  }
  // EVENT HANDLERS ------------------------------------------------------
  onMouseClicked(evt) {
    this.updateSelected(!this.ttext.selected);
    super.onMouseClicked(evt);
  }
  onSystemMouseClicked(evt) {
    if (!this.mouseOver && this.ttext.selected) {
      this.updateSelected(false);
    }
  }
  onKeyDown(evt) {
    if (!this.active)
      return;
    if (!this.ttext.selected)
      return;
    if (evt.key === "Escape") {
      this.updateSelected(false);
      return;
    }
    if (evt.key === "Backspace") {
      if (this.ttext.cursorIdx > 0) {
        this.ttext.cursorIdx = this.ttext.cursorIdx - 1;
        this.text = Util.spliceStr(this.text, this.ttext.cursorIdx, 1);
      }
      return;
    }
    if (evt.key === "ArrowLeft") {
      if (this.ttext.cursorIdx > 0) {
        this.ttext.cursorIdx = this.ttext.cursorIdx - 1;
      }
      return;
    }
    if (evt.key === "ArrowRight") {
      if (this.ttext.cursorIdx < this.text.length) {
        this.ttext.cursorIdx = this.ttext.cursorIdx + 1;
      }
      return;
    }
    if (evt.key === "ArrowUp") {
      if (this.ttext.cursorIdx !== 0) {
        this.ttext.cursorIdx = 0;
      }
      return;
    }
    if (evt.key === "ArrowDown") {
      if (this.ttext.cursorIdx !== this.text.length) {
        this.ttext.cursorIdx = this.text.length;
      }
      return;
    }
    if (evt.key === "Delete") {
      if (this.ttext.cursorIdx < this.text.length) {
        this.text = Util.spliceStr(this.text, this.ttext.cursorIdx, 1);
      }
      return;
    }
    if (evt.key.length > 1)
      return;
    let key = evt.key;
    if (!this.charset.includes(key))
      return;
    let left = this.text.slice(0, this.ttext.cursorIdx);
    let right = this.text.slice(this.ttext.cursorIdx);
    this.text = left + key + right;
    this.ttext.cursorIdx = this.ttext.cursorIdx + 1;
  }
  // METHODS -------------------------------------------------------------
  updateText(value) {
    if (!value) {
      if (this.ttext.selected) {
        this.ttext.token.text = "";
      } else {
        this.ttext.token.text = this.emptyText;
      }
      this.ttext.token.fmt = this.emptyTextFmt;
    } else {
      this.ttext.token.text = value;
      if (this.ttext.selected) {
        this.ttext.token.fmt = this.selectedTextFmt;
      } else {
        this.ttext.token.fmt = this.textFmt;
      }
    }
    if (this.ttext.cursorIdx > value.length)
      this.ttext.cursorIdx = value.length;
  }
  updateSelected(value) {
    this.ttext.selected = value;
    if (value) {
      if (!this.text.length)
        this.ttext.token.text = "";
      this.ttext.token.fmt = this.selectedTextFmt;
    } else {
      if (!this.text.length) {
        this.ttext.token.text = this.emptyText;
        this.ttext.token.fmt = this.emptyTextFmt;
      } else {
        this.ttext.token.fmt = this.textFmt;
      }
    }
  }
  /*
  show() {
      this.sketch.show();
      this._highlight.show();
      this._text.show();
      this._cursor.show();
  }
  hide() {
      this.sketch.hide();
      this._highlight.hide();
      this._text.hide();
      this._cursor.hide();
  }
  */
  subrender(ctx) {
    this.renderSketch(ctx, this.sketch);
    if (this.ttext.selected) {
      this.renderSketch(ctx, this.highlight);
    }
  }
};
var UiInput = _UiInput;
// STATIC VARIABLES ----------------------------------------------------
__publicField(UiInput, "dfltCharset", "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 ");
export {
  Animation,
  Animator,
  AssetRef,
  Assets,
  BaseRef,
  Bounds,
  Evt,
  EvtLink,
  EvtSystem,
  ExBase,
  ExSub,
  ExtEvtEmitter,
  ExtEvtReceiver,
  ExtHierarchy,
  FileLoader,
  Fmt2 as Fmt,
  Game,
  GameState,
  Generator,
  GizmoContext,
  GizmoData,
  GizmoDataArray,
  Hierarchy,
  ImageRef,
  KeySystem,
  Mathf2 as Mathf,
  MouseSystem,
  Random,
  Rect,
  RenderSystem,
  Schema,
  SerialData,
  Serializer,
  Sfx,
  SfxRef,
  SfxSystem,
  SheetRef,
  Sketch,
  Sprite,
  StateMgr,
  Stats,
  System,
  SystemMgr,
  TVect,
  TView,
  TXForm,
  TestProperty,
  TextFormat,
  TextToken,
  Timer,
  UiButton,
  UiCanvas,
  UiInput,
  UiInputText,
  UiPanel,
  UiText,
  UiView,
  UpdateSystem,
  Util,
  Vect,
  XForm
};
