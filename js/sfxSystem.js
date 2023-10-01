export { SfxSystem };

import { Assets } from './asset.js';
import { Evts } from './evt.js';
import { System } from './system.js';
import { Global } from './global.js';

class SfxSystem extends System {
    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('ready', { serializeable: false, parser: false });
        this.schema('decodes', { eventable: false, serializeable: false, parser: (o,x) => ({}) });
        this.schema('ctx', { eventable: false, serializeable: false, parser: (o,x) => null });
        this.schema('assets', { eventable: false, serializeable: false, readonly: true, dflt: () => Assets });
        this.schema('streams', { eventable: false, serializeable: false, parser: (o,x) => ([]) });
        this.schema('reqs', { eventable: false, serializeable: false, parser: (o,x) => ([]) });
        this.schema('volumes', { eventable: false, serializeable: false, parser: (o,x) => (x.volumes || {}) });
        this.schema('gains', { eventable: false, serializeable: false, parser: (o,x) => ({}) });
    }

    // STATIC VARIABLES ----------------------------------------------------
    static dfltVolume = 1;
    static dfltIterateTTL = 0;

    // STATIC METHODS ------------------------------------------------------
    static playSfx( actor, tag, options={} ) {
        Evts.trigger(actor, 'SfxPlay', {
            assetTag: tag,
            options: options,
        });
    }

    static stopSfx( actor, tag ) {
        Evts.trigger(actor, 'SfxStop', {
            assetTag: tag,
        });
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpre(spec) {
        super.cpre(spec);
        this.onSfxRequested = this.onSfxRequested.bind(this);
    }
    cpost(spec) {
        super.cpost(spec);
        // setup event handlers
        Evts.listen(null, 'SfxPlay', this.onSfxRequested, this);
        Evts.listen(null, 'SfxStop', this.onSfxRequested, this);
        // assign master volume
        if (!this.volumes.hasOwnProperty('master')) this.volumes.master = 1;
    }
    
    // EVENT HANDLERS ------------------------------------------------------
    onSfxRequested(evt) {
        // queue request
        this.reqs.push(evt);
        this.active = true;
    }

    // METHODS -------------------------------------------------------------
    prepare(evt) {
        // iterate through queued requests
        let reqs = this.reqs;
        this.reqs = [];
        for (const req of reqs) {
            if (req.tag === 'sfx.play.requested') {
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
        if (!Global.game.userActive) return;
        this.ctx = new AudioContext();
        this.ready = true;
    }

    async playRequest(actor, assetTag, options) {
        if (!options) options = {};
        if (!this.ready) {
            this.initialize();
            if (!this.ready) return;
        }
        // lookup asset
        let sfx = this.assets.get(assetTag);
        if (!sfx || !sfx.media) return;
        // decode asset (or pull from cache)
        let decoded;
        if (!this.decodes[assetTag]) {
            // make a copy of audio buffer (can't be decoded twice)
            let buffer = new ArrayBuffer(sfx.media.data.byteLength);
            new Uint8Array(buffer).set(new Uint8Array(sfx.media.data));
            let p = this.ctx.decodeAudioData(buffer);
            p.then((d) => decoded = d);
            await p;
            this.decodes[assetTag] = decoded;
        } else {
            decoded = this.decodes[assetTag];
        }
        // setup audio stream
        let stream = new AudioBufferSourceNode( this.ctx, {
            buffer: decoded,
            loop: sfx.loop,
        });
        let link = stream;
        // setup sfx volume gain
        let volume = (options.hasOwnProperty('volume')) ? options.volume : (sfx.hasOwnProperty('volume')) ? sfx.volume : 1;
        if (volume !== 1) {
            let gainNode = this.ctx.createGain()
            gainNode.gain.value = volume;
            link.connect(gainNode)
            link = gainNode;
        }
        // get/setup sfx channel
        let channel = (options.hasOwnProperty('channel')) ? options.channel : sfx.channel;
        if (!this.gains[channel]) {
            if (!this.volumes.hasOwnProperty(channel)) {
                this.volumes[channel] = 1;
            }
            let gainNode = this.ctx.createGain()
            gainNode.gain.value = this.volumes[channel];
            this.gains[channel] = gainNode;
            link.connect(gainNode);
            link = gainNode;
        } else {
            link.connect(this.gains[channel]);
            link = null;
        }
        // get/setup main volume
        if (link) {
            if (!this.gains.master) {
                let gainNode = this.ctx.createGain()
                gainNode.gain.value = this.volumes.master;
                this.gains.master = gainNode;
                gainNode.connect(this.ctx.destination)
            }
            link.connect(this.gains.master);
        }

        // track stream
        this.streams.push({
            actor: actor.gid,
            assetTag: assetTag,
            stream: stream,
        });
        stream.addEventListener('ended', () => {
            let idx = this.streams.findIndex((v) => v.stream === stream);
            if (idx !== -1) this.streams.splice(idx, 1);
        });
        // play
        stream.start(0);
    }

    stopRequest(actor, assetTag) {
        if (!actor) return;
        for (let i=this.streams.length-1; i>=0; i--) {
            if (actor.gid !== this.streams[i].actor) continue;
            if (assetTag && assetTag !== this.streams[i].assetTag) continue;
            this.streams.splice(i, 1);
        }
    }

    getVolume(tag) {
        return this.volumes[tag] || 1;
    }

    setVolume(tag, value) {
        if (this.gains[tag]) this.gains[tag].gain.value = value;
        this.volumes[tag] = value;
    }

}
