/**
 * Renderer for outset box-shadows
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BoxShadowOutsetRenderer = PIE.RendererBase.newRenderer( {

    shapeZIndex: 1,

    needsUpdate: function() {
        var si = this.styleInfos;
        return si.boxShadowInfo.changed() || si.borderRadiusInfo.changed();
    },

    isActive: function() {
        var boxShadowInfo = this.styleInfos.boxShadowInfo;
        return boxShadowInfo.isActive() && boxShadowInfo.getProps().outset[0];
    },

    draw: function() {
        var me = this,
            el = me.targetElement,
            styleInfos = me.styleInfos,
            shadowInfos = styleInfos.boxShadowInfo.getProps().outset,
            radii = styleInfos.borderRadiusInfo.getProps(),
            len = shadowInfos.length,
            i = len,
            bounds = me.boundsInfo.getBounds(),
            w = bounds.w,
            h = bounds.h,
            shadowInfo, shape, xOff, yOff, spread, blur, shrink, color, alpha, path,
            totalW, totalH, focusX, focusY, focusAdjustRatio;

        while( i-- ) {
            shadowInfo = shadowInfos[ i ];
            xOff = shadowInfo.xOffset.pixels( el );
            yOff = shadowInfo.yOffset.pixels( el );
            spread = shadowInfo.spread.pixels( el );
            blur = shadowInfo.blur.pixels( el );
            color = shadowInfo.color;
            alpha = color.alpha();
            color = color.colorValue( el );

            // Shape path
            shrink = -spread - blur;
            if( !radii && blur ) {
                // If blurring, use a non-null border radius info object so that getBoxPath will
                // round the corners of the expanded shadow shape rather than squaring them off.
                radii = PIE.BorderRadiusStyleInfo.ALL_ZERO;
            }
            path = me.getBoxPath( shrink, shrink, shrink, shrink, 2, radii );

            // Create the shape object
            shape = me.getShape( 'shadow' + i, me.shapeZIndex + ( .5 - i / 1000 ) );

            if( blur ) {
                totalW = ( spread + blur ) * 2 + w;
                totalH = ( spread + blur ) * 2 + h;
                focusX = totalW ? blur * 2 / totalW : 0;
                focusY = totalH ? blur * 2 / totalH : 0;

                // If the blur is larger than half the element's narrowest dimension, then its focussize
                // will to be less than zero which results in ugly artifacts. To get around this, we adjust
                // the focus to keep it centered and then bump the center opacity down to match.
                if (focusX > 0.5 || focusY > 0.5) {
                    focusAdjustRatio = 0.5 / Math.max(focusX, focusY);
                    focusX *= focusAdjustRatio;
                    focusY *= focusAdjustRatio;
                    alpha *= focusAdjustRatio * focusAdjustRatio; //this is a rough eyeball-adjustment, could be refined
                }

                shape.setFillAttrs(
                    'type', 'gradienttitle', //makes the VML gradient follow the shape's outline - hooray for undocumented features?!?!
                    'color2', color,
                    'focusposition', focusX + ',' + focusY,
                    'focussize', ( 1 - focusX * 2 ) + ',' + ( 1 - focusY * 2 ),
                    'opacity', 0,
                    'o:opacity2', alpha
                );
            } else {
                shape.setFillAttrs(
                    'type', 'solid',
                    'opacity', alpha
                );
            }

            shape.setAttrs(
                'path', path
            );
            shape.setFillAttrs( 'color', color );
            shape.setStyles(
                'left', xOff + 'px',
                'top', yOff + 'px'
            );
            shape.setSize( w, h );
        }

        // Delete any shadow shapes previously created which weren't reused above
        while( me.deleteShape( 'shadow' + len++ ) ) {}
    }

} );
