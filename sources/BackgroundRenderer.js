/**
 * Renderer for element backgrounds.
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BackgroundRenderer = PIE.RendererBase.newRenderer( {

    boxZIndex: 2,
    boxName: 'background',

    needsUpdate: function() {
        var si = this.styleInfos;
        return si.backgroundInfo.changed() || si.borderRadiusInfo.changed();
    },

    isActive: function() {
        var si = this.styleInfos;
        return si.borderImageInfo.isActive() ||
               si.borderRadiusInfo.isActive() ||
               si.backgroundInfo.isActive() ||
               ( si.boxShadowInfo.isActive() && si.boxShadowInfo.getProps().inset );
    },

    /**
     * Draw the shapes
     */
    draw: function() {
        var bounds = this.boundsInfo.getBounds();
        if( bounds.w && bounds.h ) {
            this.drawBgColor();
            this.drawBgImages();
        }
    },

    /**
     * Draw the background color shape
     */
    drawBgColor: function() {
        var props = this.styleInfos.backgroundInfo.getProps(),
            bounds = this.boundsInfo.getBounds(),
            el = this.targetElement,
            color = props && props.color,
            shape, w, h, s, alpha;

        if( color && color.alpha() > 0 ) {
            this.hideBackground();

            shape = this.getShape( 'bgColor', 'fill', this.getBox(), 1 );
            w = bounds.w;
            h = bounds.h;
            shape.stroked = false;
            shape.coordsize = w * 2 + ',' + h * 2;
            shape.coordorigin = '1,1';
            shape.path = this.getBoxPath( null, 2 );
            s = shape.style;
            s.width = w;
            s.height = h;
            shape.fill.color = color.colorValue( el );

            alpha = color.alpha();
            if( alpha < 1 ) {
                shape.fill.opacity = alpha;
            }
        } else {
            this.deleteShape( 'bgColor' );
        }
    },

    /**
     * Draw all the background image layers
     */
    drawBgImages: function() {
        var props = this.styleInfos.backgroundInfo.getProps(),
            bounds = this.boundsInfo.getBounds(),
            images = props && props.bgImages,
            img, shape, w, h, s, i;

        if( images ) {
            this.hideBackground();

            w = bounds.w;
            h = bounds.h;

            i = images.length;
            while( i-- ) {
                img = images[i];
                shape = this.getShape( 'bgImage' + i, 'fill', this.getBox(), 2 );

                shape.stroked = false;
                shape.fill.type = 'tile';
                shape.fillcolor = 'none';
                shape.coordsize = w * 2 + ',' + h * 2;
                shape.coordorigin = '1,1';
                shape.path = this.getBoxPath( 0, 2 );
                s = shape.style;
                s.width = w;
                s.height = h;

                if( img.imgType === 'linear-gradient' ) {
                    this.addLinearGradient( shape, img );
                }
                else {
                    shape.fill.src = img.imgUrl;
                    this.positionBgImage( shape, i );
                }
            }
        }

        // Delete any bgImage shapes previously created which weren't used above
        i = images ? images.length : 0;
        while( this.deleteShape( 'bgImage' + i++ ) ) {}
    },


    /**
     * Set the position and clipping of the background image for a layer
     * @param {Element} shape
     * @param {number} index
     */
    positionBgImage: function( shape, index ) {
        var me = this;
        PIE.Util.withImageSize( shape.fill.src, function( size ) {
            var el = me.targetElement,
                bounds = me.boundsInfo.getBounds(),
                elW = bounds.w,
                elH = bounds.h;

            // It's possible that the element dimensions are zero now but weren't when the original
            // update executed, make sure that's not the case to avoid divide-by-zero error
            if( elW && elH ) {
                var fill = shape.fill,
                    si = me.styleInfos,
                    border = si.borderInfo.getProps(),
                    bw = border && border.widths,
                    bwT = bw ? bw['t'].pixels( el ) : 0,
                    bwR = bw ? bw['r'].pixels( el ) : 0,
                    bwB = bw ? bw['b'].pixels( el ) : 0,
                    bwL = bw ? bw['l'].pixels( el ) : 0,
                    bg = si.backgroundInfo.getProps().bgImages[ index ],
                    bgPos = bg.bgPosition ? bg.bgPosition.coords( el, elW - size.w - bwL - bwR, elH - size.h - bwT - bwB ) : { x:0, y:0 },
                    repeat = bg.imgRepeat,
                    pxX, pxY,
                    clipT = 0, clipL = 0,
                    clipR = elW + 1, clipB = elH + 1, //make sure the default clip region is not inside the box (by a subpixel)
                    clipAdjust = PIE.ieVersion === 8 ? 0 : 1; //prior to IE8 requires 1 extra pixel in the image clip region

                // Positioning - find the pixel offset from the top/left and convert to a ratio
                // The position is shifted by half a pixel, to adjust for the half-pixel coordorigin shift which is
                // needed to fix antialiasing but makes the bg image fuzzy.
                pxX = Math.round( bgPos.x ) + bwL + 0.5;
                pxY = Math.round( bgPos.y ) + bwT + 0.5;
                fill.position = ( pxX / elW ) + ',' + ( pxY / elH );

                // Set the size of the image. We have to actually set it to px values otherwise it will not honor
                // the user's browser zoom level and always display at its natural screen size.
                fill['size']['x'] = 1; //Can be any value, just has to be set to "prime" it so the next line works. Weird!
                fill['size'] = size.w + 'px,' + size.h + 'px';

                // Repeating - clip the image shape
                if( repeat && repeat !== 'repeat' ) {
                    if( repeat === 'repeat-x' || repeat === 'no-repeat' ) {
                        clipT = pxY + 1;
                        clipB = pxY + size.h + clipAdjust;
                    }
                    if( repeat === 'repeat-y' || repeat === 'no-repeat' ) {
                        clipL = pxX + 1;
                        clipR = pxX + size.w + clipAdjust;
                    }
                    shape.style.clip = 'rect(' + clipT + 'px,' + clipR + 'px,' + clipB + 'px,' + clipL + 'px)';
                }
            }
        } );
    },


    /**
     * Draw the linear gradient for a gradient layer
     * @param {Element} shape
     * @param {Object} info The object holding the information about the gradient
     */
    addLinearGradient: function( shape, info ) {
        var el = this.targetElement,
            bounds = this.boundsInfo.getBounds(),
            w = bounds.w,
            h = bounds.h,
            fill = shape.fill,
            stops = info.stops,
            stopCount = stops.length,
            PI = Math.PI,
            GradientUtil = PIE.GradientUtil,
            perpendicularIntersect = GradientUtil.perpendicularIntersect,
            distance = GradientUtil.distance,
            metrics = GradientUtil.getGradientMetrics( el, w, h, info ),
            angle = metrics.angle,
            startX = metrics.startX,
            startY = metrics.startY,
            startCornerX = metrics.startCornerX,
            startCornerY = metrics.startCornerY,
            endCornerX = metrics.endCornerX,
            endCornerY = metrics.endCornerY,
            deltaX = metrics.deltaX,
            deltaY = metrics.deltaY,
            lineLength = metrics.lineLength,
            vmlAngle, vmlGradientLength, vmlColors,
            stopPx, vmlOffsetPct,
            p, i, j, before, after;

        // In VML land, the angle of the rendered gradient depends on the aspect ratio of the shape's
        // bounding box; for example specifying a 45 deg angle actually results in a gradient
        // drawn diagonally from one corner to its opposite corner, which will only appear to the
        // viewer as 45 degrees if the shape is equilateral.  We adjust for this by taking the x/y deltas
        // between the start and end points, multiply one of them by the shape's aspect ratio,
        // and get their arctangent, resulting in an appropriate VML angle. If the angle is perfectly
        // horizontal or vertical then we don't need to do this conversion.
        vmlAngle = ( angle % 90 ) ? Math.atan2( deltaX * w / h, deltaY ) / PI * 180 : ( angle + 90 );

        // VML angles are 180 degrees offset from CSS angles
        vmlAngle += 180;
        vmlAngle = vmlAngle % 360;

        // Add all the stops to the VML 'colors' list, including the first and last stops.
        // For each, we find its pixel offset along the gradient-line; if the offset of a stop is less
        // than that of its predecessor we increase it to be equal. We then map that pixel offset to a
        // percentage along the VML gradient-line, which runs from shape corner to corner.
        p = perpendicularIntersect( startCornerX, startCornerY, angle, endCornerX, endCornerY );
        vmlGradientLength = distance( startCornerX, startCornerY, p[0], p[1] );
        vmlColors = [];
        p = perpendicularIntersect( startX, startY, angle, startCornerX, startCornerY );
        vmlOffsetPct = distance( startX, startY, p[0], p[1] ) / vmlGradientLength * 100;

        // Find the pixel offsets along the CSS3 gradient-line for each stop.
        stopPx = [];
        for( i = 0; i < stopCount; i++ ) {
            stopPx.push( stops[i].offset ? stops[i].offset.pixels( el, lineLength ) :
                         i === 0 ? 0 : i === stopCount - 1 ? lineLength : null );
        }
        // Fill in gaps with evenly-spaced offsets
        for( i = 1; i < stopCount; i++ ) {
            if( stopPx[ i ] === null ) {
                before = stopPx[ i - 1 ];
                j = i;
                do {
                    after = stopPx[ ++j ];
                } while( after === null );
                stopPx[ i ] = before + ( after - before ) / ( j - i + 1 );
            }
            // Make sure each stop's offset is no less than the one before it
            stopPx[ i ] = Math.max( stopPx[ i ], stopPx[ i - 1 ] );
        }

        // Convert to percentage along the VML gradient line and add to the VML 'colors' value
        for( i = 0; i < stopCount; i++ ) {
            vmlColors.push(
                ( vmlOffsetPct + ( stopPx[ i ] / vmlGradientLength * 100 ) ) + '% ' + stops[i].color.colorValue( el )
            );
        }

        // Now, finally, we're ready to render the gradient fill. Set the start and end colors to
        // the first and last stop colors; this just sets outer bounds for the gradient.
        fill['angle'] = vmlAngle;
        fill['type'] = 'gradient';
        fill['method'] = 'sigma';
        fill['color'] = stops[0].color.colorValue( el );
        fill['color2'] = stops[stopCount - 1].color.colorValue( el );
        if( fill['colors'] ) { //sometimes the colors object isn't initialized so we have to assign it directly (?)
            fill['colors'].value = vmlColors.join( ',' );
        } else {
            fill['colors'] = vmlColors.join( ',' );
        }
    },


    /**
     * Hide the actual background image and color of the element.
     */
    hideBackground: function() {
        var rs = this.targetElement.runtimeStyle;
        rs.backgroundImage = 'url(about:blank)'; //ensures the background area reacts to mouse events
        rs.backgroundColor = 'transparent';
    },

    destroy: function() {
        PIE.RendererBase.destroy.call( this );
        var rs = this.targetElement.runtimeStyle;
        rs.backgroundImage = rs.backgroundColor = '';
    }

} );
