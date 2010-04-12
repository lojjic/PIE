/**
 * Renderer for border-image
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BorderImageRenderer = function( el, styleInfos, parent ) {
    this.element = el;
    this.styleInfos = styleInfos;
    this.parent = parent;
};
PIE.Util.merge( PIE.BorderImageRenderer.prototype, PIE.RendererBase, {

    zIndex: 400,
    pieceNames: [ 't', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl', 'c' ],

    needsUpdate: function() {
        var si = this.styleInfos;
        return si.borderImage.changed() || si.border.changed();
    },

    isActive: function() {
        return this.styleInfos.borderImage.isActive();
    },

    updateSize: function() {
        if( this.isActive() ) {
            var props = this.styleInfos.borderImage.getProps(),
                box = this.getBox(), //make sure pieces are created
                el = this.element,
                p = this.pieces;

            PIE.Util.withImageSize( props.src, function( imgSize ) {
                var w = el.offsetWidth,
                    h = el.offsetHeight,
                    z = el.currentStyle.zIndex,

                    t = p.t.style,
                    tr = p.tr.style,
                    r = p.r.style,
                    br = p.br.style,
                    b = p.b.style,
                    bl = p.bl.style,
                    l = p.l.style,
                    tl = p.tl.style,
                    c = p.c.style,

                    slices = props.slice,
                    widths = props.width,
                    widthT = widths.t.pixels( el ),
                    widthR = widths.r.pixels( el ),
                    widthB = widths.b.pixels( el ),
                    widthL = widths.l.pixels( el );

                tl.height = t.height = tr.height = widthT;
                tl.width = l.width = bl.width = widthL;
                tr.left = r.left = br.left = w - widthR;
                tr.width = r.width = br.width = widthR;
                br.top = b.top = bl.top = h - widthB;
                br.height = b.height = bl.height = widthB;
                t.left = b.left = c.left = widthL;
                t.width = b.width = c.width = w - widthL - widthR;
                l.top = r.top = c.top = widthT;
                l.height = r.height = c.height = h - widthT - widthB;


                // image croppings

                // corners
                p.tl.imagedata.cropBottom = p.t.imagedata.cropBottom = p.tr.imagedata.cropBottom = ( imgSize.h - slices.t ) / imgSize.h;
                p.tl.imagedata.cropRight = p.l.imagedata.cropRight = p.bl.imagedata.cropRight = ( imgSize.w - slices.l ) / imgSize.w;
                p.bl.imagedata.cropTop = p.b.imagedata.cropTop = p.br.imagedata.cropTop = ( imgSize.h - slices.b ) / imgSize.h;
                p.tr.imagedata.cropLeft = p.r.imagedata.cropLeft = p.br.imagedata.cropLeft = ( imgSize.w - slices.r ) / imgSize.w;

                // edges and center
                if( props.repeat.v === 'stretch' ) {
                    p.l.imagedata.cropTop = p.r.imagedata.cropTop = p.c.imagedata.cropTop = slices.t / imgSize.h;
                    p.l.imagedata.cropBottom = p.r.imagedata.cropBottom = p.c.imagedata.cropBottom = slices.b / imgSize.h;
                }
                if( props.repeat.h === 'stretch' ) {
                    p.t.imagedata.cropLeft = p.b.imagedata.cropLeft = p.c.imagedata.cropLeft = slices.l / imgSize.w;
                    p.t.imagedata.cropRight = p.b.imagedata.cropRight = p.c.imagedata.cropRight = slices.r / imgSize.w;
                }
            }, this );
        } else {
            this.destroy();
        }
    },

    updateProps: function() {
        this.destroy();
        if( this.isActive() ) {
            this.updateSize();
        }
    },

    getBox: function() {
        var box = this._box, s, piece, i,
            pieceNames = this.pieceNames,
            len = pieceNames.length;

        if( !box ) {
            box = this._box = this.element.document.createElement( 'border-image' );
            s = box.style;
            s.position = 'absolute';
            s.zIndex = this.zIndex;

            this.pieces = {};

            for( i = 0; i < len; i++ ) {
                piece = this.pieces[ pieceNames[i] ] = PIE.Util.createVmlElement( 'rect' );
                piece.appendChild( PIE.Util.createVmlElement( 'imagedata' ) );
                s = piece.style;
                s.behavior = 'url(#default#VML)';
                s.position = "absolute";
                s.top = s.left = 0;
                piece.imagedata.src = this.styleInfos.borderImage.getProps().src;
                piece.stroked = false;
                piece.filled = false;
                box.appendChild( piece );
            }

            this.parent.getBox().appendChild( box );
        }

        return box;
    },

    destroy: function() {
        var box = this._box;
        if( box && box.parentNode ) {
            box.parentNode.removeChild( box );
        }
        delete this._box;
    }

} );
