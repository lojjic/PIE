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
                imgW = imgSize.w,
                imgH = imgSize.h;

            function setSizeAndPos( rect, rectX, rectY, rectW, rectH, sliceX, sliceY, sliceW, sliceH ) {
                // Hide the piece entirely if we have zero dimensions for the image, the rect, or the slice
                var max = Math.max;
                if ( !imgW || !imgH || !rectW || !rectH || !sliceW || !sliceH ) {
                    rect.setStyles( 'display', 'none' );
                } else {
                    rectW = max( rectW, 0 );
                    rectH = max( rectH, 0 );
                    rect.setAttrs(
                        'path', 'm0,0l' + rectW * 2 + ',0l' + rectW * 2 + ',' + rectH * 2 + 'l0,' + rectH * 2 + 'x'
                    );
                    rect.setFillAttrs(
                        'src', src,
                        'type', 'tile',
                        'position', '0,0',
                        'origin', ( ( sliceX - 0.5 ) / imgW ) + ',' + ( ( sliceY - 0.5 ) / imgH ),
                        // For some reason using px units doesn't work in VML markup so we must convert to pt.
                        'size', PIE.Length.pxToPt( rectW * imgW / sliceW ) + 'pt,' + PIE.Length.pxToPt( rectH * imgH / sliceH ) + 'pt'
                    );
                    rect.setSize( rectW, rectH );
                    rect.setStyles(
                        'left', rectX + 'px',
                        'top', rectY + 'px',
                        'display', ''
                    );
                }
            }

            // Piece positions and sizes
            // TODO right now this treats everything like 'stretch', need to support other schemes
            setSizeAndPos( me.getRect( 'tl' ), 0, 0, widthL, widthT, 0, 0, sliceL, sliceT );
            setSizeAndPos( me.getRect( 't' ), widthL, 0, elW - widthL - widthR, widthT, sliceL, 0, imgW - sliceL - sliceR, sliceT );
            setSizeAndPos( me.getRect( 'tr' ), elW - widthR, 0, widthR, widthT, imgW - sliceR, 0, sliceR, sliceT );
            setSizeAndPos( me.getRect( 'r' ), elW - widthR, widthT, widthR, elH - widthT - widthB, imgW - sliceR, sliceT, sliceR, imgH - sliceT - sliceB );
            setSizeAndPos( me.getRect( 'br' ), elW - widthR, elH - widthB, widthR, widthB, imgW - sliceR, imgH - sliceB, sliceR, sliceB );
            setSizeAndPos( me.getRect( 'b' ), widthL, elH - widthB, elW - widthL - widthR, widthB, sliceL, imgH - sliceB, imgW - sliceL - sliceR, sliceB );
            setSizeAndPos( me.getRect( 'bl' ), 0, elH - widthB, widthL, widthB, 0, imgH - sliceB, sliceL, sliceB );
            setSizeAndPos( me.getRect( 'l' ), 0, widthT, widthL, elH - widthT - widthB, 0, sliceT, sliceL, imgH - sliceT - sliceB );
            setSizeAndPos( me.getRect( 'c' ), widthL, widthT, elW - widthL - widthR, elH - widthT - widthB, sliceL, sliceT, props.fill ? imgW - sliceL - sliceR : 0, imgH - sliceT - sliceB );
        }, me );
    },

    getRect: function( name ) {
        return this.getShape( 'borderImage_' + name, this.shapeZIndex );
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
