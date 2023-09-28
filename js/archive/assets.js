export { Assets };

import { FileLoader } from './fileLoader.js';
import { Fmt } from './fmt.js';
import { GizmoContext } from './gizmo.js';
import { AssetRef, BaseRef } from './refs.js';
import { Util } from './util.js';


class Assets {

    // STATIC METHODS ------------------------------------------------------
    static get(tag, overrides={}, gctx) {
        if (!gctx) gctx = GizmoContext.dflt;
        if (!gctx.game || !gctx.game.assets) return null;
        return gctx.game.assets.get(tag, overrides);
    }
    static add(tag, asset, gctx) {
        if (!gctx) gctx = GizmoContext.dflt;
        if (!gctx.game) return;
        if (!gctx.game.assets) gctx.game.assets = new Assets()
        gctx.game.assets.add(tag, asset);
    }

    // CONSTRUCTOR ---------------------------------------------------------
    constructor(spec={}) {
        // the asset references defined by the user...
        this.specs = Array.from(spec.specs || []);
        // the raw media loaded from media files
        this.media = {};
        // the translated asset references with resolved media files
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
            // clear from unloaded specs
            if (this.specs.includes(spec)) {
                let idx = this.specs.indexOf(spec);
                this.specs.splice(idx, 1);
            }
            let tag = (spec.args && spec.args.length) ? spec.args[0].tag : 'tag';
            // clear from assets
            if (tag in this.assets) {
                delete this.assets[tag];
            }
        }
    }

    getMediaRefs() {
        let mrefs = [];
        for (const [k,v,o] of Util.kvWalk(this.specs)) {
            if (v instanceof BaseRef && v.src && !mrefs.includes(v.src)) {
                mrefs.push(v.src);
            }
        }
        return mrefs;
    }

    async load() {
        // load asset files
        this.media = {}
        await FileLoader.load(this.getMediaRefs(), this.media);
        // populate assets
        for (const spec of this.specs) {
            let args = spec.args;
            let tag = (args && args.length) ? args[0].tag : 'tag';
            if (this.assets.hasOwnProperty(tag)) {
                console.error(`duplicate asset tag detected: ${tag}, previous definition: ${Fmt.ofmt(this.assets[tag])}, skipping: ${Fmt.ofmt(spec)}`);
                continue;
            }
            if (args && args.length) args[0].assetTag = tag;
            // asset spec is copied from input spec
            this.assets[tag] = Object.assign({}, spec);
        }
        // once specs have been loaded, they get cleared
        this.specs = [];
        // resolve media references
        await this.resolve();
        // resolve asset references
        this.resolveAssets();
        // clear media references
        this.media = {}
    }

    async resolve() {
        return new Promise( (resolve) => {
            let promises = [];
            for (const [k,v,o] of Util.kvWalk(this.assets)) {
                if (v instanceof BaseRef && !(v instanceof AssetRef)) {
                    // lookup media reference
                    let media = this.media[v.src];
                    let promise = v.resolve(media);
                    promise.then( (media) => {
                        if (this.dbg) console.log(`resolved k: ${k} v: ${Fmt.ofmt(v)} with media: ${media}`);
                        o[k] = media;
                    });
                    promises.push(promise);
                }
            }
            return Promise.all(promises).then(() => {
                if (this.dbg) console.log('resolve finished');
                resolve();
            });
        });
    }

    resolveAssets() {
        for (const [k,v,o] of Util.kvWalk(this.assets)) {
            if (v instanceof AssetRef) {
                let spec = this.assets[v.tag];
                if (spec) {
                    // apply AssetRef overrides to asset specification
                    spec = Object.assign({}, spec, v);
                    // swap reference
                    o[k] = spec;
                }
            }
        }

    }

    get(tag, overrides={}) {
        let spec = this.assets[tag];
        if (!spec) {
            console.error(`-- missing asset for ${tag}`);
            return null;
        }
        if (spec.args && spec.args.length) spec.args[0] = Object.assign({}, spec.args[0], overrides);
        return spec;
    }

    add(tag, asset) {
        asset.tag = tag;
        this.assets[tag] = asset;
    }

}
