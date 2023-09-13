export { AssetCtx };

import { Asset } from './asset.js';
import { Generator } from './generator.js';
import { GizmoCtx } from './gizmoCtx.js';

class AssetCtx extends GizmoCtx {
    static _instance;

    // the raw media cache (shared for all contexts)
    static media = {};

    static get(tag, overrides={}) {
        return this.instance.get(tag, overrides);
    }
    static add(xasset) {
        return this.instance.add(xasset);
    }
    static async load() {
        return this.instance.load();
    }

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
        return this.load();
    }

    async withdraw() {
        return Promise.resolve();
    }

    async load() {
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
        //return Promise.all(this.assets.map((x) => x.load()));
        return Promise.all(Object.values(this.assets || {}).map((x) => x.load()));
    }

    add(xasset) {
        if (xasset instanceof Asset) {
            if (xasset.tag in this.assets) {
                console.error(`duplicate asset tag detected: ${xasset.tag}, previous asset: ${this.assets[xasset.tag]}, new asset: ${xasset}`);
            }
            this.assets[xasset.tag] = xasset;
        } else {
            this.xassets.push(xasset);
        }
    }

    get(tag, overrides={}) {
        let asset = this.assets[tag];
        // search for asset tag in asset context stack
        if (!asset) {
            for (const ctx of this.constructor.$stack) {
                console.log(`ctx: ${ctx}`);
                if (tag in (ctx.assets)) {
                    asset = ctx.assets[tag];
                    break;
                }
            }
        }
        if (!asset) {
            console.error(`-- missing asset for ${tag}`);
            return null;
        }
        return asset.copy(Object.assign({}, overrides, { contextable: true }));
    }

}