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

        outsetZIndex: 100,
        insetZIndex: 300,

        needsUpdate: function() {
            var si = this.styleInfos;
            return si.boxShadow.changed() || si.borderRadius.changed();
        },

        isActive: function() {
            return this.styleInfos.boxShadow.isActive();
        },

        updateSize: function() {
            if( this.isActive() ) {
                var box = this.getBox(),
                    shape = box.firstChild,
                    s,
                    el = this.element,
                    bs = this.styleInfos.boxShadow.getProps(),
                    spread = bs.spread.pixels( el ),
                    w = el.offsetWidth,
                    h = el.offsetHeight;

                if( bs.inset ) {
                    // if inset, the width does not include any element border
                    s = el.currentStyle;
                    w -= ( parseInt( s.borderLeftWidth, 10 ) || 0 ) + ( parseInt( s.borderRightWidth, 10 ) || 0 );
                    h -= ( parseInt( s.borderTopWidth, 10 ) || 0 ) + ( parseInt( s.borderBottomWidth, 10 ) || 0 );

                    // update width of inner element
                    s = box.firstChild.style;
                    s.width = w - spread * 2;
                    s.height = h - spread * 2;
                } else {
                    w += spread * 2;
                    h += spread * 2;
                }

                s = shape.style;
                s.width = w;
                s.height = h;

                shape.coordsize = ( w + 1 ) + ',' + ( h + 1 ); //shrink the rendered shadow by 1 extra pixel
                shape.path = this.getBoxPath();
            } else {
                this.destroy();
            }
        },

        updateProps: function() {
            this.destroy();
            this.updateSize();
        },

        getBox: function() {
            var box = this._box, s, ss, cs, bs, xOff, yOff, spread, blur, halfBlur, shape, el, filter, alpha;
            if( !box ) {
                el = this.element;
                box = this._box = el.document.createElement( 'box-shadow' );
                bs = this.styleInfos.boxShadow.getProps();
                xOff = bs.xOffset.pixels( el );
                yOff = bs.yOffset.pixels( el );
                blur = bs.blur.pixels( el );
                spread = bs.spread.pixels( el );

                // Adjust the blur value so it's always an even number
                halfBlur = Math.ceil( blur / 2 );
                blur = halfBlur * 2;

                s = box.style;
                s.position = 'absolute';

                shape = this.getShape( 'shadow', 'fill' );
                ss = shape.style;
                shape.stroked = false;

                if( bs.inset ) {
                    cs = this.element.currentStyle;
                    s.overflow = 'hidden';
                    s.left = parseInt( cs.borderLeftWidth, 10 ) || 0;
                    s.top = parseInt( cs.borderTopWidth, 10 ) || 0;
                    s.zIndex = this.insetZIndex;

                    s = shape.style;
                    s.position = 'absolute';

                    //TODO handle wider border if needed due to very large offsets or spread
                    s.left = xOff - 20 + spread - blur;
                    s.top = yOff - 20 + spread - blur;
                    s.border = '20px solid ' + bs.color.value( el );
                } else {
                    s.left = xOff - blur - spread;
                    s.top = yOff - blur - spread;
                    s.zIndex = this.outsetZIndex;

                    shape.filled = true;
                    shape.fillcolor = bs.color.value( el );

                    alpha = bs.color.alpha();
                    if( alpha < 1 ) {
                        shape.fill.opacity = alpha;
                    }
                }

                // Apply blur filter to the outer or inner element. Applying the blur filter twice with
                // half the pixel value gives a shadow nearly identical to other browsers.
                if( blur > 0 ) {
                    filter = 'progid:DXImageTransform.Microsoft.blur(pixelRadius=' + halfBlur + ')';
                    ss.filter = filter + ' ' + filter;
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
            delete this._shapes;
        }

    } );

    return BoxShadowRenderer;
})();