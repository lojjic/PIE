/**
 * Renderer for border-image
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BorderImageRenderer = (function() {
    function BorderImageRenderer( el, styleInfos, parent ) {
        this.element = el;
        this.styleInfos = styleInfos;
        this.parent = parent;
    }
    PIE.Util.merge( BorderImageRenderer.prototype, PIE.RendererBase, {

        zIndex: 400,
        pieceNames: [ 't', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl', 'c' ],

        needsUpdate: function() {
            var si = this.styleInfos;
            return si.borderImageInfo.changed() || si.borderImageInfo.changed();
        },

        isActive: function() {
            return this.styleInfos.borderImageInfo.isActive();
        },

        updateSize: function() {
            if( this.isActive() ) {
                var props = this.styleInfos.borderImageInfo.getProps(),
                    box = this.getBox(), //make sure pieces are created
                    el = this.element,
                    p = this.pieces;

                PIE.Util.withImageSize( props.src, function( imgSize ) {
                    var w = el.offsetWidth,
                        h = el.offsetHeight,

                        t = p['t'].style,
                        tr = p['tr'].style,
                        r = p['r'].style,
                        br = p['br'].style,
                        b = p['b'].style,
                        bl = p['bl'].style,
                        l = p['l'].style,
                        tl = p['tl'].style,
                        c = p['c'].style,

                        widths = props.width,
                        widthT = widths.t.pixels( el ),
                        widthR = widths.r.pixels( el ),
                        widthB = widths.b.pixels( el ),
                        widthL = widths.l.pixels( el ),
                        slices = props.slice,
                        sliceT = slices.t.pixels( el ),
                        sliceR = slices.r.pixels( el ),
                        sliceB = slices.b.pixels( el ),
                        sliceL = slices.l.pixels( el );

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
                    function setCrops( sides, crop, val ) {
                        for( var i=0, len=sides.length; i < len; i++ ) {
                            p[ sides[i] ]['imagedata'][ crop ] = val;
                        }
                    }

                    // corners
                    setCrops( [ 'tl', 't', 'tr' ], 'cropBottom', ( imgSize.h - sliceT ) / imgSize.h );
                    setCrops( [ 'tl', 'l', 'bl' ], 'cropRight', ( imgSize.w - sliceL ) / imgSize.w );
                    setCrops( [ 'bl', 'b', 'br' ], 'cropTop', ( imgSize.h - sliceB ) / imgSize.h );
                    setCrops( [ 'tr', 'r', 'br' ], 'cropLeft', ( imgSize.w - sliceR ) / imgSize.w );

                    // edges and center
                    if( props.repeat.v === 'stretch' ) {
                        setCrops( [ 'l', 'r', 'c' ], 'cropTop', sliceT / imgSize.h );
                        setCrops( [ 'l', 'r', 'c' ], 'cropBottom', sliceB / imgSize.h );
                    }
                    if( props.repeat.h === 'stretch' ) {
                        setCrops( [ 't', 'b', 'c' ], 'cropLeft', sliceL / imgSize.w );
                        setCrops( [ 't', 'b', 'c' ], 'cropRight', sliceR / imgSize.w );
                    }

                    // center fill
                    c.display = props.fill ? '' : 'none';
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
                    s['behavior'] = 'url(#default#VML)';
                    s.position = "absolute";
                    s.top = s.left = 0;
                    piece['imagedata'].src = this.styleInfos.borderImageInfo.getProps().src;
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

    return BorderImageRenderer;
})();