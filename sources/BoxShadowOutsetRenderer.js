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
                i = shadowInfos.length,
                w = el.offsetWidth,
                h = el.offsetHeight,
                shadowInfo, shape, ss, xOff, yOff, spread, blur, shrink, halfBlur, filter, alpha;

            while( i-- ) {
                shadowInfo = shadowInfos[ i ];

                shape = this.getShape( 'shadow' + i, 'fill', this.getBox() );
                ss = shape.style;

                xOff = shadowInfo.xOffset.pixels( el );
                yOff = shadowInfo.yOffset.pixels( el );
                spread = shadowInfo.spread.pixels( el ),
                blur = shadowInfo.blur.pixels( el );

                // Adjust the blur value so it's always an even number
                halfBlur = Math.ceil( blur / 2 );
                blur = halfBlur * 2;

                // Apply blur filter to the shape. Applying the blur filter twice with
                // half the pixel value gives a shadow nearly identical to other browsers.
                if( blur > 0 ) {
                    filter = 'progid:DXImageTransform.Microsoft.blur(pixelRadius=' + halfBlur + ')';
                    ss.filter = filter + ' ' + filter;
                }

                // Position and size
                ss.left = xOff - blur;
                ss.top = yOff - blur;
                ss.width = w;
                ss.height = h;

                // Color and opacity
                shape.stroked = false;
                shape.filled = true;
                shape.fillcolor = shadowInfo.color.value( el );

                alpha = shadowInfo.color.alpha();
                if( alpha < 1 ) {
                    shape.fill.opacity = alpha;
                }

                // Blurred shadows end up slightly too wide; shrink them down
                shrink = blur > 0 ? 4 : 0,
                shape.coordsize = ( w * 2 + shrink ) + ',' + ( h * 2 + shrink );

                shape.coordorigin = '1,1';
                shape.path = this.getBoxPath( spread ? { t: -spread, r: -spread, b: -spread, l: -spread } : 0, 2 );
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
