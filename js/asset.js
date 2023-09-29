export { Asset, AssetCtx, Assets };

import { Fmt } from './fmt.js';
import { Gadget } from './gizmo.js';
import { Generator } from './generator.js';
import { GizmoCtx } from './gizmoCtx.js';

/**
 * Assets represent game resources such as textures, audio files, etc. used by the game.
 * Every asset is either linked to the current asset context (the asset context that is in scope when the asset was created)
 * or a global asset list.  Assets linked to the asset context will only be referencable while that asset context is in scope.  Global
 * assets are always referencable once loaded.
 * All assets will be cached within the asset context (or globally) and can be referenced by an asset tag.
 * Asset contents can contain media references.  Media references link an external file/url or data to be loaded with the asset.  Assets will
 * asynchronously load media references.
 * Assets and media references can also be preloaded during asset context advancement.
 */
class Asset extends Gadget {

    static _gid = 1;

    static { this.schema('tag', { dflt: (o) => `${o.constructor.name}.${o.constructor._gid++}`}); }
    static { this.schema('contextable', { readonly: true, dflt: false }); }

    static from(src, spec={}) {
        let asset = new this(spec);
        return asset;
    }

    static async load(src, spec={}) {
        let asset = this.from(src, spec);
        return new Promise((resolve) => {
            asset.load().then(() => {
                resolve(asset);
            });
        });
    }

    async load() {
        return Promise.resolve();
    }

    copy(overrides={}) {
        return new this.constructor(Object.assign({}, this.$store, overrides));
    }

    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }

}

class AssetCtx extends GizmoCtx {
    // the raw media cache (shared for all contexts)
    static media = {};

    // CONSTRUCTOR ---------------------------------------------------------
    constructor(spec={}) {
        super(spec);
        // the asset references defined by the user...
        this.xassets = [];
        // the generated/loaded asset cache
        this.assets = {};
        for (const xasset of (spec.xassets || [])) this.add(xasset);
    }

    async advance() {
        // load unresolves assets
        let xassets = this.xassets;
        this.xassets = [];
        for (const xasset of xassets) {
            let asset = Generator.generate(xasset);
            if (!asset) {
                console.error(`failed to generate asset for: ${Fmt.ofmt(xasset)}`);
                continue;
            }
            if (asset.tag in this.assets) {
                console.error(`duplicate asset tag detected: ${asset.tag}, previous asset: ${this.assets[asset.tag]}, new asset: ${asset}`);
            }
            this.assets[asset.tag] = asset;
        }
        return Promise.all(Object.values(this.assets || {}).map((x) => x.load()));
    }

    add(xassets) {
        if (!Array.isArray(xassets)) xassets = [xassets];
        for (const xasset of xassets) {
            if (xasset instanceof Asset) {
                if (xasset.tag in this.assets) {
                    console.error(`duplicate asset tag detected: ${xasset.tag}, previous asset: ${this.assets[xasset.tag]}, new asset: ${xasset}`);
                }
                this.assets[xasset.tag] = xasset;
            } else {
                this.xassets.push(xasset);
            }
        }
    }

    get(tag, overrides={}) {
        // search for asset tag
        let asset = this.assets[tag];
        if (!asset) {
            console.error(`-- missing asset for ${tag}`);
            return null;
        }
        return asset.copy(Object.assign({}, overrides, { contextable: true }));
    }

    delete(xassets) {
        if (!Array.isArray(xassets)) xassets = [xassets];
        for (const xasset of xassets) {
            if (xasset instanceof Asset) {
                if (xasset.tag in this.assets) delete this.assets[xasset.tag];
            } else {
                let idx = this.xassets.indexOf(xasset);
                if (idx !== -1) this.xassets.splice(idx, 1);
                if (xasset.args && xasset.args.length) {
                    let tag = xasset.args[0].tag;
                    if (tag) delete this.assets[tag];
                }
            }
        }
    }

    deleteTag(tag) {
        if (tag in this.assets) delete this.assets[tag];
    }

    clear() {
        this.xassets = [];
        this.assets = {};
    }

}

const Assets = new AssetCtx();