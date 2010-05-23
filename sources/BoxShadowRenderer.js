/**
 * Renderer for box-shadow
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BoxShadowRenderer = (function() {
    function BoxShadowRenderer( el, styleInfos, parent ) {
        this.element = el;
        this.styleInfos = styleInfos;
        this.parent = parent;
    }
    PIE.Util.merge( BoxShadowRenderer.prototype, PIE.RendererBase, {

        outsetZIndex: 1,
        insetZIndex: 3,

        needsUpdate: function() {
            var si = this.styleInfos;
            return si.boxShadowInfo.changed() || si.borderRadiusInfo.changed();
        },

        isActive: function() {
            return this.styleInfos.boxShadowInfo.isActive();
        },

        updateSize: function() {
            if( this.isActive() ) {
                var el = this.element,
                    shadowInfos = this.styleInfos.boxShadowInfo.getProps(),
                    i = shadowInfos.length,
                    w = el.offsetWidth,
                    h = el.offsetHeight,
                    shadowInfo, box, shape, ss, xOff, yOff, spread, blur, shrink, halfBlur, filter, alpha;

                while( i-- ) {
                    shadowInfo = shadowInfos[ i ];

                    box = this.getBox( shadowInfo.inset );
                    shape = this.getShape( 'shadow' + i, 'fill', box );
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

                    box.appendChild( shape );
                }

                // remove any previously-created border shapes which didn't get used above
                i = shadowInfos.length;
                while( this.deleteShape( 'shadow' + i++ ) ) {}
            } else {
                this.destroy();
            }
        },

        updateProps: function() {
            this.destroy();
            this.updateSize();
        },

        getBox: function( isInset ) {
            var zIndex = isInset ? this.insetZIndex : this.outsetZIndex,
                box = this.parent.getLayer( zIndex );
            if( !box ) {
                box = this.element.document.createElement( ( isInset ? 'inset' : 'outset' ) + '-box-shadow' );
                box.style.position = 'absolute';
                this.parent.addLayer( zIndex, box );

                // Temporarily hide inset shadows, until they are properly implemented
                if( isInset ) {
                    box.style.display = 'none';
                }
            }
            return box;
        },

        destroy: function() {
            this.parent.removeLayer( this.insetZIndex );
            this.parent.removeLayer( this.outsetZIndex );
            delete this._shapes;
        }

    } );

    return BoxShadowRenderer;
})();