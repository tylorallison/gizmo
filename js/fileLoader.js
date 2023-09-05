export { FileLoader };

import { Fmt } from './fmt.js';
import { Util } from './util.js';

/**
 * FileLoader resolves file references to data buffers
 */
class FileLoader {
    static dbg = false;

    // STATIC METHODS ------------------------------------------------------

    static async loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.addEventListener("load", () => resolve(img));
            img.addEventListener("error", err => reject(err));
            img.src = src;
        });
    }

    static async loadFile(src) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.crossOrigin = 'Anonymous';
            req.responseType = 'arraybuffer';
            req.addEventListener('load', () => {
                return resolve( req.response );
            });
            req.addEventListener('error', err => { console.error('error: ' + Fmt.ofmt(err)); reject(err) });
            req.open('GET', src, true);
            req.setRequestHeader('Cache-Control', 'no-store');
            req.send()
        });
    }

    static async load(srcs, media={}) {
        return new Promise( (resolve) => {
            let promises = [];
            for (const src of srcs) {
                let promise = this.loadFile(src);
                promise.then((rslt) => { 
                    media[src] = rslt;
                    if (this.dbg) console.log(`loaded tag: ${tag} rslt: ${Fmt.ofmt(rslt)}`);
                });
                promises.push(promise);
            }
            Promise.all(promises).then(() => {
                if (this.dbg) console.log('media loaded...');
                return resolve(media);
            })
        });
    }

}
