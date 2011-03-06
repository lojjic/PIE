/**
 * Renderer for border-image
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BorderImageRenderer = PIE.RendererBase.newRenderer( {

    boxZIndex: 5,
    pieceNames: [ 't', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl', 'c' ],

    needsUpdate: function() {
        return this.styleInfos.borderImageInfo.changed();
    },

    isActive: function() {
        return this.styleInfos.borderImageInfo.isActive();
    },

    draw: function() {
        this.getBox(); //make sure pieces are created

        var props = this.styleInfos.borderImageInfo.getProps(),
            bounds = this.boundsInfo.getBounds(),
            el = this.targetElement,
            pieces = this.pieces;

        PIE.Util.withImageSize( props.src, function( imgSize ) {
            var elW = bounds.w,
                elH = bounds.h,

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

            // Piece positions and sizes
            function setSizeAndPos( piece, w, h, x, y ) {
                var s = pieces[piece].style,
                    max = Math.max;
                s.width = max(w, 0);
                s.height = max(h, 0);
                s.left = x;
                s.top = y;
            }
            setSizeAndPos( 'tl', widthL, widthT, 0, 0 );
            setSizeAndPos( 't', elW - widthL - widthR, widthT, widthL, 0 );
            setSizeAndPos( 'tr', widthR, widthT, elW - widthR, 0 );
            setSizeAndPos( 'r', widthR, elH - widthT - widthB, elW - widthR, widthT );
            setSizeAndPos( 'br', widthR, widthB, elW - widthR, elH - widthB );
            setSizeAndPos( 'b', elW - widthL - widthR, widthB, widthL, elH - widthB );
            setSizeAndPos( 'bl', widthL, widthB, 0, elH - widthB );
            setSizeAndPos( 'l', widthL, elH - widthT - widthB, 0, widthT );
            setSizeAndPos( 'c', elW - widthL - widthR, elH - widthT - widthB, widthL, widthT );


            // image croppings
            function setCrops( sides, crop, val ) {
                for( var i=0, len=sides.length; i < len; i++ ) {
                    pieces[ sides[i] ]['imagedata'][ crop ] = val;
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
            pieces['c'].style.display = props.fill ? '' : 'none';
        }, this );
    },

    getBox: function() {
        var box = this.parent.getLayer( this.boxZIndex ),
            s, piece, i,
            pieceNames = this.pieceNames,
            len = pieceNames.length;

        if( !box ) {
            box = doc.createElement( 'border-image' );
            s = box.style;
            s.position = 'absolute';

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

            this.parent.addLayer( this.boxZIndex, box );
        }

        return box;
    }

} );
