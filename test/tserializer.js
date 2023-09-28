import { AssetCtx } from '../js/assetCtx.js';
import { Generator } from '../js/generator.js';
import { Gizmo, Gadget } from '../js/gizmo.js';
import { Rect } from '../js/rect.js';
import { SerialData, Serializer } from '../js/serializer.js';
import { XForm } from '../js/xform.js';

class TSerializerSub extends Gadget {
    static { this.schema('value'); };
};
class TSerializerData extends Gadget {
    static { 
        this.schema('sub', { link: true });
    };
};
class TSerializerGizmo extends Gizmo {
    static { 
        this.schema('data', { link: true });
        this.schema('asset', { link: true });
    };
}

describe('a serializer', () => {
    let actx, sdata, generator;
    beforeEach(async () => {
        sdata = new SerialData();
        actx = new AssetCtx({ xassets: [
            Rect.xspec({tag: 'test.rect', color: 'blue', borderColor: 'red', border: 2, xform: XForm.xspec({ fixedWidth: 32, fixedHeight: 32 })}),
        ]});
        await actx.load();
        generator = new Generator({assets: actx});
    });

    it('can xify a basic gizmo', ()=>{
        let g = new Gizmo({ tag: 'root' });
        let rslt = Serializer.xify(sdata, g);
        expect(rslt).toEqual({ 
            $gzx: true,
            cls: '$GizmoRef', 
            gid: g.gid,
        });
        expect(sdata.xgzos[g.gid]).toEqual({
            $gzx: true,
            cls: 'Gizmo',
            args: [{
                gctx: 1,
                gid: g.gid,
                tag: g.tag,
                children: [],
            }],
        });
        // test restore
        let gzos = Serializer.restore(sdata, generator);
        expect(gzos.length).toEqual(1);
        expect(gzos[0].tag).toEqual('root');
    });

    it('can xify a gizmo chain', ()=>{
        let sub2 = new Gizmo({ tag: 'sub2' });
        let sub1 = new Gizmo({ tag: 'sub1', children: [ sub2 ] });
        let root = new Gizmo({ tag: 'root', children: [ sub1 ] });
        let rslt = Serializer.xify(sdata, root);
        expect(rslt).toEqual({ 
            $gzx: true,
            cls: '$GizmoRef', 
            gid: root.gid 
        });
        expect(sdata.xgzos[sub2.gid]).toEqual({
            $gzx: true,
            cls: 'Gizmo',
            args: [{
                gctx: 1,
                gid: sub2.gid,
                tag: sub2.tag,
                children: [],
            }],
        });
        expect(sdata.xgzos[sub1.gid]).toEqual({
            $gzx: true,
            cls: 'Gizmo',
            args: [{
                gctx: 1,
                gid: sub1.gid,
                tag: sub1.tag,
                children: [ { $gzx: true, cls: '$GizmoRef', gid: sub2.gid }],
            }],
        });
        expect(sdata.xgzos[root.gid]).toEqual({
            $gzx: true,
            cls: 'Gizmo',
            args: [{
                gctx: 1,
                gid: root.gid,
                tag: root.tag,
                children: [ { $gzx: true, cls: '$GizmoRef', gid: sub1.gid }],
            }],
        });
        // test restore
        let gzos = Serializer.restore(sdata, generator);
        expect(gzos.length).toEqual(1);
        expect(gzos[0].tag).toEqual('root');
        expect(gzos[0].children[0].tag).toEqual('sub1');
        expect(gzos[0].children[0].children[0].tag).toEqual('sub2');
    });

    it('can xify a data chain', ()=>{
        let root = new TSerializerGizmo({ 
            tag: 'root', 
            data: new TSerializerData({
                sub: new TSerializerSub({
                    value: 'hello world',
                }),
            }),
        });
        let rslt = Serializer.xify(sdata, root);
        expect(rslt).toEqual({ $gzx: true, cls: '$GizmoRef', gid: root.gid });
        expect(sdata.xgzos[root.gid]).toEqual({
            $gzx: true,
            cls: 'TSerializerGizmo',
            args: [{
                gctx: 1,
                gid: root.gid,
                tag: root.tag,
                children: [],
                data: {
                    $gzx: true,
                    cls: 'TSerializerData',
                    args: [{
                        sub: {
                            $gzx: true,
                            cls: 'TSerializerSub',
                            args: [{
                                value: 'hello world',
                            }],
                        },
                    }]
                },
                asset: undefined,
            }],

        });
        // test restore
        let gzos = Serializer.restore(sdata, generator);
        expect(gzos.length).toEqual(1);
        expect(gzos[0].tag).toEqual('root');
        expect(gzos[0].data.sub.value).toEqual(root.data.sub.value);
    });

    // FIXME
    it('can xify a gizmo with asset ref', ()=>{
        let g = new TSerializerGizmo({ tag: 'root', asset: actx.get('test.rect') });
        let rslt = Serializer.xify(sdata, g);
        expect(rslt).toEqual({ $gzx: true, cls: '$GizmoRef', gid: g.gid });
        expect(sdata.xgzos[g.gid]).toEqual({
            $gzx: true,
            cls: 'TSerializerGizmo',
            args: [{
                gctx: 1,
                gid: g.gid,
                tag: g.tag,
                data: undefined,
                asset: { $gzx: true, cls: '$Asset', args: [{ tag: 'test.rect' }]},
                children: [],
            }],
        });
        // test restore
        let gzos = Serializer.restore(sdata, generator);
        expect(gzos.length).toEqual(1);
        expect(gzos[0].tag).toEqual('root');
        expect(gzos[0].asset.tag).toEqual('test.rect');
    });

});
