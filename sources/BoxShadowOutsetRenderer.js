/**
 * Renderer for outset box-shadows
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BoxShadowOutsetRenderer = PIE.RendererBase.newRenderer( {

    zIndex: 1,
    boxName: 'outset-box-shadow',

    needsUpdate: function() {
        var si = this.styleInfos;
        return si.boxShadowInfo.changed() || si.borderRadiusInfo.changed();
    },

    isActive: function() {
        var boxShadowInfo = this.styleInfos.boxShadowInfo;
        return boxShadowInfo.isActive() && boxShadowInfo.getProps().outset[0];
    },

    updateSize: function() {
        if( this.isActive() ) {
            var el = this.element,
                shadowInfos = this.styleInfos.boxShadowInfo.getProps().outset,
                i = shadowInfos.length, j,
                w = el.offsetWidth,
                h = el.offsetHeight,
                corners = [ 'tl', 'tr', 'br', 'bl' ], corner,
                shadowInfo, radii, shape, fill, ss, xOff, yOff, spread, blur, shrink, alpha,
                gradientLength, focusX, focusY;

            while( i-- ) {
                shadowInfo = shadowInfos[ i ];

                shape = this.getShape( 'shadow' + i, 'fill', this.getBox() );
                ss = shape.style;
                fill = shape.fill;

                xOff = shadowInfo.xOffset.pixels( el );
                yOff = shadowInfo.yOffset.pixels( el );
                spread = shadowInfo.spread.pixels( el ),
                blur = shadowInfo.blur.pixels( el );

                // Position and size
                ss.left = xOff;
                ss.top = yOff;
                ss.width = w;
                ss.height = h;
                shape.coordsize = w * 2 + ',' + h * 2;
                //shape.coordorigin = '1,1';

                // Color and opacity
                shape.stroked = false;
                shape.filled = true;
                fill.color = shadowInfo.color.value( el );
                alpha = shadowInfo.color.alpha();
                if( alpha < 1 ) {
                    ss.filter = 'alpha(opacity=' + ( alpha * 100 ) + ')';
                }

                if( blur ) {
                    fill['type'] = 'gradienttitle'; //makes the VML gradient follow the shape's outline - hooray for undocumented features?!?!
                    fill['color2'] = fill.color;
                    fill['opacity'] = 0;

                    gradientLength = blur * 2;
                    var diff = Math.max( gradientLength - w / 2, gradientLength - h / 2 );
                    if( diff > 0 ) {
                        gradientLength -= diff;
                    }

                    focusX = gradientLength / ( w + spread + blur );
                    focusY = gradientLength / ( h + spread + blur );
                    fill['focusposition'] = focusX + ',' + focusY;
                    fill['focussize'] = ( 1 - focusX * 2 ) + ',' + ( 1 - focusY * 2 );

                    // Modify square corners to round them slightly if blurred
                    radii = this.styleInfos.borderRadiusInfo.getProps();
                    if( !radii ) {
                        radii = { x: {}, y: {} };
                        for( j = 4; j--; ) {
                            corner = corners[j];
                            radii.x[ corner ] = radii.y[ corner ] = PIE.Length.ZERO;
                        }
                    }
                }

                // Shape path
                shrink = -spread - blur;
                shape.path = this.getBoxPath( { t: shrink, r: shrink, b: shrink, l: shrink }, 2, radii );
            }
        } else {
            this.destroy();
        }
    },

    updateProps: function() {
        this.destroy();
        this.updateSize();
    }

} );
