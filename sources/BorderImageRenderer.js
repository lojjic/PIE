/**
 * Renderer for border-image
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BorderImageRenderer = PIE.RendererBase.newRenderer( {

    shapeZIndex: 5,

    needsUpdate: function() {
        return this.styleInfos.borderImageInfo.changed();
    },

    isActive: function() {
        return this.styleInfos.borderImageInfo.isActive();
    },

    draw: function() {
        var me = this,
            props = me.styleInfos.borderImageInfo.getProps(),
            borderProps = me.styleInfos.borderInfo.getProps(),
            bounds = me.boundsInfo.getBounds(),
            el = me.targetElement;

        PIE.Util.withImageSize( props.src, function( imgSize ) {
            var elW = bounds.w,
                elH = bounds.h,
                zero = PIE.getLength( '0' ),
                widths = props.widths || ( borderProps ? borderProps.widths : { 't': zero, 'r': zero, 'b': zero, 'l': zero } ),
                widthT = widths['t'].pixels( el ),
                widthR = widths['r'].pixels( el ),
                widthB = widths['b'].pixels( el ),
                widthL = widths['l'].pixels( el ),
                slices = props.slice,
                sliceT = slices['t'].pixels( el ),
                sliceR = slices['r'].pixels( el ),
                sliceB = slices['b'].pixels( el ),
                sliceL = slices['l'].pixels( el );

            // Piece positions and sizes
            function setSizeAndPos( piece, w, h, x, y ) {
                var max = Math.max;
                me.getRect( piece ).setStyles(
                    'width', max( w, 0 ) + 'px',
                    'height', max( h, 0 ) + 'px',
                    'left', x + 'px',
                    'top', y + 'px'
                );
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
                var src = props.src,
                    i = 0, len = sides.length;
                for( ; i < len; i++ ) {
                    me.getRect( sides[i] ).setImageDataAttrs(
                        'src', src,
                        crop, val
                    );
                }
            }

            // corners
            setCrops( [ 'tl', 't', 'tr' ], 'cropBottom', ( imgSize.h - sliceT ) / imgSize.h );
            setCrops( [ 'tl', 'l', 'bl' ], 'cropRight', ( imgSize.w - sliceL ) / imgSize.w );
            setCrops( [ 'bl', 'b', 'br' ], 'cropTop', ( imgSize.h - sliceB ) / imgSize.h );
            setCrops( [ 'tr', 'r', 'br' ], 'cropLeft', ( imgSize.w - sliceR ) / imgSize.w );

            // edges and center
            // TODO right now this treats everything like 'stretch', need to support other schemes
            //if( props.repeat.v === 'stretch' ) {
                setCrops( [ 'l', 'r', 'c' ], 'cropTop', sliceT / imgSize.h );
                setCrops( [ 'l', 'r', 'c' ], 'cropBottom', sliceB / imgSize.h );
            //}
            //if( props.repeat.h === 'stretch' ) {
                setCrops( [ 't', 'b', 'c' ], 'cropLeft', sliceL / imgSize.w );
                setCrops( [ 't', 'b', 'c' ], 'cropRight', sliceR / imgSize.w );
            //}

            // center fill
            me.getRect( 'c' ).setStyles(
                'display', props.fill ? '' : 'none'
            );
        }, me );
    },

    getRect: function( name ) {
        var shape = this.getShape( 'borderImage' + name, this.shapeZIndex );
        shape.tagName = 'rect';
        shape.setAttrs(
            'stroked', false,
            'filled', false
        );
        return shape;
    },

    prepareUpdate: function() {
        if (this.isActive()) {
            var me = this,
                el = me.targetElement,
                rs = el.runtimeStyle,
                widths = me.styleInfos.borderImageInfo.getProps().widths;

            // Force border-style to solid so it doesn't collapse
            rs.borderStyle = 'solid';

            // If widths specified in border-image shorthand, override border-width
            if ( widths ) {
                rs.borderTopWidth = widths['t'].pixels( el );
                rs.borderRightWidth = widths['r'].pixels( el );
                rs.borderBottomWidth = widths['b'].pixels( el );
                rs.borderLeftWidth = widths['l'].pixels( el );
            }

            // Make the border transparent
            me.hideBorder();
        }
    },

    destroy: function() {
        var me = this,
            rs = me.targetElement.runtimeStyle;
        rs.borderStyle = '';
        if (me.finalized || !me.styleInfos.borderInfo.isActive()) {
            rs.borderColor = rs.borderWidth = '';
        }
        PIE.RendererBase.destroy.call( me );
    }

} );
