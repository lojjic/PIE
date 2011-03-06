/**
 * Renderer for outset box-shadows
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BoxShadowOutsetRenderer = PIE.RendererBase.newRenderer( {

    boxZIndex: 1,
    boxName: 'outset-box-shadow',

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
            el = this.targetElement,
            box = this.getBox(),
            styleInfos = this.styleInfos,
            shadowInfos = styleInfos.boxShadowInfo.getProps().outset,
            radii = styleInfos.borderRadiusInfo.getProps(),
            len = shadowInfos.length,
            i = len, j,
            bounds = this.boundsInfo.getBounds(),
            w = bounds.w,
            h = bounds.h,
            clipAdjust = PIE.ieVersion === 8 ? 1 : 0, //workaround for IE8 bug where VML leaks out top/left of clip region by 1px
            corners = [ 'tl', 'tr', 'br', 'bl' ], corner,
            shadowInfo, shape, fill, ss, xOff, yOff, spread, blur, shrink, color, alpha, path,
            totalW, totalH, focusX, focusY, isBottom, isRight;


        function getShadowShape( index, corner, xOff, yOff, color, blur, path ) {
            var shape = me.getShape( 'shadow' + index + corner, 'fill', box, len - index ),
                fill = shape.fill;

            // Position and size
            shape['coordsize'] = w * 2 + ',' + h * 2;
            shape['coordorigin'] = '1,1';

            // Color and opacity
            shape['stroked'] = false;
            shape['filled'] = true;
            fill.color = color.colorValue( el );
            if( blur ) {
                fill['type'] = 'gradienttitle'; //makes the VML gradient follow the shape's outline - hooray for undocumented features?!?!
                fill['color2'] = fill.color;
                fill['opacity'] = 0;
            }

            // Path
            shape.path = path;

            // This needs to go last for some reason, to prevent rendering at incorrect size
            ss = shape.style;
            ss.left = xOff;
            ss.top = yOff;
            ss.width = w;
            ss.height = h;

            return shape;
        }


        while( i-- ) {
            shadowInfo = shadowInfos[ i ];
            xOff = shadowInfo.xOffset.pixels( el );
            yOff = shadowInfo.yOffset.pixels( el );
            spread = shadowInfo.spread.pixels( el ),
            blur = shadowInfo.blur.pixels( el );
            color = shadowInfo.color;
            // Shape path
            shrink = -spread - blur;
            if( !radii && blur ) {
                // If blurring, use a non-null border radius info object so that getBoxPath will
                // round the corners of the expanded shadow shape rather than squaring them off.
                radii = PIE.BorderRadiusStyleInfo.ALL_ZERO;
            }
            path = this.getBoxPath( { t: shrink, r: shrink, b: shrink, l: shrink }, 2, radii );

            if( blur ) {
                totalW = ( spread + blur ) * 2 + w;
                totalH = ( spread + blur ) * 2 + h;
                focusX = blur * 2 / totalW;
                focusY = blur * 2 / totalH;
                if( blur - spread > w / 2 || blur - spread > h / 2 ) {
                    // If the blur is larger than half the element's narrowest dimension, we cannot do
                    // this with a single shape gradient, because its focussize would have to be less than
                    // zero which results in ugly artifacts. Instead we create four shapes, each with its
                    // gradient focus past center, and then clip them so each only shows the quadrant
                    // opposite the focus.
                    for( j = 4; j--; ) {
                        corner = corners[j];
                        isBottom = corner.charAt( 0 ) === 'b';
                        isRight = corner.charAt( 1 ) === 'r';
                        shape = getShadowShape( i, corner, xOff, yOff, color, blur, path );
                        fill = shape.fill;
                        fill['focusposition'] = ( isRight ? 1 - focusX : focusX ) + ',' +
                                                ( isBottom ? 1 - focusY : focusY );
                        fill['focussize'] = '0,0';

                        // Clip to show only the appropriate quadrant. Add 1px to the top/left clip values
                        // in IE8 to prevent a bug where IE8 displays one pixel outside the clip region.
                        shape.style.clip = 'rect(' + ( ( isBottom ? totalH / 2 : 0 ) + clipAdjust ) + 'px,' +
                                                     ( isRight ? totalW : totalW / 2 ) + 'px,' +
                                                     ( isBottom ? totalH : totalH / 2 ) + 'px,' +
                                                     ( ( isRight ? totalW / 2 : 0 ) + clipAdjust ) + 'px)';
                    }
                } else {
                    // TODO delete old quadrant shapes if resizing expands past the barrier
                    shape = getShadowShape( i, '', xOff, yOff, color, blur, path );
                    fill = shape.fill;
                    fill['focusposition'] = focusX + ',' + focusY;
                    fill['focussize'] = ( 1 - focusX * 2 ) + ',' + ( 1 - focusY * 2 );
                }
            } else {
                shape = getShadowShape( i, '', xOff, yOff, color, blur, path );
                alpha = color.alpha();
                if( alpha < 1 ) {
                    // shape.style.filter = 'alpha(opacity=' + ( alpha * 100 ) + ')';
                    // ss.filter = 'progid:DXImageTransform.Microsoft.BasicImage(opacity=' + ( alpha  ) + ')';
                    shape.fill.opacity = alpha;
                }
            }
        }
    }

} );
