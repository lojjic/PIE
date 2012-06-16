/**
 * Renderer for inset box-shadows
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BoxShadowInsetRenderer = PIE.RendererBase.newRenderer( {

    shapeZIndex: 3,

    needsUpdate: function() {
        var si = this.styleInfos;
        return si.boxShadowInfo.changed() || si.borderRadiusInfo.changed() || si.borderInfo.changed();
    },

    isActive: function() {
        var boxShadowInfo = this.styleInfos.boxShadowInfo;
        return boxShadowInfo.isActive() && boxShadowInfo.getProps().inset[0];
    },

    draw: function() {
        var me = this,
            el = me.targetElement,
            styleInfos = me.styleInfos,
            borderInfo = styleInfos.borderInfo.getProps(),
            borderWidths = borderInfo && borderInfo.widths,
            borderT = borderWidths ? borderWidths['t'].pixels( el ) : 0,
            borderR = borderWidths ? borderWidths['r'].pixels( el ) : 0,
            borderB = borderWidths ? borderWidths['b'].pixels( el ) : 0,
            borderL = borderWidths ? borderWidths['l'].pixels( el ) : 0,
            shadowInfos = styleInfos.boxShadowInfo.getProps().inset,
            radii = styleInfos.borderRadiusInfo.getProps(),
            len = shadowInfos.length,
            i = len,
            bounds = me.boundsInfo.getBounds(),
            w = bounds.w,
            h = bounds.h,
            shadowInfo, shape, xOff, yOff, spread, blur, color, alpha, alpha2, path,
            totalW, totalH, focusX, focusY, focusAdjustRatio;

        while( i-- ) {
            shadowInfo = shadowInfos[ i ];
            xOff = shadowInfo.xOffset.pixels( el );
            yOff = shadowInfo.yOffset.pixels( el );
            // Only support offset-less inset shadows for now
            if (!xOff && !yOff) {
                spread = shadowInfo.spread.pixels( el );
                blur = shadowInfo.blur.pixels( el );
                color = shadowInfo.color;
                alpha = color.alpha();
                alpha2 = 0;
                color = color.colorValue( el );

                // Shape path
                path = me.getBoxPath( borderT, borderR, borderB, borderL, 2, radii );

                // Create the shape object
                shape = me.getShape( 'insetShadow' + i, me.shapeZIndex + ( .5 - i / 1000 ) );

                if( blur ) {
                    totalW = w - borderL - borderR;
                    totalH = h - borderT - borderB;
                    focusX = totalW ? blur / totalW : 0;
                    focusY = totalH ? blur / totalH : 0;
                    alpha /= 2;

                    // If the blur is larger than half the element's narrowest dimension, then its focussize
                    // will to be less than zero which results in ugly artifacts. To get around this, we adjust
                    // the focus to keep it centered and then bump the center opacity down to match.
                    if (focusX > 0.5 || focusY > 0.5) {
                        focusAdjustRatio = 0.5 / Math.max(focusX, focusY);
                        focusX *= focusAdjustRatio;
                        focusY *= focusAdjustRatio;
                        alpha2 = alpha - alpha * focusAdjustRatio; //this is a rough eyeball-adjustment, could be refined
                    }

                    shape.setFillAttrs(
                        'type', 'gradienttitle', //makes the VML gradient follow the shape's outline - hooray for undocumented features?!?!
                        'method', 'sigma',
                        'color2', color,
                        'focusposition', focusX + ',' + focusY,
                        'focussize', ( 1 - focusX * 2 ) + ',' + ( 1 - focusY * 2 ),
                        'opacity', alpha,
                        'o:opacity2', alpha2
                    );
                } else {
                    shape.setFillAttrs(
                        'type', 'solid',
                        'opacity', alpha
                    );
                    path += me.getBoxPath( borderT + spread, borderR + spread, borderB + spread, borderL + spread, 2, radii );
                }

                shape.setAttrs(
                    'path', path
                );
                shape.setFillAttrs( 'color', color );
                shape.setSize( w, h );
            }
        }

        // Delete any shadow shapes previously created which weren't reused above
        while( me.deleteShape( 'insetShadow' + len++ ) ) {}
    }

} );