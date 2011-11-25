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
            el = me.targetElement,

            // Create the shapes up front; if we wait until after image load they sometimes
            // get drawn with no image and a black border.
            tl = me.getRect( 'tl' ),
            t = me.getRect( 't' ),
            tr = me.getRect( 'tr' ),
            r = me.getRect( 'r' ),
            br = me.getRect( 'br' ),
            b = me.getRect( 'b' ),
            bl = me.getRect( 'bl' ),
            l = me.getRect( 'l' ),
            c = me.getRect( 'c' );

        PIE.Util.withImageSize( props.src, function( imgSize ) {
            var me = this,
                elW = bounds.w,
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
                sliceL = slices['l'].pixels( el ),
                src = props.src,
                setSizeAndPos = me.setSizeAndPos,
                setImageData = me.setImageData;

            // Piece positions and sizes
            setSizeAndPos( tl, widthL, widthT, 0, 0 );
            setSizeAndPos( t, elW - widthL - widthR, widthT, widthL, 0 );
            setSizeAndPos( tr, widthR, widthT, elW - widthR, 0 );
            setSizeAndPos( r, widthR, elH - widthT - widthB, elW - widthR, widthT );
            setSizeAndPos( br, widthR, widthB, elW - widthR, elH - widthB );
            setSizeAndPos( b, elW - widthL - widthR, widthB, widthL, elH - widthB );
            setSizeAndPos( bl, widthL, widthB, 0, elH - widthB );
            setSizeAndPos( l, widthL, elH - widthT - widthB, 0, widthT );
            setSizeAndPos( c, elW - widthL - widthR, elH - widthT - widthB, widthL, widthT );


            // image croppings
            // corners
            setImageData( src, 'Bottom', ( imgSize.h - sliceT ) / imgSize.h, tl, t, tr );
            setImageData( src, 'Right', ( imgSize.w - sliceL ) / imgSize.w, tl, l, bl );
            setImageData( src, 'Top', ( imgSize.h - sliceB ) / imgSize.h, bl, b, br );
            setImageData( src, 'Left', ( imgSize.w - sliceR ) / imgSize.w, tr, r, br );

            // edges and center
            // TODO right now this treats everything like 'stretch', need to support other schemes
            //if( props.repeat.v === 'stretch' ) {
                setImageData( src, 'Top', sliceT / imgSize.h, l, r, c );
                setImageData( src, 'Bottom', sliceB / imgSize.h, l, r, c );
            //}
            //if( props.repeat.h === 'stretch' ) {
                setImageData( src, 'Left', sliceL / imgSize.w, t, b, c );
                setImageData( src, 'Right', sliceR / imgSize.w, t, b, c );
            //}

            // center fill
            c.setStyles(
                'display', props.fill ? '' : 'none'
            );
        }, me );
    },

    getRect: function( name ) {
        var shape = this.getShape( 'borderImage_' + name, this.shapeZIndex );
        shape.tagName = 'rect';
        shape.setAttrs(
            'filled', false
        );
        return shape;
    },

    setSizeAndPos: function( piece, w, h, x, y ) {
        var max = Math.max;
        piece.setStyles(
            'width', max( w, 0 ) + 'px',
            'height', max( h, 0 ) + 'px',
            'left', x + 'px',
            'top', y + 'px'
        );
    },

    setImageData: function( src, cropSide, cropVal /*side1, side2, ...*/ ) {
        var args = arguments,
            i = 3, len = args.length;
        for( ; i < len; i++ ) {
            args[i].setImageDataAttrs(
                'src', src,
                'crop' + cropSide, cropVal
            );
        }
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
