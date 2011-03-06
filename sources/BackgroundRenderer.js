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
        PIE.Util.withImageSize( shape.fill.src, function( size ) {
            var fill = shape.fill,
                el = this.targetElement,
                bounds = this.boundsInfo.getBounds(),
                elW = bounds.w,
                elH = bounds.h,
                si = this.styleInfos,
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
        }, this );
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
            angle = info.angle,
            startPos = info.gradientStart,
            stops = info.stops,
            stopCount = stops.length,
            PI = Math.PI,
            UNDEF,
            startX, startY,
            endX, endY,
            startCornerX, startCornerY,
            endCornerX, endCornerY,
            vmlAngle, vmlGradientLength, vmlColors,
            deltaX, deltaY, lineLength,
            stopPx, vmlOffsetPct,
            p, i, j, before, after;

        /**
         * Find the point along a given line (defined by a starting point and an angle), at which
         * that line is intersected by a perpendicular line extending through another point.
         * @param x1 - x coord of the starting point
         * @param y1 - y coord of the starting point
         * @param angle - angle of the line extending from the starting point (in degrees)
         * @param x2 - x coord of point along the perpendicular line
         * @param y2 - y coord of point along the perpendicular line
         * @return [ x, y ]
         */
        function perpendicularIntersect( x1, y1, angle, x2, y2 ) {
            // Handle straight vertical and horizontal angles, for performance and to avoid
            // divide-by-zero errors.
            if( angle === 0 || angle === 180 ) {
                return [ x2, y1 ];
            }
            else if( angle === 90 || angle === 270 ) {
                return [ x1, y2 ];
            }
            else {
                // General approach: determine the Ax+By=C formula for each line (the slope of the second
                // line is the negative inverse of the first) and then solve for where both formulas have
                // the same x/y values.
                var a1 = Math.tan( -angle * PI / 180 ),
                    c1 = a1 * x1 - y1,
                    a2 = -1 / a1,
                    c2 = a2 * x2 - y2,
                    d = a2 - a1,
                    endX = ( c2 - c1 ) / d,
                    endY = ( a1 * c2 - a2 * c1 ) / d;
                return [ endX, endY ];
            }
        }

        // Find the "start" and "end" corners; these are the corners furthest along the gradient line.
        // This is used below to find the start/end positions of the CSS3 gradient-line, and also in finding
        // the total length of the VML rendered gradient-line corner to corner.
        function findCorners() {
            startCornerX = ( angle >= 90 && angle < 270 ) ? w : 0;
            startCornerY = angle < 180 ? h : 0;
            endCornerX = w - startCornerX;
            endCornerY = h - startCornerY;
        }

        // Normalize the angle to a value between [0, 360)
        function normalizeAngle() {
            while( angle < 0 ) {
                angle += 360;
            }
            angle = angle % 360;
        }

        // Find the distance between two points
        function distance( p1, p2 ) {
            var dx = p2[0] - p1[0],
                dy = p2[1] - p1[1];
            return Math.abs(
                dx === 0 ? dy :
                dy === 0 ? dx :
                Math.sqrt( dx * dx + dy * dy )
            );
        }

        // Find the start and end points of the gradient
        if( startPos ) {
            startPos = startPos.coords( el, w, h );
            startX = startPos.x;
            startY = startPos.y;
        }
        if( angle ) {
            angle = angle.degrees();

            normalizeAngle();
            findCorners();

            // If no start position was specified, then choose a corner as the starting point.
            if( !startPos ) {
                startX = startCornerX;
                startY = startCornerY;
            }

            // Find the end position by extending a perpendicular line from the gradient-line which
            // intersects the corner opposite from the starting corner.
            p = perpendicularIntersect( startX, startY, angle, endCornerX, endCornerY );
            endX = p[0];
            endY = p[1];
        }
        else if( startPos ) {
            // Start position but no angle specified: find the end point by rotating 180deg around the center
            endX = w - startX;
            endY = h - startY;
        }
        else {
            // Neither position nor angle specified; create vertical gradient from top to bottom
            startX = startY = endX = 0;
            endY = h;
        }
        deltaX = endX - startX;
        deltaY = endY - startY;

        if( angle === UNDEF ) {
            // Get the angle based on the change in x/y from start to end point. Checks first for horizontal
            // or vertical angles so they get exact whole numbers rather than what atan2 gives.
            angle = ( !deltaX ? ( deltaY < 0 ? 90 : 270 ) :
                        ( !deltaY ? ( deltaX < 0 ? 180 : 0 ) :
                            -Math.atan2( deltaY, deltaX ) / PI * 180
                        )
                    );
            normalizeAngle();
            findCorners();
        }


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
        lineLength = distance( [ startX, startY ], [ endX, endY ] );
        vmlGradientLength = distance( [ startCornerX, startCornerY ], perpendicularIntersect( startCornerX, startCornerY, angle, endCornerX, endCornerY ) );
        vmlColors = [];
        vmlOffsetPct = distance( [ startX, startY ], perpendicularIntersect( startX, startY, angle, startCornerX, startCornerY ) ) / vmlGradientLength * 100;

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
        fill['colors'].value = vmlColors.join( ',' );
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
