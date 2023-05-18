export { BaseRef, SfxRef, ImageRef, SheetRef, AssetRef, resolveImage }

import { Util } from './util.js';

function resolveImage(media, encode=true) {
    let promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.addEventListener('load', () => { 
            return resolve( img );
        });
        img.addEventListener('error', err => { console.error('error: ' + Fmt.ofmt(err)); reject(err) });
        let src = (encode) ? `data:image/png;base64,${Util.arrayBufferToBase64(media)}` : media;
        img.src = src;
    });
    return promise;
}

class BaseRef {
    constructor(spec={}) {
        if (spec.src) this.src = spec.src;
        this.dbg = spec.dbg || false;
    }
    resolve(media) {
        return Promise.resolve(media);
    }
}

class SfxRef extends BaseRef {}

class ImageRef extends BaseRef {
    static _canvas;
    static _ctx;

    static {
        this._canvas = document.createElement('canvas');
        this._ctx = this._canvas.getContext('2d');
    }

    constructor(spec={}) {
        super(spec);
        let scale = spec.scale || 1;
        this.scalex = spec.scalex || scale;
        this.scaley = spec.scaley || scale;
        this.smoothing = spec.hasOwnProperty('smoothing') ? spec.smoothing : true;
    }
    resolve(media) {
        let promise = resolveImage(media);
        if (this.scalex === 1 || this.scaley === 1) {
            return promise;
        } else {
            return promise.then(img => {
                let canvas = this.constructor._canvas;
                let ctx = this.constructor._ctx;
                canvas.width = this.width*this.scalex;
                canvas.height = this.height*this.scaley;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let savedSmoothing = ctx.imageSmoothingEnabled;
                ctx.imageSmoothingEnabled = this.smoothing;
                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
                ctx.imageSmoothingEnabled = savedSmoothing;
                return resolveImage(canvas.toDataURL(), false);
            });
        }
    }
}

class SheetRef extends ImageRef {

    constructor(spec={}) {
        super(spec);
        this.width = spec.width || 0;
        this.height = spec.height || 0;
        this.x = spec.x || 0;
        this.y = spec.y || 0;
    }

    resolve(media) {
        let promise = resolveImage(media);
        return promise.then(img => {
            let canvas = this.constructor._canvas;
            let ctx = this.constructor._ctx;
            canvas.width = this.width*this.scalex;
            canvas.height = this.height*this.scaley;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let savedSmoothing = ctx.imageSmoothingEnabled;
            ctx.imageSmoothingEnabled = this.smoothing;
            ctx.drawImage(img, this.x, this.y, this.width, this.height, 0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = savedSmoothing;
            return resolveImage(canvas.toDataURL(), false);
        });
    }
}

class AssetRef extends BaseRef {
    static xspec(spec={}) {
        return Object.assign({cls: 'AssetRef'}, spec);
    }
    constructor(spec={}) {
        super(spec);
        Object.assign(this, spec);
    }
}

